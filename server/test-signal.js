const WebSocket = require('ws');

const WS_PORT = process.env.WS_PORT || 8080;
const ws = new WebSocket(`ws://localhost:${WS_PORT}`);

console.log(`[Test Signal Generator] Connecting to ws://localhost:${WS_PORT}...`);

let step = 0;
let bpm = 124;
let isPlaying = true;

ws.on('open', () => {
  console.log('[Test Signal Generator] Connected! Sending simulated Ableton / Audacity 4 live set signals...');

  setInterval(() => {
    step++;
    const t = step * 0.05;
    
    // Simulate kick beat every quarter note (124 bpm -> 0.483s per beat)
    const beatInterval = Math.round(60 / bpm / 0.05);
    const isBeat = step % beatInterval === 0;
    
    const audio = {
      rms: Math.sin(t * 2) * 0.3 + 0.5,
      peak: isBeat ? 0.95 : Math.random() * 0.4 + 0.2,
      subBass: isBeat ? 0.98 : Math.sin(t * 3) * 0.2 + 0.1,
      bass: isBeat ? 0.88 : Math.cos(t * 2.5) * 0.3 + 0.2,
      mid: Math.sin(t * 1.5) * 0.4 + 0.4,
      treble: Math.abs(Math.sin(t * 5)) * 0.6 + 0.2,
      spectralFlux: isBeat ? 0.85 : Math.random() * 0.2,
      transientTrigger: isBeat
    };

    const stems = {
      drums: isBeat ? 0.9 : 0.2,
      bass: Math.cos(t * 2) * 0.4 + 0.5,
      vocals: Math.sin(t * 0.8) * 0.5 + 0.3,
      synths: Math.sin(t * 3) * 0.4 + 0.4,
      other: Math.random() * 0.3
    };

    const payload = {
      type: 'push_audio_metrics',
      source: 'simulation-live-set',
      bpm,
      isPlaying,
      positionSeconds: step * 0.05,
      audio,
      stems
    };

    ws.send(JSON.stringify(payload));
  }, 50);
});

ws.on('error', (err) => {
  console.error('[Test Signal Generator] Connection error:', err.message);
  process.exit(1);
});
