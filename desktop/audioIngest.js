/**
 * Audio Ingestion & Hardware Device Spectrum Engine for TouchArt Studio
 */

class TouchArtAudioIngest {
  constructor(onMetricsCallback) {
    this.onMetricsCallback = onMetricsCallback;
    this.audioCtx = null;
    this.analyser = null;
    this.micStream = null;
    this.ws = null;
    this.isSimulating = false;
    this.simulationStep = 0;
    this.currentDeviceId = null;
    
    // Sensitivity & Auto-Gain Multipliers
    this.masterGain = 3.5;
    this.enableAGC = true; // Automatic Gain Control
    this.peakEnvelope = 0.1;

    // Beat Detection & Rhythm Envelope Tracking
    this.beatDecay = 0.0;
    this.bassAvg = 0.05;
    this.lastBeatTime = 0;
    this.rhythmPhase = 0.0;
    this.lastProcessTime = performance.now();

    this.metrics = {
      subBass: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      rms: 0,
      peak: 0,
      beat: 0,
      rhythmPhase: 0,
      lfoSine: 0,
      lfoSaw: 0
    };

    this.connectWebSocketSync();
  }

  initAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.6; // Faster, more sensitive response
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Enumerate all connected audio hardware devices (Headphones, Soundcard, Mic, Bluetooth, Stereo Mix)
   */
  async getHardwareDevices() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        stream.getTracks().forEach(t => t.stop());
      }).catch(() => {});

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput' || device.kind === 'audiooutput');
      
      return audioDevices.map((d, index) => ({
        id: d.deviceId,
        label: d.label || `Audio Device ${index + 1} (${d.kind === 'audiooutput' ? 'Headphones/Speakers' : 'Input'})`,
        kind: d.kind
      }));
    } catch (err) {
      console.error('[Audio Ingest] Could not enumerate devices:', err);
      return [];
    }
  }

  /**
   * Capture System Desktop Loopback Audio (captures whatever is playing through headphones/speakers live)
   */
  async startSystemAudioLoopback() {
    try {
      this.initAudioContext();
      this.isSimulating = false;

      if (this.micStream) {
        this.micStream.getTracks().forEach(t => t.stop());
      }

      // getDisplayMedia captures system audio stream directly on Windows/Chromium
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      this.micStream = stream;
      const audioTrack = stream.getAudioTracks()[0];
      
      if (!audioTrack) {
        alert('No audio track selected! Please check "Share audio" when picking your screen/window.');
        return false;
      }

      const sourceNode = this.audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      sourceNode.connect(this.analyser);

      this.processAudioLoop();
      return true;
    } catch (err) {
      console.error('[Audio Ingest] System audio loopback error:', err);
      return false;
    }
  }

  /**
   * Capture specific hardware device (e.g. JBL Vibe Beam 2, Realtek Soundcard, Stereo Mix)
   */
  async startAudioDevice(deviceId = null) {
    try {
      this.initAudioContext();
      this.isSimulating = false;
      this.currentDeviceId = deviceId;

      if (this.micStream) {
        this.micStream.getTracks().forEach(t => t.stop());
      }

      const constraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      };

      this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      const sourceNode = this.audioCtx.createMediaStreamSource(this.micStream);
      sourceNode.connect(this.analyser);

      this.processAudioLoop();
      return true;
    } catch (err) {
      console.error('[Audio Ingest] Could not start audio device:', err);
      if (deviceId) {
        return this.startAudioDevice(null);
      }
      return false;
    }
  }

  connectWebSocketSync() {
    try {
      this.ws = new WebSocket('ws://localhost:8080');
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if ((msg.type === 'sync_update' || msg.type === 'init') && msg.data && msg.data.audio) {
            this.metrics = { ...this.metrics, ...msg.data.audio };
            if (this.onMetricsCallback) this.onMetricsCallback(this.metrics);
          }
        } catch (e) {}
      };
    } catch (e) {}
  }

  processAudioLoop() {
    if (!this.analyser || this.isSimulating) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastProcessTime) / 1000.0));
    this.lastProcessTime = now;

    let subBassSum = 0, subBassCount = 0;
    let bassSum = 0, bassCount = 0;
    let midSum = 0, midCount = 0;
    let trebleSum = 0, trebleCount = 0;
    let totalSum = 0;

    // Musical frequency bin ranges with high-frequency pre-emphasis
    for (let i = 0; i < bufferLength; i++) {
      const val = dataArray[i] / 255.0;
      totalSum += val;

      if (i <= 2) {
        // Sub-Bass (0 - ~180 Hz)
        subBassSum += val;
        subBassCount++;
      } else if (i <= 8) {
        // Punchy Bass & Kicks (~180 - ~750 Hz)
        bassSum += val;
        bassCount++;
      } else if (i <= 45) {
        // Mids, Snares, Vocals (~750 - ~4200 Hz)
        midSum += val;
        midCount++;
      } else if (i <= 180) {
        // Treble & Hi-hats with progressive psychoacoustic boost
        const preEmphasis = 1.0 + ((i - 45) / 135.0) * 1.8;
        trebleSum += Math.min(1.0, val * preEmphasis);
        trebleCount++;
      }
    }

    let rawSubBass = subBassCount > 0 ? subBassSum / subBassCount : 0;
    let rawBass = bassCount > 0 ? bassSum / bassCount : 0;
    let rawMid = midCount > 0 ? midSum / midCount : 0;
    let rawTreble = trebleCount > 0 ? trebleSum / trebleCount : 0;
    let rawRms = totalSum / bufferLength;
    let currentPeak = Math.max(rawSubBass, rawBass, rawMid, rawTreble);

    // Automatic Gain Control (AGC Peak Envelope Tracking)
    if (this.enableAGC) {
      if (currentPeak > this.peakEnvelope) {
        this.peakEnvelope = Math.min(1.0, currentPeak);
      } else {
        this.peakEnvelope = Math.max(0.06, this.peakEnvelope * 0.993); // Musical decay envelope
      }
    } else {
      this.peakEnvelope = 0.5;
    }

    const agcMultiplier = (1.0 / this.peakEnvelope) * this.masterGain;

    // Highly responsive & expanded frequency metrics
    this.metrics.subBass = Math.min(1.0, Math.pow(rawSubBass * agcMultiplier, 1.15));
    this.metrics.bass = Math.min(1.0, Math.pow(rawBass * agcMultiplier, 1.15));
    this.metrics.mid = Math.min(1.0, Math.pow(rawMid * agcMultiplier, 1.15));
    this.metrics.treble = Math.min(1.0, Math.pow(rawTreble * agcMultiplier, 1.15));
    this.metrics.rms = Math.min(1.0, rawRms * agcMultiplier);
    this.metrics.peak = Math.max(this.metrics.subBass, this.metrics.bass, this.metrics.mid, this.metrics.treble);

    // Transient Beat & Rhythm Detector
    const instantBass = (rawSubBass * 1.4 + rawBass) * 0.5;
    this.bassAvg = this.bassAvg * 0.94 + instantBass * 0.06;

    this.beatDecay = Math.max(0.0, this.beatDecay * 0.88);
    if (instantBass > this.bassAvg * 1.30 && instantBass > 0.03 && this.beatDecay < 0.35 && (now - this.lastBeatTime > 180)) {
      this.beatDecay = 1.0;
      this.lastBeatTime = now;
    }
    this.metrics.beat = this.beatDecay;

    // Audio-Synced Rhythm Phase Clock & LFOs
    const rhythmRate = 2.5 + this.metrics.bass * 4.0 + this.metrics.beat * 3.0;
    this.rhythmPhase = (this.rhythmPhase + dt * rhythmRate) % (Math.PI * 2.0);
    this.metrics.rhythmPhase = this.rhythmPhase;
    this.metrics.lfoSine = Math.sin(this.rhythmPhase) * 0.5 + 0.5;
    this.metrics.lfoSaw = (this.rhythmPhase / (Math.PI * 2.0));

    if (this.onMetricsCallback) {
      this.onMetricsCallback(this.metrics, dataArray);
    }

    requestAnimationFrame(() => this.processAudioLoop());
  }

  toggleSimulation(enable) {
    this.isSimulating = enable;
    if (enable) {
      this.runSimulationLoop();
    }
  }

  runSimulationLoop() {
    if (!this.isSimulating) return;

    this.simulationStep++;
    const t = this.simulationStep * 0.05;
    const isBeat = this.simulationStep % 10 === 0;
    if (isBeat) this.beatDecay = 1.0;
    else this.beatDecay = Math.max(0.0, this.beatDecay * 0.85);

    this.rhythmPhase = (this.simulationStep * 0.1) % (Math.PI * 2.0);

    this.metrics = {
      subBass: isBeat ? 0.98 : 0.25,
      bass: isBeat ? 0.90 : Math.sin(t * 2) * 0.2 + 0.3,
      mid: Math.sin(t * 1.5) * 0.4 + 0.5,
      treble: Math.cos(t * 3) * 0.4 + 0.4,
      rms: Math.sin(t) * 0.3 + 0.5,
      peak: isBeat ? 0.98 : 0.5,
      beat: this.beatDecay,
      rhythmPhase: this.rhythmPhase,
      lfoSine: Math.sin(this.rhythmPhase) * 0.5 + 0.5,
      lfoSaw: (this.rhythmPhase / (Math.PI * 2.0))
    };

    if (this.onMetricsCallback) {
      this.onMetricsCallback(this.metrics, null);
    }

    setTimeout(() => this.runSimulationLoop(), 50);
  }
}

if (typeof module !== 'undefined') {
  module.exports = TouchArtAudioIngest;
}
