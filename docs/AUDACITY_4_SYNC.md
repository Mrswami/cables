# Audacity 4 Sync Guide for Cables.gl

This guide explains how to stream live playback, multitrack audio stems, and timeline marker cues from **Audacity 4** directly into **Cables.gl** visualizers.

---

## Features

- **Live Stream Capture**: Capture Audacity 4 live audio playback using WASAPI / ASIO loopback.
- **Stem Multi-Track Sync**: Map Audacity multitrack stems (Drums, Bass, Vocals, Synths) to Cables.gl visual properties.
- **REST Timecode API**: Send real-time playback position, markers, and BPM cues from Audacity sessions.

---

## 1. Setting Up Live Audio Capture from Audacity 4

### Windows WASAPI Host Setup:
1. Open **Audacity 4**.
2. Set Audio Host to **Windows WASAPI**.
3. Set Recording Device to your primary playback device with **(loopback)** appended:
   - Example: `Speakers (Realtek High Definition Audio) (loopback)`
4. Set Channels to `2 (Stereo)`.
5. Play your recorded live set in Audacity.
6. Open the Cables Sync Dashboard (`http://localhost:3000`), click **Enable Microphone / Line In**, and select the default playback loopback source.

---

## 2. Using Audacity 4 REST Sync API

Audacity 4 or external scripts can post real-time playback updates directly to the sync server via HTTP REST POST:

- **Endpoint**: `POST http://localhost:3000/api/audacity/sync`
- **Content-Type**: `application.json`

### Payload Schema:

```json
{
  "isPlaying": true,
  "positionSeconds": 45.2,
  "bpm": 128,
  "trackLevels": {
    "drums": 0.85,
    "bass": 0.70,
    "vocals": 0.45,
    "synths": 0.90
  }
}
```

### Python Sync Script Example for Audacity:

```python
import requests
import time

url = "http://localhost:3000/api/audacity/sync"

def sync_audacity_playback(pos_sec, is_playing=True):
    payload = {
        "isPlaying": is_playing,
        "positionSeconds": pos_sec,
        "bpm": 124.0,
        "trackLevels": {
            "drums": 0.88,
            "bass": 0.65,
            "vocals": 0.50,
            "synths": 0.75
        }
    }
    requests.post(url, json=payload)
```
