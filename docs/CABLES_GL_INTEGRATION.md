# Cables.gl Integration Guide

This guide explains how to connect your **Cables.gl** visualizer patch (web version or standalone Electron version) to the live audio sync server.

---

## Method 1: Web Export / Custom HTML Wrapper

If you export your Cables.gl patch as an HTML/JS bundle:

1. Include the `cables-sync-bridge.js` file in your `index.html`:
   ```html
   <script src="http://localhost:3000/cables-ops/cables-sync-bridge.js"></script>
   ```

2. Access live audio values inside your main animation loop or custom Cables ops:
   ```javascript
   // Listen to metric updates
   CablesAudioSync.subscribe((metrics) => {
     const bass = metrics.audio.bass;
     const treble = metrics.audio.treble;
     const bpm = metrics.bpm;
     
     // Drive cables variables or parameters
     CABLES.patch.setVariable('AudioBass', bass);
     CABLES.patch.setVariable('AudioTreble', treble);
     CABLES.patch.setVariable('LiveBPM', bpm);
   });
   ```

---

## Method 2: Cables Standalone (Electron App)

If using the offline `cables_electron` desktop app:

1. Open your patch in Cables Standalone.
2. Add a `CustomOp` or `Script` operator to your canvas.
3. Paste the contents of `cables-ops/cables-sync-bridge.js` into your operator code.
4. Set ports to output values:
   - `audio_bass` (Number) -> Connects to Geometry Scale / Displace / Color
   - `audio_treble` (Number) -> Connects to Particles / Noise / Bloom
   - `bpm` (Number) -> Connects to Timer / Speed / Shader Animation Rate
   - `transientTrigger` (Trigger) -> Connects to Flash / Camera Shake / Beat Pulse

---

## Reactive Variables Reference

| Variable Name | Type | Description |
| :--- | :--- | :--- |
| `audio.subBass` | Float (0-1) | Sub-frequency energy (20Hz - 60Hz) |
| `audio.bass` | Float (0-1) | Bass frequency / Kick drum energy (60Hz - 250Hz) |
| `audio.mid` | Float (0-1) | Mid-range frequency / Vocals & Synths (250Hz - 4kHz) |
| `audio.treble` | Float (0-1) | High frequency / Hi-hats & Cymbals (4kHz - 20kHz) |
| `audio.transientTrigger` | Boolean | True on detected beat / drum transient attack |
| `stems.drums` | Float (0-1) | Drum stem volume level |
| `stems.bass` | Float (0-1) | Bass stem volume level |
| `stems.vocals` | Float (0-1) | Vocal stem volume level |
| `stems.synths` | Float (0-1) | Synth stem volume level |
| `bpm` | Float | Current set tempo (BPM) |
| `isPlaying` | Boolean | DAW playback active status |
