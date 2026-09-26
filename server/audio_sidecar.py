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

        # Pre-compute 64 EQ band bin indices (logarithmic distribution)
        self.eq_bin_indices = np.round(
            np.geomspace(1, CHUNK_SIZE // 2, 65)
        ).astype(int)

    def find_loopback_device(self):
        try:
            self.loopback = self.p.get_default_wasapi_loopback()
            self.sample_rate = int(self.loopback["defaultSampleRate"])
            self.channels = self.loopback["maxInputChannels"]
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

        # Dynamic Peak Envelope Tracking
        if peak_val > self.peak_envelope:
            self.peak_envelope = min(1.0, peak_val)
        else:
            self.peak_envelope = max(0.04, self.peak_envelope * 0.992)

        agc_gain = (1.0 / self.peak_envelope) * self.master_gain

        # Windowed Real-FFT
        windowed = audio * self.hanning_window
        fft_complex = np.fft.rfft(windowed)
        magnitude = np.abs(fft_complex)

        # Half-wave rectified spectral flux
        flux = np.maximum(0.0, magnitude - self.prev_magnitude)
        self.prev_magnitude = magnitude

        # Musical frequency bin slicing (bin resolution ~ 46.875 Hz @ 48kHz)
        # Sub-bass: 0-100Hz (bins 0-2)
        # Bass/Kick: 100-280Hz (bins 2-6)
        # Mid/Vocal/Snare: 280-3500Hz (bins 6-75)
        # Treble/Hihats: 3500-16000Hz (bins 75-340)
        sub_bass_mag = float(np.mean(magnitude[0:2])) if len(magnitude) > 2 else 0.0
        bass_mag = float(np.mean(magnitude[2:6])) if len(magnitude) > 6 else 0.0
        mid_mag = float(np.mean(magnitude[6:75])) if len(magnitude) > 75 else 0.0
        treble_mag = float(np.mean(magnitude[75:340])) if len(magnitude) > 340 else 0.0

        kick_flux = float(np.sum(flux[0:6]))
        snare_flux = float(np.sum(flux[6:50]))
        hihat_flux = float(np.sum(flux[50:280]))
        total_flux = float(np.sum(flux))

        # Update statistical histories
        self.kick_history.append(kick_flux)
        self.snare_history.append(snare_flux)
        self.hihat_history.append(hihat_flux)
        self.total_history.append(total_flux)

        # Kick Beat Detection (Adaptive Thresholding)
        kick_mean = np.mean(self.kick_history) if len(self.kick_history) > 5 else 0.0
        kick_std = np.std(self.kick_history) if len(self.kick_history) > 5 else 0.0
        kick_threshold = kick_mean + 1.25 * kick_std + 0.02

        # Smooth Kick Beat Envelope (Analog Light-Filament Decay)
        self.kick_envelope = max(0.0, self.kick_envelope * 0.91)
        is_kick = False
        if kick_flux > kick_threshold and (now - self.last_kick_time) > 0.16 and kick_flux > 0.03:
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
        if snare_flux > snare_threshold and (now - self.last_snare_time) > 0.14:
            is_snare = True
            self.snare_envelope = min(1.0, self.snare_envelope * 0.4 + 0.6)
            self.last_snare_time = now

        # Hi-Hat / High Treble Transient
        self.hihat_envelope = max(0.0, self.hihat_envelope * 0.86)
        is_hihat = False
        if hihat_flux > hihat_threshold and (now - self.last_hihat_time) > 0.08:
            is_hihat = True
            self.hihat_envelope = min(1.0, self.hihat_envelope * 0.4 + 0.6)
            self.last_hihat_time = now

        # Raw Scaled Metrics
        raw_sub_bass = min(1.0, float((sub_bass_mag * agc_gain) ** 1.15))
        raw_bass = min(1.0, float((bass_mag * agc_gain) ** 1.15))
        raw_mid = min(1.0, float((mid_mag * agc_gain) ** 1.15))
        raw_treble = min(1.0, float((treble_mag * agc_gain * 1.5) ** 1.15))
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

        # 64-Band EQ Bars with Temporal Ballistics Smoothing (aiXander & VolkanSah algorithm)
        eq_bars = []
        for i in range(64):
            idx_start = self.eq_bin_indices[i]
            idx_end = max(idx_start + 1, self.eq_bin_indices[i + 1])
            band_val = float(np.mean(magnitude[idx_start:idx_end]))
            # Perceptual tilt curve
            tilt = 1.0 + (i / 64.0) * 2.2
            norm_val = min(255.0, band_val * agc_gain * tilt * 140.0)

            # Asymmetric bar decay
            if norm_val > self.smooth_eq[i]:
                self.smooth_eq[i] = self.smooth_eq[i] * 0.35 + norm_val * 0.65
            else:
                self.smooth_eq[i] = self.smooth_eq[i] * 0.88 + norm_val * 0.12
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
