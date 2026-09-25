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

    this.metrics = {
      subBass: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      rms: 0,
      peak: 0
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

    let subBassSum = 0, bassSum = 0, midSum = 0, trebleSum = 0, totalSum = 0;

    for (let i = 0; i < bufferLength; i++) {
      const val = dataArray[i] / 255.0;
      totalSum += val;

      if (i < 6) subBassSum += val;
      else if (i < 24) bassSum += val;
      else if (i < 100) midSum += val;
      else trebleSum += val;
    }

    let rawSubBass = subBassSum / 6;
    let rawBass = bassSum / 18;
    let rawMid = midSum / 76;
    let rawTreble = trebleSum / (bufferLength - 100);
    let rawRms = totalSum / bufferLength;
    let currentPeak = Math.max(rawSubBass, rawBass, rawMid, rawTreble);

    // Automatic Gain Control (AGC Peak Envelope Tracking)
    if (this.enableAGC) {
      if (currentPeak > this.peakEnvelope) {
        this.peakEnvelope = currentPeak;
      } else {
        this.peakEnvelope = Math.max(0.05, this.peakEnvelope * 0.995); // Decay envelope
      }
    } else {
      this.peakEnvelope = 0.5;
    }

    const agcMultiplier = (1.0 / this.peakEnvelope) * this.masterGain;

    // Highly sensitive & dynamic frequency metrics
    this.metrics.subBass = Math.min(1.0, Math.pow(rawSubBass * agcMultiplier, 1.2));
    this.metrics.bass = Math.min(1.0, Math.pow(rawBass * agcMultiplier, 1.2));
    this.metrics.mid = Math.min(1.0, Math.pow(rawMid * agcMultiplier, 1.2));
    this.metrics.treble = Math.min(1.0, Math.pow(rawTreble * agcMultiplier, 1.2));
    this.metrics.rms = Math.min(1.0, rawRms * agcMultiplier);
    this.metrics.peak = Math.max(this.metrics.subBass, this.metrics.bass, this.metrics.mid, this.metrics.treble);

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

    this.metrics = {
      subBass: isBeat ? 0.98 : 0.25,
      bass: isBeat ? 0.90 : Math.sin(t * 2) * 0.2 + 0.3,
      mid: Math.sin(t * 1.5) * 0.4 + 0.5,
      treble: Math.cos(t * 3) * 0.4 + 0.4,
      rms: Math.sin(t) * 0.3 + 0.5,
      peak: isBeat ? 0.98 : 0.5
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
