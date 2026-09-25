const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const dgram = require('dgram');
const path = require('path');

const HTTP_PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8080;
const OSC_PORT = process.env.OSC_PORT || 9000;

// Initialize Express App
const app = express();
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.json());

// Serve Cables ops script directly
app.use('/cables-ops', express.static(path.join(__dirname, '../cables-ops')));

const server = http.createServer(app);

// WebSocket Server for Cables.gl patches and Dashboard client
const wss = new WebSocket.Server({ port: WS_PORT });

// Live Sync State Store
const syncState = {
  source: 'none', // 'ableton', 'audacity', 'webaudio', 'simulation'
  bpm: 120,
  isPlaying: false,
  positionSeconds: 0,
  bar: 1,
  beat: 1,
  timecode: '00:00:00:00',
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
  },
  connectedClients: 0
};

// Broadcast payload to all connected Cables.gl patches & clients
function broadcastState() {
  const payload = JSON.stringify({ type: 'sync_update', data: syncState, timestamp: Date.now() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  syncState.connectedClients = wss.clients.size;
  console.log(`[Cables Sync WS] Client connected. Total clients: ${syncState.connectedClients}`);
  
  // Send initial handshake state
  ws.send(JSON.stringify({ type: 'init', data: syncState }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      
      // Allow browser client or DAW bridge to push audio metrics into syncState
      if (parsed.type === 'push_audio_metrics') {
        syncState.source = parsed.source || 'webaudio';
        syncState.audio = { ...syncState.audio, ...parsed.audio };
        if (parsed.stems) syncState.stems = { ...syncState.stems, ...parsed.stems };
        if (parsed.bpm) syncState.bpm = parsed.bpm;
        if (typeof parsed.isPlaying === 'boolean') syncState.isPlaying = parsed.isPlaying;
        if (typeof parsed.positionSeconds === 'number') syncState.positionSeconds = parsed.positionSeconds;
        broadcastState();
      } else if (parsed.type === 'daw_control') {
        syncState.source = parsed.source || syncState.source;
        if (parsed.action === 'play') syncState.isPlaying = true;
        if (parsed.action === 'pause') syncState.isPlaying = false;
        if (parsed.action === 'stop') {
          syncState.isPlaying = false;
          syncState.positionSeconds = 0;
        }
        if (parsed.bpm) syncState.bpm = parsed.bpm;
        broadcastState();
      }
    } catch (err) {
      console.error('[Cables Sync WS] Error parsing message:', err.message);
    }
  });

  ws.on('close', () => {
    syncState.connectedClients = wss.clients.size;
    console.log(`[Cables Sync WS] Client disconnected. Remaining: ${syncState.connectedClients}`);
  });
});

// Setup UDP Receiver for OSC Messages (Ableton / Max4Live / TouchOSC)
const udpSocket = dgram.createSocket('udp4');

udpSocket.on('message', (msg, rinfo) => {
  try {
    // Simple OSC Address & Arguments parser for common DAW / Ableton OSC routes
    const str = msg.toString('latin1');
    syncState.osc.lastAddress = str.split('\0')[0] || '';
    syncState.source = 'ableton-osc';
    
    // Parse common Ableton OSC routes like /live/tempo, /live/play, /live/track/volume
    if (str.includes('/live/tempo')) {
      const match = str.match(/([0-9]+\.[0-9]+)/);
      if (match) syncState.bpm = parseFloat(match[1]);
    } else if (str.includes('/live/play')) {
      syncState.isPlaying = true;
    } else if (str.includes('/live/stop')) {
      syncState.isPlaying = false;
    }

    broadcastState();
  } catch (err) {
    console.error('[OSC UDP] Error processing packet:', err.message);
  }
});

udpSocket.on('listening', () => {
  const address = udpSocket.address();
  console.log(`[OSC Receiver] Listening for Ableton/DAW OSC on UDP port ${address.port}`);
});

udpSocket.bind(OSC_PORT);

// REST API Endpoints for Audacity / DAW REST hooks
app.get('/api/status', (req, res) => {
  res.json({ success: true, syncState });
});

app.post('/api/audacity/sync', (req, res) => {
  const { isPlaying, positionSeconds, bpm, markers, trackLevels } = req.body;
  syncState.source = 'audacity4';
  if (typeof isPlaying === 'boolean') syncState.isPlaying = isPlaying;
  if (typeof positionSeconds === 'number') syncState.positionSeconds = positionSeconds;
  if (bpm) syncState.bpm = bpm;
  if (trackLevels) syncState.stems = { ...syncState.stems, ...trackLevels };
  
  broadcastState();
  res.json({ status: 'synced', timestamp: Date.now() });
});

server.listen(HTTP_PORT, () => {
  console.log(`=======================================================`);
  console.log(` Cables Live DAW & Visualizer Sync Server Running!`);
  console.log(` HTTP Dashboard & Control:  http://localhost:${HTTP_PORT}`);
  console.log(` WebSocket Cables Stream:   ws://localhost:${WS_PORT}`);
  console.log(` OSC UDP Ableton Receiver: udp://localhost:${OSC_PORT}`);
  console.log(`=======================================================`);
});
