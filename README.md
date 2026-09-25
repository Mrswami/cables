# Cables.gl Live DAW & Audio Sync Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Cables.gl Compatible](https://img.shields.io/badge/Cables.gl-Web%20%2F%20Standalone-00f0ff.svg)](https://cables.gl)

A powerful, low-latency toolkit and real-time server bridge designed to synchronize live sets recorded or performed in **Ableton Live (11/12)** or **Audacity 4** with **[Cables.gl](https://cables.gl)** visualizers.

Repository: [https://github.com/Mrswami/cables.git](https://github.com/Mrswami/cables.git)

---

## 🌟 Key Features

- 🎧 **Direct Live Audio Input**: Captures live microphone, line-in, or system loopback audio via Web Audio API.
- 🎛️ **Ableton Live Integration**: Real-time sync for BPM, playback state, MIDI clock, MIDI CC, and OSC controls via UDP (port 9000).
- 🎙️ **Audacity 4 Live & Stem Sync**: Stream multitrack audio playback, stem levels (Drums, Bass, Vocals, Synths), and timeline timecode cues via REST API.
- ⚡ **Low-Latency WebSocket Bridge**: Sub-16ms WebSocket server (`ws://localhost:8080`) streaming 60fps audio metrics to Cables.gl patches.
- 📊 **Real-time FFT & Frequency Analysis**: Sub-bass, bass (kick), mid-range, treble (hi-hat), RMS, peak, and beat transient attack detection.
- 💻 **Modern Control Dashboard**: Built-in web UI (`http://localhost:3000`) for audio source selection, live frequency spectrum, stem meters, and status monitoring.
- 🧩 **Cables.gl Patch Ready**: Includes drop-in JavaScript bridge (`cables-sync-bridge.js`) and JSON patch templates compatible with Cables Web and Standalone (Electron).

---

## 🚀 Quick Start

### 1. Install & Launch Sync Server
```bash
# Clone the repository
git clone https://github.com/Mrswami/cables.git
cd Cables

# Install dependencies
npm install

# Start the Sync Server & Control Dashboard
npm start
```

Open your browser to **[http://localhost:3000](http://localhost:3000)**.

### 2. Enable Live Audio / Test Signal
- Click **Enable Microphone / Line In** on the dashboard to capture system loopback or DAW sound output.
- Or click **Toggle Test Signal Generator** to run simulated audio & beat patterns offline.

---

## 📁 Repository Structure

```
Cables/
├── client/                      # Interactive Web Control Dashboard
│   ├── index.html               # Main dashboard UI
│   ├── app.js                   # Web Audio API FFT processor & WS client
│   └── styles.css               # Glassmorphism dark-mode styles
├── server/                      # Node.js Live Sync Bridge
│   ├── index.js                 # Express HTTP, WebSocket (8080) & OSC UDP (9000) server
│   └── test-signal.js           # Offline beat/audio signal generator
├── cables-ops/                  # Cables.gl Integration Tools
│   ├── cables-sync-bridge.js    # Client JS module for Cables.gl web & standalone patches
│   └── CablesPatchTemplate.json # Importable Cables patch schema template
├── config/                      # DAW Sync Configurations
│   ├── ableton-mapping.json     # Ableton OSC & MIDI CC mapping presets
│   └── audacity-sync.json       # Audacity 4 REST sync & stem configuration
└── docs/                        # Complete Documentation
    ├── ABLETON_LIVE_SYNC.md     # Ableton Live sync setup guide
    ├── AUDACITY_4_SYNC.md       # Audacity 4 live input & stem guide
    ├── CABLES_GL_INTEGRATION.md # Guide for connecting Cables.gl patches
    └── ARCHITECTURE.md          # Technical latency & pipeline specification
```

---

## 📖 Complete Documentation

- 🎛️ **[Ableton Live Setup Guide](docs/ABLETON_LIVE_SYNC.md)**: Virtual routing, Max for Live, OSC, and MIDI clock mapping.
- 🎙️ **[Audacity 4 Setup Guide](docs/AUDACITY_4_SYNC.md)**: WASAPI loopback, stem multi-track configuration, and REST timecode API.
- 🧩 **[Cables.gl Patch Integration](docs/CABLES_GL_INTEGRATION.md)**: Connecting web exports or standalone Electron patches using `CablesAudioSync`.
- 📐 **[System Architecture](docs/ARCHITECTURE.md)**: Network architecture, WebSocket payload schemas, and zero-lag performance tuning.

---

## ⚡ Cables.gl Integration Quick Snippet

Add this script to your Cables.gl web project or custom operator:

```html
<script src="http://localhost:3000/cables-ops/cables-sync-bridge.js"></script>
```

In your Cables patch code or logic:

```javascript
// Access live audio frequency energy & DAW tempo
const bass = CablesAudioSync.getVal('audio.bass');       // 0.0 to 1.0
const treble = CablesAudioSync.getVal('audio.treble');   // 0.0 to 1.0
const bpm = CablesAudioSync.getVal('bpm');               // e.g. 128.0

// Subscribe to real-time 60fps audio metrics
CablesAudioSync.subscribe((metrics) => {
  if (metrics.audio.transientTrigger) {
    // Trigger visual pulse or beat reaction
  }
});
```

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
Created by [Mrswami](https://github.com/Mrswami/cables.git).
