# Ableton Live Sync Guide for Cables.gl

This guide details how to sync live performance audio, MIDI clock, stems, and OSC data from **Ableton Live 11 / 12** into **Cables.gl** visualizers in real-time.

---

## Architecture Overview

```
 ┌────────────────┐         MIDI / OSC / Audio          ┌─────────────────────────┐
 │  Ableton Live  │ ──────────────────────────────────> │ Cables Live Sync Server │
 │ (Live Set/M4L) │                                     │      (Port 8080/9000)   │
 └────────────────┘                                     └────────────┬────────────┘
                                                                     │ WebSockets
                                                                     v
                                                        ┌─────────────────────────┐
                                                        │   Cables.gl Visualizer  │
                                                        │   (Web / Standalone)    │
                                                        └─────────────────────────┘
```

---

## 1. Live Audio Routing Options

To route audio output from Ableton Live directly into the sync bridge:

### Option A: Virtual Audio Cable (Recommended on Windows)
1. Install **VB-Audio Virtual Cable** or **VoiceMeeter**.
2. In Ableton Live, go to `Preferences` -> `Audio`.
3. Set **Audio Output Device** to `CABLE Input (VB-Audio Virtual Cable)` (or configure Master / Cue outputs to send to Virtual Cable).
4. Launch the Cables Sync Dashboard at `http://localhost:3000`.
5. Click **Enable Microphone / Line In** and select `CABLE Output (VB-Audio Virtual Cable)` as the audio capture source.

### Option B: WASAPI Loopback / Stereo Mix
1. In Windows Sound Control Panel, enable **Stereo Mix** under `Recording` tab.
2. Direct Ableton output to your default soundcard.
3. Select **Stereo Mix** on the Cables Sync Dashboard.

---

## 2. Ableton OSC Setup (Max for Live / LiveOSC)

The Cables Sync Server listens for UDP OSC messages on port **9000**.

1. Download or load an OSC bridge device in Ableton (such as **LiveOSC2** or **Max for Live OSC Sender**).
2. Set the destination host to `127.0.0.1` and port to `9000`.
3. Map the following OSC addresses:
   - `/live/tempo` -> Sends current BPM.
   - `/live/play` -> Sends Play status trigger.
   - `/live/stop` -> Sends Stop status trigger.
   - `/live/track/1/volume` -> Sends Drum Stem level.
   - `/live/track/2/volume` -> Sends Bass Stem level.
   - `/live/track/3/volume` -> Sends Vocal Stem level.
   - `/live/track/4/volume` -> Sends Synth Stem level.

---

## 3. MIDI Clock & CC Sync

1. In Ableton, go to `Preferences` -> `Link / MIDI`.
2. Enable **Sync** and **Remote** output for `loopMIDI` or your virtual MIDI port.
3. Assign MIDI CC knobs in Ableton to parameters:
   - `CC 1`: Sub-bass filter frequency
   - `CC 2`: Main kick amplitude multiplier
   - `CC 3`: Mid-range synth filter
   - `CC 4`: Treble / Hi-hat decay time
