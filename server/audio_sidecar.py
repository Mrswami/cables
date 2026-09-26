"""
TouchArt Studio - High-Performance Python WASAPI Loopback & Multi-Band Spectral Flux Beat Ingestor
Captures bit-perfect Windows system playback (Headphones, Soundcard, Speakers) with <10ms latency.
Computes real-time FFT, Multi-Band Half-Wave Rectified Spectral Flux, Adaptive Thresholding,
and streams live metrics + 64-band EQ data to TouchArt Studio over WebSocket (ws://localhost:8080).
"""

import asyncio
import json
import os
import sys
import time
from collections import deque
import numpy as np
import pyaudiowpatch as pyaudio
import websockets

CHUNK_SIZE = 1024  # 1024 samples @ 48kHz = ~21.3ms window
WS_URI = "ws://localhost:8080"


class WasapiSpectralFluxIngestor:
    def __init__(self):
        self.p = pyaudio.PyAudio()
        self.loopback = None
        self.stream = None
        self.sample_rate = 48000
        self.channels = 2
        self.running = True

        # Signal Processing State
        self.prev_magnitude = np.zeros(CHUNK_SIZE // 2 + 1, dtype=np.float32)
        self.hanning_window = np.hanning(CHUNK_SIZE).astype(np.float32)

        # Spectral Flux Histories for Adaptive Thresholding (sliding window of ~30 frames)
        self.kick_history = deque(maxlen=30)
        self.snare_history = deque(maxlen=30)
        self.hihat_history = deque(maxlen=30)
        self.total_history = deque(maxlen=30)

        # Envelopes & Debounce Timers
        self.kick_envelope = 0.0
        self.snare_envelope = 0.0
        self.hihat_envelope = 0.0
        self.last_kick_time = 0.0
        self.last_snare_time = 0.0
        self.last_hihat_time = 0.0

        # BPM Estimator State
        self.beat_intervals = deque(maxlen=8)
        self.estimated_bpm = 120.0

        # Dynamic Auto-Gain
        self.peak_envelope = 0.1
        self.master_gain = 3.5

        # Organic Asymmetric IIR Smoothing Filters (aiXander & VolkanSah inspiration)
        self.smooth_sub_bass = 0.0
        self.smooth_bass = 0.0
        self.smooth_mid = 0.0
        self.smooth_treble = 0.0
        self.smooth_rms = 0.0
        self.smooth_peak = 0.0
        self.smooth_eq = np.zeros(64, dtype=float)

        self._init_frequency_bands()

    def _init_frequency_bands(self):
        bin_hz = max(1.0, self.sample_rate / float(CHUNK_SIZE))
        # 64 Logarithmically Spaced Bands from 20 Hz to 20,000 Hz
        freq_edges = np.geomspace(20.0, min(20000.0, self.sample_rate / 2.05), 65)
        bin_edges = np.clip(np.round(freq_edges / bin_hz).astype(int), 1, CHUNK_SIZE // 2)
        
        self.eq_bin_ranges = []
        for i in range(64):
            b_start = int(bin_edges[i])
            b_end = max(b_start + 1, int(bin_edges[i + 1]))
            self.eq_bin_ranges.append((b_start, b_end))

        # Musical frequency bin slicing boundaries (excluding DC offset bin 0)
        # Sub-bass: 20-80 Hz
        # Bass: 80-260 Hz
        # Mid: 260-3500 Hz
        # Treble: 3500-18000 Hz
        self.bin_sub_bass = (max(1, int(round(20.0 / bin_hz))), max(2, int(round(80.0 / bin_hz))))
        self.bin_bass = (max(2, int(round(80.0 / bin_hz))), max(3, int(round(260.0 / bin_hz))))
        self.bin_mid = (max(3, int(round(260.0 / bin_hz))), max(10, int(round(3500.0 / bin_hz))))
        self.bin_treble = (max(10, int(round(3500.0 / bin_hz))), min(CHUNK_SIZE // 2, int(round(18000.0 / bin_hz))))

    def find_loopback_device(self):
        try:
            self.loopback = self.p.get_default_wasapi_loopback()
            self.sample_rate = int(self.loopback["defaultSampleRate"])
            self.channels = self.loopback["maxInputChannels"]
            self._init_frequency_bands()
            print(f"[WASAPI Loopback] Found Default Loopback: {self.loopback['name']} ({self.sample_rate} Hz, {self.channels}ch)")
            return True
        except Exception as e:
            print(f"[WASAPI Loopback] Error locating default loopback: {e}")
            # Fallback: search all WASAPI devices for loopback
            for i in range(self.p.get_device_count()):
                try:
                    dev = self.p.get_device_info_by_index(i)
                    if dev.get("isLoopbackDevice", False):
                        self.loopback = dev
                        self.sample_rate = int(dev["defaultSampleRate"])
                        self.channels = dev["maxInputChannels"]
                        self._init_frequency_bands()
                        print(f"[WASAPI Loopback] Fallback selected: {dev['name']}")
                        return True
                except Exception:
                    continue
            return False

    def start_stream(self):
        if not self.find_loopback_device():
            print("[WASAPI Loopback] No WASAPI loopback device available!")
            return False

        try:
            self.stream = self.p.open(
                format=pyaudio.paFloat32,
                channels=self.channels,
                rate=self.sample_rate,
                input=True,
                input_device_index=self.loopback["index"],
                frames_per_buffer=CHUNK_SIZE
            )
            print("[WASAPI Loopback] Audio capture stream opened successfully.")
            return True
        except Exception as e:
            print(f"[WASAPI Loopback] Failed to open stream: {e}")
            return False

    def process_frame(self, raw_bytes):
        now = time.time()
        # Convert byte buffer to float32 numpy array
        audio = np.frombuffer(raw_bytes, dtype=np.float32)
        if len(audio) == 0:
            return None

        # Convert multi-channel to mono
        if self.channels > 1:
            audio = audio.reshape(-1, self.channels).mean(axis=1)

        if len(audio) < CHUNK_SIZE:
            audio = np.pad(audio, (0, CHUNK_SIZE - len(audio)))
        elif len(audio) > CHUNK_SIZE:
            audio = audio[:CHUNK_SIZE]

        # Time-domain metrics
        peak_val = float(np.max(np.abs(audio)))
        rms_val = float(np.sqrt(np.mean(audio ** 2)))

        # Squelch / Noise Floor Gate: Prevents AGC from boosting background hiss / silence to 100%
        if peak_val < 0.003:
            agc_gain = 0.0
            raw_sub_bass = 0.0
            raw_bass = 0.0
            raw_mid = 0.0
            raw_treble = 0.0
            raw_rms = 0.0
            raw_peak = 0.0
        else:
            # Dynamic Peak Envelope Tracking with controlled floor
            if peak_val > self.peak_envelope:
                self.peak_envelope = min(1.0, peak_val)
            else:
                self.peak_envelope = max(0.12, self.peak_envelope * 0.995)

            agc_gain = (1.0 / self.peak_envelope) * self.master_gain

        # Windowed Real-FFT (excluding DC bin 0)
        windowed = audio * self.hanning_window
        fft_complex = np.fft.rfft(windowed)
        magnitude = np.abs(fft_complex)
        magnitude[0] = 0.0  # Clear DC offset

        # Half-wave rectified spectral flux for beat detection
        flux = np.maximum(0.0, magnitude - self.prev_magnitude)
        self.prev_magnitude = magnitude

        # Musical frequency bin slicing
        s0, s1 = self.bin_sub_bass
        b0, b1 = self.bin_bass
        m0, m1 = self.bin_mid
        t0, t1 = self.bin_treble

        sub_bass_mag = float(np.mean(magnitude[s0:s1])) if s1 > s0 else 0.0
        bass_mag = float(np.mean(magnitude[b0:b1])) if b1 > b0 else 0.0
        mid_mag = float(np.mean(magnitude[m0:m1])) if m1 > m0 else 0.0
        treble_mag = float(np.mean(magnitude[t0:t1])) if t1 > t0 else 0.0

        kick_flux = float(np.sum(flux[b0:b1])) if b1 > b0 else 0.0
        snare_flux = float(np.sum(flux[m0:min(m1, m0 + 40)]))
        hihat_flux = float(np.sum(flux[t0:t1])) if t1 > t0 else 0.0
        total_flux = float(np.sum(flux[1:]))

        # Update statistical histories
        self.kick_history.append(kick_flux)
        self.snare_history.append(snare_flux)
        self.hihat_history.append(hihat_flux)
        self.total_history.append(total_flux)

        # Kick Beat Detection (Adaptive Thresholding)
        kick_mean = np.mean(self.kick_history) if len(self.kick_history) > 5 else 0.0
        kick_std = np.std(self.kick_history) if len(self.kick_history) > 5 else 0.0
        kick_threshold = kick_mean + 1.35 * kick_std + 0.03

        # Smooth Kick Beat Envelope (Analog Light-Filament Decay)
        self.kick_envelope = max(0.0, self.kick_envelope * 0.91)
        is_kick = False
        if kick_flux > kick_threshold and (now - self.last_kick_time) > 0.16 and kick_flux > 0.03 and agc_gain > 0:
            is_kick = True
            # Soft musical attack rather than a binary square step
            self.kick_envelope = min(1.0, self.kick_envelope * 0.4 + 0.6)
            if self.last_kick_time > 0:
                interval = now - self.last_kick_time
                if 0.28 <= interval <= 1.0:  # 60 to 214 BPM
                    self.beat_intervals.append(interval)
                    median_ibi = np.median(self.beat_intervals)
                    self.estimated_bpm = round(60.0 / median_ibi, 1)
            self.last_kick_time = now

        # Snare / Mid Onset Detection
        self.snare_envelope = max(0.0, self.snare_envelope * 0.88)
        is_snare = False
        if snare_flux > (np.mean(self.snare_history) + 1.4 * np.std(self.snare_history) + 0.03) and (now - self.last_snare_time) > 0.14 and agc_gain > 0:
            is_snare = True
            self.snare_envelope = min(1.0, self.snare_envelope * 0.4 + 0.6)
            self.last_snare_time = now

        # Hi-Hat / High Treble Transient
        self.hihat_envelope = max(0.0, self.hihat_envelope * 0.86)
        is_hihat = False
        if hihat_flux > (np.mean(self.hihat_history) + 1.35 * np.std(self.hihat_history) + 0.02) and (now - self.last_hihat_time) > 0.08 and agc_gain > 0:
            is_hihat = True
            self.hihat_envelope = min(1.0, self.hihat_envelope * 0.4 + 0.6)
            self.last_hihat_time = now

        if agc_gain > 0:
            raw_sub_bass = min(1.0, float((sub_bass_mag * agc_gain) ** 1.1))
            raw_bass = min(1.0, float((bass_mag * agc_gain) ** 1.1))
            raw_mid = min(1.0, float((mid_mag * agc_gain * 1.2) ** 1.1))
            raw_treble = min(1.0, float((treble_mag * agc_gain * 2.0) ** 1.1))
            raw_rms = min(1.0, float(rms_val * agc_gain))
            raw_peak = min(1.0, float(peak_val * agc_gain))

        # Asymmetric IIR Temporal Filter (Fast Attack, Silky Graceful Decay)
        # Prevents violent jitter & visual strobing while maintaining high organic responsiveness
        def iir_smooth(prev, target, attack=0.38, decay=0.88):
            if target > prev:
                return prev * (1.0 - attack) + target * attack
            else:
                return prev * decay + target * (1.0 - decay)

        self.smooth_sub_bass = iir_smooth(self.smooth_sub_bass, raw_sub_bass, 0.40, 0.90)
        self.smooth_bass = iir_smooth(self.smooth_bass, raw_bass, 0.45, 0.89)
        self.smooth_mid = iir_smooth(self.smooth_mid, raw_mid, 0.35, 0.88)
        self.smooth_treble = iir_smooth(self.smooth_treble, raw_treble, 0.35, 0.86)
        self.smooth_rms = iir_smooth(self.smooth_rms, raw_rms, 0.30, 0.92)
        self.smooth_peak = iir_smooth(self.smooth_peak, raw_peak, 0.50, 0.90)

        # 64-Band EQ Bars with true musical frequency mapping and pink noise perceptual tilt
        eq_bars = []
        for i, (idx_start, idx_end) in enumerate(self.eq_bin_ranges):
            band_val = float(np.mean(magnitude[idx_start:idx_end]))
            # ISO 226 equal-loudness / pink noise tilt compensation
            tilt = 1.0 + (i / 63.0) ** 1.2 * 3.5
            norm_val = min(255.0, band_val * agc_gain * tilt * 110.0) if agc_gain > 0 else 0.0

            # Asymmetric bar decay (aiXander & VolkanSah algorithm)
            if norm_val > self.smooth_eq[i]:
                self.smooth_eq[i] = self.smooth_eq[i] * 0.35 + norm_val * 0.65
            else:
                self.smooth_eq[i] = self.smooth_eq[i] * 0.90 + norm_val * 0.10
            eq_bars.append(int(self.smooth_eq[i]))

        return {
            "type": "push_audio_metrics",
            "source": "python_wasapi_loopback",
            "audio": {
                "subBass": round(self.smooth_sub_bass, 3),
                "bass": round(self.smooth_bass, 3),
                "mid": round(self.smooth_mid, 3),
                "treble": round(self.smooth_treble, 3),
                "rms": round(self.smooth_rms, 3),
                "peak": round(self.smooth_peak, 3),
                "beat": round(self.kick_envelope, 3),
                "isKick": is_kick,
                "isSnare": is_snare,
                "isHihat": is_hihat,
                "spectralFlux": round(min(1.0, total_flux * 0.1), 3),
                "bpm": self.estimated_bpm,
                "deviceName": self.loopback["name"] if self.loopback else "WASAPI Loopback"
            },
            "fft": eq_bars
        }

    def close(self):
        self.running = False
        if self.stream:
            try:
                self.stream.stop_stream()
                self.stream.close()
            except Exception:
                pass
        self.p.terminate()


async def run_bridge():
    print("=======================================================")
    print(" TouchArt Studio - Python WASAPI Loopback Audio Bridge")
    print(f" Connecting to Visualizer Server: {WS_URI}")
    print("=======================================================")

    ingestor = WasapiSpectralFluxIngestor()
    if not ingestor.start_stream():
        print("[WASAPI Loopback] Fatal: Could not initialize audio stream. Exiting.")
        return

    while True:
        try:
            print(f"[WASAPI Bridge] Connecting to {WS_URI}...")
            async with websockets.connect(WS_URI, ping_interval=10, ping_timeout=10) as ws:
                print(f"[WASAPI Bridge] Connected to TouchArt Studio! Streaming loopback audio...")

                loop = asyncio.get_event_loop()

                while True:
                    # Read audio in executor to prevent blocking the async loop
                    data = await loop.run_in_executor(
                        None, ingestor.stream.read, CHUNK_SIZE, False
                    )
                    payload = ingestor.process_frame(data)
                    if payload:
                        await ws.send(json.dumps(payload))

        except (websockets.ConnectionClosed, ConnectionRefusedError, OSError) as e:
            print(f"[WASAPI Bridge] WebSocket connection lost ({e}). Reconnecting in 2 seconds...")
            await asyncio.sleep(2.0)
        except Exception as e:
            print(f"[WASAPI Bridge] Unexpected error: {e}. Reconnecting in 3 seconds...")
            await asyncio.sleep(3.0)


if __name__ == "__main__":
    try:
        asyncio.run(run_bridge())
    except KeyboardInterrupt:
        print("\n[WASAPI Bridge] Shutting down cleanly...")
