# Cables Audio Visualizer — Anti-Freeze & Real-Time Sync Architecture

This document details the root causes of visualizer freezing in Chrome and Edge, the multi-layered defense system implemented to prevent freezes, and operational guidelines for ensuring sub-millisecond audio-visual synchronization.

---

## 1. Root Cause Analysis of Past Freezes

| Factor | Mechanism of Failure | Solution Implemented |
| :--- | :--- | :--- |
| **Browser HTTP Disk Cache** | Chrome/Edge aggressively cached `index.html`, running an outdated JS bundle containing an unhandled reference exception long after the code was patched in Git. | Added `Cache-Control: no-cache, no-store, must-revalidate` in `firebase.json` headers and HTML meta tags. |
| **Uncaught Frame Exceptions** | Any runtime exception inside `renderFrame()` broke the `requestAnimationFrame` chain permanently, leaving the canvas stuck on the last drawn frame. | Wrapped canvas drawing in `try...catch` with automatic `ctx.restore()`. |
| **Stale Function Closures** | `renderLoop` memoized with `[]` deps held a stale mount-time closure of `renderFrame()`, preventing state updates from propagating. | Implemented `renderFrameRef` pattern so the loop always calls the latest frame function. |
| **Main-Thread React Churn (60–120Hz)** | Calling `setLevels()` every rAF frame forced React to re-render the entire `<App />` component tree at screen refresh rate, causing garbage collection pauses and UI lockup. | Throttled `setLevels()` to 30fps (`>= 33ms`), while allowing the 2D/WebGL canvas to run at native display refresh (60/120/144Hz). |
| **Acoustic Echo Cancellation (AEC) Loopback** | Routing captured tab audio back to `audioCtx.destination` (even at `0.00001` gain) triggered browser AEC feedback suppression and Windows WASAPI stream stalls. | Hard-clamped `keepAliveGain.gain.setValueAtTime(0, audioCtx.currentTime)` strictly to 0. |
| **High Audio Latency (0.75 Smoothing)** | `analyser.smoothingTimeConstant = 0.75` delayed transients by ~100ms+, causing visual lag behind audio beats. | Reduced smoothing constant to `0.25` and added instantaneous time-domain wave energy transient detection (0ms latency). |
| **Silent Input / Stream Pause Freeze** | When audio paused or dropped to 0%, the visualizer appeared frozen if rotational or particle drift depended strictly on non-zero frequency data. | Decoupled idle time accumulation and particle drift from audio amplitude, ensuring smooth idle animation even at `PEAK 0%`. |

---

## 2. The Multi-Layered Defense System

### Layer 1: Self-Healing Render Watchdog
A background interval monitors frame execution health every 400ms:
```javascript
useEffect(() => {
  const watchdog = setInterval(() => {
    if (stateRef.current.isRunning && !document.hidden) {
      const now = performance.now();
      const elapsed = now - lastRenderTimestampRef.current;
      // If render loop missed frames or stalled for >250ms, auto-recover rAF
      if (elapsed > 250) {
        console.warn(`[Watchdog] Stalled frame detected (${Math.round(elapsed)}ms). Force restarting render loop...`);
        cancelAnimationFrame(animRef.current);
        animRef.current = requestAnimationFrame(renderLoop);
      }
      // Keep audio context awake
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    }
  }, 400);
  return () => clearInterval(watchdog);
}, [renderLoop]);
```

### Layer 2: Cache-Busting Production Headers
In `firebase.json`:
* `/**` (including `index.html`): `Cache-Control: no-cache, no-store, must-revalidate`
* `/assets/**` (fingerprinted JS/CSS bundles): `Cache-Control: public, max-age=31536000, immutable`
This ensures users **always** execute the freshest release immediately upon page load without requiring manual hard-refreshes (Ctrl+F5).

### Layer 3: Crash-Resilient Error Recovery
In `renderLoop` and `renderFrame`:
* Every tick is executed inside a `try...catch` block.
* If an isolated drawing calculation encounters `NaN` or an unexpected state, `ctx.restore()` restores the canvas transformation matrix and execution continues to the next frame.

### Layer 4: Background Tab Resilience
* `navigator.wakeLock` prevents the operating system display from sleeping.
* `visibilitychange` listener seamlessly swaps between native `requestAnimationFrame` when foregrounded and a steady 30fps clock when unfocused or backgrounded.

### Layer 5: Manual Recovery Control
An interactive `SYNC: REALTIME ⚡` pill is placed directly in the live HUD strip. Clicking it instantly force-restarts the animation frame pipeline.

---

## 3. Maintenance Checklist for Future Releases

1. **Always use nullish coalescing (`??`) for numerical settings:** Never use `||` on numbers where `0` is a valid value (e.g. `intensity ?? 100`, `gate ?? 0`).
2. **Never spread `Uint8Array` into `Math.max()`:** Use linear non-allocating for-loops to prevent garbage collector pauses.
3. **Keep `setLevels` throttled:** Never call React state setters on every animation frame.
4. **Deploy with bypass policy:** Always deploy using:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process; & "C:\Users\freem\AppData\Roaming\npm\firebase.cmd" deploy --only hosting
   ```
