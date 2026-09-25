/**
 * Cables.gl Live Audio & DAW Sync Bridge
 * Drop this script into your Cables.gl web export, standalone app, or custom ops.
 * Connects to ws://localhost:8080 to receive real-time audio FFT, stems, Ableton & Audacity sync data.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CablesAudioSync = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  class CablesAudioSyncBridge {
    constructor(options = {}) {
      this.wsUrl = options.wsUrl || 'ws://localhost:8080';
      this.autoConnect = options.autoConnect !== false;
      this.socket = null;
      this.listeners = new Set();
      
      // Global reactive metrics available to Cables patches
      this.metrics = {
        source: 'none',
        bpm: 120,
        isPlaying: false,
        positionSeconds: 0,
        audio: {
          rms: 0,
          peak: 0,
          subBass: 0,
          bass: 0,
          mid: 0,
          treble: 0,
          spectralFlux: 0,
          transientTrigger: false
        },
        stems: {
          drums: 0,
          bass: 0,
          vocals: 0,
          synths: 0,
          other: 0
        },
        midi: {
          lastNote: null,
          lastVelocity: 0,
          cc: {}
        },
        osc: {
          lastAddress: '',
          lastArgs: []
        }
      };

      if (this.autoConnect) {
        this.connect();
      }
    }

    connect() {
      try {
        console.log(`[CablesAudioSync] Connecting to ${this.wsUrl}...`);
        this.socket = new WebSocket(this.wsUrl);

        this.socket.onopen = () => {
          console.log('[CablesAudioSync] WebSocket Connected to Live DAW Sync Server.');
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'sync_update' || message.type === 'init') {
              this.updateMetrics(message.data);
            }
          } catch (e) {
            console.error('[CablesAudioSync] Error parsing incoming WS payload:', e);
          }
        };

        this.socket.onclose = () => {
          console.warn('[CablesAudioSync] Connection closed. Retrying in 2000ms...');
          setTimeout(() => this.connect(), 2000);
        };

        this.socket.onerror = (err) => {
          console.error('[CablesAudioSync] Socket error:', err);
        };
      } catch (err) {
        console.error('[CablesAudioSync] Initialization failed:', err);
      }
    }

    updateMetrics(data) {
      if (!data) return;
      
      this.metrics.source = data.source || this.metrics.source;
      this.metrics.bpm = data.bpm || this.metrics.bpm;
      this.metrics.isPlaying = typeof data.isPlaying === 'boolean' ? data.isPlaying : this.metrics.isPlaying;
      this.metrics.positionSeconds = typeof data.positionSeconds === 'number' ? data.positionSeconds : this.metrics.positionSeconds;

      if (data.audio) {
        this.metrics.audio = { ...this.metrics.audio, ...data.audio };
      }
      if (data.stems) {
        this.metrics.stems = { ...this.metrics.stems, ...data.stems };
      }
      if (data.midi) {
        this.metrics.midi = { ...this.metrics.midi, ...data.midi };
      }
      if (data.osc) {
        this.metrics.osc = { ...this.metrics.osc, ...data.osc };
      }

      // Notify registered listeners
      this.listeners.forEach((callback) => callback(this.metrics));
    }

    // Subscribe function for Cables Ops or Canvas Animation Loops
    subscribe(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }

    // Convenience getters for Cables.gl ops
    getVal(key, defaultValue = 0) {
      const parts = key.split('.');
      let curr = this.metrics;
      for (const p of parts) {
        if (curr && curr[p] !== undefined) {
          curr = curr[p];
        } else {
          return defaultValue;
        }
      }
      return curr;
    }
  }

  // Create singleton instance
  const instance = new CablesAudioSyncBridge();
  return instance;
}));
