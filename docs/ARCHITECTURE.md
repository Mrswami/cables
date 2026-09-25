# Low-Latency Audio & DAW Sync Architecture

This document describes the high-performance, real-time data pipeline powering live audio visualizer synchronization between Ableton Live, Audacity 4, and Cables.gl.

---

## Data Flow Diagram

```
+--------------------------+        +--------------------------+
|  Ableton Live (11/12)    |        |       Audacity 4         |
|  - Virtual Audio Router  |        |  - WASAPI / ASIO Loop    |
|  - OSC (UDP 9000)        |        |  - Stem REST Hook        |
+------------+-------------+        +------------+-------------+
             |                                   |
             +-----------------+-----------------+
                               |
                               v
               +-------------------------------+
               |     Live Web Audio API /      |
               |     Sync Server (Node.js)     |
               |  - Real-Time FFT Analyser     |
               |  - Transient Attack Detector  |
               |  - WebSocket Publisher (8080) |
               +---------------+---------------+
                               |
                               v  JSON WebSocket Payloads (60 FPS)
               +-------------------------------+
               |      Cables.gl Visualizer     |
               |  (WebGL / WebGPU / Standalone)|
               +-------------------------------+
```

---

## Latency Optimization Strategies

1. **Sub-16ms WebSocket Broadcasting**: The sync server packages audio telemetry into lightweight JSON messages delivered every 50ms (or frame-aligned) to ensure 60fps synchronous visual rendering.
2. **Web Audio API Hardware Acceleration**: Uses client-side Web Audio FFT analysis with non-blocking audio thread buffers (`fftSize = 512`) for zero-lag spectrum calculation.
3. **Dual Protocol Fallback**: Supports raw Web Audio input when DAW OSC is not configured, ensuring visual reactivity remains seamless.
