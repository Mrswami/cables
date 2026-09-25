/**
 * Audio Ingestion & FFT Spectrum Engine for TouchArt Studio
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
      this.analyser.smoothingTimeConstant = 0.8;
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  async startMicrophone() {
    try {
      this.initAudioContext();
      this.isSimulating = false;

      if (this.micStream) {
        this.micStream.getTracks().forEach(t => t.stop());
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const sourceNode = this.audioCtx.createMediaStreamSource(this.micStream);
      sourceNode.connect(this.analyser);

      this.processAudioLoop();
      return true;
    } catch (err) {
      console.error('[Audio Ingest] Could not start microphone:', err);
      alert('Could not access audio device: ' + err.message);
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

      if (i < 4) subBassSum += val;
      else if (i < 16) bassSum += val;
      else if (i < 80) midSum += val;
      else trebleSum += val;
    }

    this.metrics.subBass = Math.min(1.0, subBassSum / 4);
    this.metrics.bass = Math.min(1.0, bassSum / 12);
    this.metrics.mid = Math.min(1.0, midSum / 64);
    this.metrics.treble = Math.min(1.0, trebleSum / (bufferLength - 80));
    this.metrics.rms = Math.min(1.0, totalSum / bufferLength);
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
      subBass: isBeat ? 0.95 : 0.2,
      bass: isBeat ? 0.88 : Math.sin(t * 2) * 0.2 + 0.2,
      mid: Math.sin(t * 1.5) * 0.4 + 0.4,
      treble: Math.cos(t * 3) * 0.4 + 0.3,
      rms: Math.sin(t) * 0.3 + 0.4,
      peak: isBeat ? 0.95 : 0.4
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
