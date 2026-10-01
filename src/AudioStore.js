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
    
    // Config from UI - default gains to 100% unity
    this.config = {
      subGain: 100, lowGain: 100, midGain: 100, highGain: 100, masterGain: 100,
      sensitivity: 1.0,
      smoothing: 0.25
    };
    
    // Envelope Follower State (for flawless transient/rhythm tracking)
    this.envelopes = { sub: 0, low: 0, mid: 0, high: 0 };
    this.attack = 0.92;  // Very fast attack to catch kick drum transients instantly
    this.release = 0.15; // Smooth release to ride the rhythm like a sidechain compressor

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
    this.envelopes = { sub: 0, low: 0, mid: 0, high: 0 };
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
    const binHz = 48000 / this.fftSize; // Approx 23.44 Hz per bin
    const sens = this.config.sensitivity || 1.0;
    const maxBin = freq.length - 1;
    
    const getRangeStats = (startHz, endHz) => {
      const start = Math.max(1, Math.min(maxBin, Math.floor(startHz / binHz)));
      const end = Math.max(start, Math.min(maxBin, Math.ceil(endHz / binHz)));
      let sum = 0, max = 0;
      for (let i = start; i <= end; i++) {
        const raw = freq[i] || 0;
        // Spectral Tilt (Pre-emphasis): Boost high frequencies linearly to compensate for natural roll-off in music
        const weight = 1.0 + (i / maxBin) * 3.5; 
        const v = raw * weight;
        sum += v;
        if (v > max) max = v;
      }
      return { sum, max, count: Math.max(1, end - start + 1) };
    };

    const ranges = this.config.ranges || {
      sub: [20, 65],
      low: [65, 250],
      mid: [250, 2500],
      high: [2500, 16000]
    };

    const sub = getRangeStats(ranges.sub[0], ranges.sub[1]);
    const low = getRangeStats(ranges.low[0], ranges.low[1]);
    const mid = getRangeStats(ranges.mid[0], ranges.mid[1]);
    const high = getRangeStats(ranges.high[0], ranges.high[1]);
    
    // Envelope Follower Logic: Track TRUE peak transients
    // For higher bands, 'sum / count' often provides a cleaner rhythmic profile than raw peak
    const rawSub = Math.min(1.5, (sub.max / 255) * sens);
    const rawLow = Math.min(1.5, (low.max / 255) * sens);
    const rawMid = Math.min(1.5, ((mid.max * 0.7 + (mid.sum / mid.count) * 2.0) / 255) * sens);
    const rawHigh = Math.min(1.5, ((high.max * 0.5 + (high.sum / high.count) * 4.0) / 255) * sens);
    
    // Rhythmic Onset & Spectral Flux Detection (Kick / Snare / HiHat punch)
    const prevSub = this.prevBands.sub || 0;
    const prevLow = this.prevBands.low || 0;
    const prevMid = this.prevBands.mid || 0;
    const prevHigh = this.prevBands.high || 0;

    const subDiff = Math.max(0, rawSub - prevSub);
    const lowDiff = Math.max(0, rawLow - prevLow);
    const midDiff = Math.max(0, rawMid - prevMid);
    const highDiff = Math.max(0, rawHigh - prevHigh);

    const kickOnset = Math.min(1.0, (subDiff * 1.5 + lowDiff * 1.2) * 2.0);
    const snareOnset = Math.min(1.0, midDiff * 2.5);
    const hihatOnset = Math.min(1.0, highDiff * 2.5);

    this.prevBands = { sub: rawSub, low: rawLow, mid: rawMid, high: rawHigh };
    
    const userSmoothing = this.config.smoothing !== undefined ? this.config.smoothing : 0.25;
    const attackRate = 0.92;
    const releaseRate = Math.max(0.04, 0.35 * (1.0 - userSmoothing));

    const applyEnvelope = (current, target) => {
      if (target > current) {
        return current + (target - current) * attackRate;
      } else {
        return current + (target - current) * releaseRate;
      }
    };

    this.envelopes.sub = applyEnvelope(this.envelopes.sub, rawSub);
    this.envelopes.low = applyEnvelope(this.envelopes.low, rawLow);
    this.envelopes.mid = applyEnvelope(this.envelopes.mid, rawMid);
    this.envelopes.high = applyEnvelope(this.envelopes.high, rawHigh);
    
    const subGainFactor = (this.config.subGain ?? 100) / 100;
    const lowGainFactor = (this.config.lowGain ?? 100) / 100;
    const midGainFactor = (this.config.midGain ?? 100) / 100;
    const highGainFactor = (this.config.highGain ?? 100) / 100;

    const subVal = Math.min(1.0, this.envelopes.sub * subGainFactor);
    const lowVal = Math.min(1.0, this.envelopes.low * lowGainFactor);
    const midVal = Math.min(1.0, this.envelopes.mid * midGainFactor);
    const highVal = Math.min(1.0, this.envelopes.high * highGainFactor);
    
    let peakRaw = 0;
    for (let i = 0; i < freq.length; i++) {
      if (freq[i] > peakRaw) peakRaw = freq[i];
    }
    const peak = Math.min(1.0, (peakRaw / 255) * sens);
    
    const audioEnergy = Math.max(this.envelopes.sub, this.envelopes.low, this.envelopes.mid, this.envelopes.high, peak);
    const isAudioActive = audioEnergy > 0.015;

    this.bands = {
      rawSub: Math.min(1.0, this.envelopes.sub),
      rawLow: Math.min(1.0, this.envelopes.low),
      rawMid: Math.min(1.0, this.envelopes.mid),
      rawHigh: Math.min(1.0, this.envelopes.high),
      sub: subVal, 
      low: lowVal, 
      mid: midVal, 
      high: highVal, 
      peak, 
      kickOnset,
      snareOnset,
      hihatOnset,
      master: (this.config.masterGain ?? 100) / 100,
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
