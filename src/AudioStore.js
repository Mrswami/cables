import { invoke } from '@tauri-apps/api/core';

class AudioStore {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.stream = null;
    this.ws = null;
    
    this.fftSize = 2048;
    this.freqData = new Uint8Array(this.fftSize / 2);
    this.waveData = new Uint8Array(this.fftSize / 2);
    
    // Live processed bands
    this.bands = {
      sub: 0, low: 0, mid: 0, high: 0, peak: 0, master: 1, energy: 0, isActive: false
    };
    
    // Config from UI - all band gains default to 0 until user turns them up
    this.config = {
      subGain: 0, lowGain: 0, midGain: 0, highGain: 0, masterGain: 100,
      sensitivity: 1.0,
      smoothing: 0.25
    };
    
    this.prevBands = { sub: 0, low: 0, mid: 0, high: 0 };
    this.isRunning = false;
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (this.analyser && newConfig.smoothing !== undefined) {
      this.analyser.smoothingTimeConstant = newConfig.smoothing;
    }
  }

  async connectTauri() {
    this.stop();
    try {
      const ws = new WebSocket('ws://127.0.0.1:3030');
      ws.binaryType = 'arraybuffer';
      ws.onmessage = (e) => {
        const buffer = new Uint8Array(e.data);
        const freqLen = 1024;
        this.freqData.set(buffer.slice(0, freqLen));
        this.waveData.set(buffer.slice(freqLen, freqLen * 2));
      };
      ws.onopen = () => {
        this.isRunning = true;
        console.log("Connected to Tauri Audio WebSocket");
      };
      ws.onclose = () => this.stop();
      ws.onerror = () => this.stop();
      this.ws = ws;
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  stop() {
    this.isRunning = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.freqData.fill(0);
    this.waveData.fill(128);
  }

  // Called per frame by the main loop or useFrame
  updateBands() {
    if (!this.isRunning) return this.bands;
    
    // If using Web Audio API instead of WebSocket (fallback)
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.freqData);
      this.analyser.getByteTimeDomainData(this.waveData);
    }
    
    const freq = this.freqData;
    const binHz = 48000 / this.fftSize; // Approx
    const sens = this.config.sensitivity || 1.0;
    const maxBin = freq.length - 1;
    
    const getRangeSum = (startHz, endHz) => {
      const start = Math.max(1, Math.min(maxBin, Math.round(startHz / binHz)));
      const end = Math.max(start, Math.min(maxBin, Math.round(endHz / binHz)));
      let sum = 0, max = 0;
      for (let i = start; i <= end; i++) {
        sum += freq[i];
        if(freq[i] > max) max = freq[i];
      }
      return { sum, max, count: Math.max(1, end - start + 1) };
    };

    const sub = getRangeSum(20, 65);
    const low = getRangeSum(65, 250);
    const mid = getRangeSum(250, 2500);
    const high = getRangeSum(2500, 16000);
    
    // Simple band math
    const rawSub = Math.min(1, ((sub.sum / sub.count) / 255) * sens);
    const rawLow = Math.min(1, ((low.sum / low.count) / 255) * sens);
    const rawMid = Math.min(1, ((mid.sum / mid.count) / 255) * sens);
    const rawHigh = Math.min(1, ((high.sum / high.count) / 255) * sens);
    
    const subVal = Math.min(1, Math.pow(rawSub, 1.1) * (this.config.subGain / 100));
    const lowVal = Math.min(1, Math.pow(rawLow, 1.1) * (this.config.lowGain / 100));
    const midVal = Math.min(1, Math.pow(rawMid, 1.0) * (this.config.midGain / 100));
    const highVal = Math.min(1, Math.pow(rawHigh, 1.0) * (this.config.highGain / 100));
    
    let peakRaw = 0;
    for (let i = 0; i < freq.length; i++) if (freq[i] > peakRaw) peakRaw = freq[i];
    const peak = Math.min(1, (peakRaw / 255) * sens);
    
    const audioEnergy = Math.max(rawSub, rawLow, rawMid, rawHigh, peak);
    const isAudioActive = audioEnergy > 0.015;

    this.bands = {
      sub: subVal, low: lowVal, mid: midVal, high: highVal, peak, 
      master: this.config.masterGain / 100,
      energy: audioEnergy,
      isActive: isAudioActive
    };
    
    return this.bands;
  }

  // Mod Matrix Evaluator helper
  getModValue(modMatrix, targetId) {
    if (!modMatrix) return 0;
    let sum = 0;
    const evalBand = (bandKey) => {
      const route = modMatrix[bandKey];
      if (!route || route.target !== targetId) return 0;
      const rawVal = this.bands[bandKey] || 0;
      const gateThresh = (route.gate || 0) / 100;
      const depth = (route.amount || 0) / 100;
      const intensity = (route.intensity ?? 100) / 100;
      
      if (rawVal < gateThresh || rawVal <= 0.005) return 0;
      const activeRange = (rawVal - gateThresh) / (1 - gateThresh + 0.0001);
      return Math.min(8, activeRange * depth * intensity * this.bands.master);
    };
    sum += evalBand('sub') + evalBand('low') + evalBand('mid') + evalBand('high');
    return isNaN(sum) ? 0 : sum;
  }
}

export const audioStore = new AudioStore();
