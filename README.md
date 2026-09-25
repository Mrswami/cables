# TouchArt Studio & Cables.gl Live DAW Sync Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Cables.gl Compatible](https://img.shields.io/badge/Cables.gl-Web%20%2F%20Standalone-00f0ff.svg)](https://cables.gl)
[![TouchDesigner Alternative](https://img.shields.io/badge/TouchDesigner-Free%20Alternative-ff007f.svg)](#-touchart-studio-desktop-app)

A high-performance, open-source desktop application and real-time audio ingest engine designed to generate hardware-accelerated GLSL shader code art equations synchronized with live audio input, **Ableton Live 11/12**, **Audacity 4**, and **Cables.gl**.

Repository: [https://github.com/Mrswami/cables.git](https://github.com/Mrswami/cables.git)

---

## 🎨 TouchArt Studio (TouchDesigner Free Alternative)

TouchArt Studio is a standalone desktop visual editor built on WebGL2 & WebGPU shader raymarching, low-latency WASAPI audio ingestion, and interactive mathematical equation parameters.

### Desktop App Highlights:
- ⚡ **60-144+ FPS WebGL2 Shader Engine**: Real-time rendering of 3D raymarched fractals, quantum fields, SDF geometries, and mandala wave equations.
- 🎛️ **Live Touch Node Parameter Inspector**: Adjust math variables (`u_param1` .. `u_param10`), LFO speeds, rotation, detail iterations, and audio reactivity gain multipliers in real time.
- 💻 **Live GLSL Equation Code Editor**: Write and edit GLSL fragment shader code art equations with instant recompilation and syntax error reporting.
- 🎤 **Zero-Latency Audio Ingest**: Captures WASAPI system loopback, line-in microphone, recorded audio sets, or live DAW streams.
- 🔮 **Pre-Loaded Preset Equations**:
  - *Cyber Core Raymarcher*: 3D audio-reactive raymarched geometry with pulse morphing.
  - *Mandala Harmonic Wave Field*: Polar symmetry folding wave equations reacting to mid/treble bands.
  - *Quantum Fluid Plasma*: Domain warping fluid with turbulence controls.

---

## 🚀 How to Run

### Option A: Launch as Desktop Application (Electron)
```bash
npm start
```
*Launches the native hardware-accelerated TouchArt Studio window.*

### Option B: Launch Web Server & Control Hub
```bash
npm run web
```
- **TouchArt Studio**: `http://localhost:3000/desktop`
- **DAW Control Dashboard**: `http://localhost:3000`
- **WebSocket Cables Stream**: `ws://localhost:8080`
- **Ableton OSC Receiver**: `udp://localhost:9000`

---

## 📁 Repository Structure

```
Cables/
├── main.js                      # Electron Desktop App main process
├── desktop/                     # TouchArt Studio App (TouchDesigner Alternative)
│   ├── index.html               # Main TouchArt Studio GUI
│   ├── app.js                   # Main workspace controller & meter renderer
│   ├── shaderEngine.js          # Hardware-accelerated WebGL2 GLSL renderer
│   ├── audioIngest.js           # WASAPI / Mic / WebAudio FFT analyzer
│   ├── presetEquations.js       # Curated GLSL code art equations library
│   └── styles.css               # TouchDesigner-inspired dark theme
├── client/                      # Web Control Dashboard & Audio Spectrum
├── server/                      # Node.js Live Sync Server (WebSocket/OSC/REST)
├── cables-ops/                  # Cables.gl Integration Tools (`cables-sync-bridge.js`)
├── config/                      # Ableton OSC & Audacity sync configurations
└── docs/                        # Complete Documentation Suite
    ├── ABLETON_LIVE_SYNC.md
    ├── AUDACITY_4_SYNC.md
    ├── CABLES_GL_INTEGRATION.md
    └── ARCHITECTURE.md
```

---

## ⚡ Live GLSL Shader Uniforms

You can use the following uniforms inside any code art equation in TouchArt Studio:

```glsl
uniform vec2  u_resolution;    // Viewport width & height in pixels
uniform float u_time;          // Elapsed time in seconds
uniform float u_audio_bass;    // Sub-bass & kick energy (0.0 to 1.0)
uniform float u_audio_mid;     // Mid-range & vocal energy (0.0 to 1.0)
uniform float u_audio_treble;  // Treble & hi-hat energy (0.0 to 1.0)
uniform float u_audio_rms;     // Root Mean Square overall audio amplitude
uniform float u_param1;        // Touch Parameter Slider 1 (0.0 to 1.0)
uniform float u_param2;        // Touch Parameter Slider 2 (0.0 to 1.0)
uniform float u_param3;        // Touch Parameter Slider 3 (0.0 to 1.0)
uniform float u_param4;        // Touch Parameter Slider 4 (0.0 to 1.0)
```

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
Created by [Mrswami](https://github.com/Mrswami/cables.git).
