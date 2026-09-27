import React, { useRef, useEffect, useState, useCallback } from 'react';
import './index.css';

// --- ICONS ---
const Icons = {
  Play: () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M8 5v14l11-7z" /></svg>,
  Stop: () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M6 6h12v12H6z" /></svg>,
  Mic: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>,
  Monitor: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
  Expand: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>,
  Sparkles: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" /></svg>,
  Tunnel: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  Sacred: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" /><circle cx="12" cy="12" r="5" /></svg>,
  Wireframe: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M2 17 12 22 22 17" /><path d="M2 12 12 17 22 12" /><path d="M2 7 12 12 22 7" /><path d="M12 2 2 7l10 5 10-5-10-5z" /></svg>,
  Cyber: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>,
  Oscillo: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="2 12 6 12 9 4 15 20 18 12 22 12" /></svg>,
  Sliders: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>,
  Palette: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg>,
  Fx: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="12" cy="12" r="9" /><path d="M10 8h5a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-5" /><path d="M10 12h4" /><path d="M10 16h4" /></svg>,
  Matrix: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></svg>,
  Eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
};

// --- PRESET ENGINES ---
const ENGINES = [
  { id: 'sacred', name: 'Sacred Fractals', icon: Icons.Sacred, desc: 'Mandala symmetry, tessellations & kaleidoscopic flower of life' },
  { id: 'tunnel', name: 'Hyperspace Tunnel', icon: Icons.Tunnel, desc: '3D hyper-speed infinite warp tunnel with rotational warp' },
  { id: 'particles', name: 'Particle Swarm', icon: Icons.Sparkles, desc: 'Physics-based gravity vortex, fluid force fields & granular spark emitters' },
  { id: 'wireframe', name: 'Cyber Wireframe', icon: Icons.Wireframe, desc: 'Neon retro terrain topography & vector oscilloscope mesh' },
  { id: 'cyber', name: 'Glitch Matrix', icon: Icons.Cyber, desc: 'Digital artifacting, chromatic aberration, data distortion' },
  { id: 'bars', name: 'Vector Oscilloscope', icon: Icons.Oscillo, desc: 'Ultra-wide multi-band spectrum analyzer with harmonic reflection' }
];

// --- COLOR PALETTES ---
const PALETTES = [
  { id: 'cyberpunk', name: 'Neon Cyberpunk', colors: ['#ff007f', '#00f0ff', '#7928ca', '#ffe600'] },
  { id: 'electric', name: 'Electric Dreams', colors: ['#00ffcc', '#3b82f6', '#8b5cf6', '#ec4899'] },
  { id: 'solar', name: 'Solar Flare', colors: ['#ff4d00', '#ff9900', '#ffcc00', '#ff0055'] },
  { id: 'deepsea', name: 'Bioluminescent Abyss', colors: ['#00ffff', '#0077ff', '#00ff88', '#2e0854'] },
  { id: 'acid', name: 'Acid Monochrome', colors: ['#39ff14', '#00ff66', '#a6ff00', '#ffffff'] },
  { id: 'vaporwave', name: 'Synthwave Sunset', colors: ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff'] }
];

// --- MODULATION MATRIX TARGETS (DISTINCT VISUAL PATTERNS) ---
const MOD_TARGETS = [
  { id: 'reverse_spin', name: 'Spin Direction: Reverse (Counter-Clockwise)' },
  { id: 'vortex_spin', name: 'Spin Direction: Forward (Clockwise Accelerator)' },
  { id: 'shockwave', name: 'Radial Shockwave & Pulse Explosion' },
  { id: 'wave_current', name: 'Sinusoidal Wave & Fluid Undulation' },
  { id: 'warp_tunnel', name: '3D Warp Thrust & Tunnel Speed' },
  { id: 'kaleido_facets', name: 'Kaleidoscope Facets & Mirror Symmetry' },
  { id: 'laser_beams', name: 'Starburst Laser Streaks & Filament Lightning' },
  { id: 'particle_mass', name: 'Particle Mass & Stardust Sparkle' },
  { id: 'color_cycle', name: 'Chromatic Hue Cycle & Color Jump' },
  { id: 'film_strobe', name: 'Film Strobe & Glow Bloom' }
];

export default function App() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const bgTimerRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const waveDataArrayRef = useRef(null);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const wakeLockRef = useRef(null);
  const renderFrameRef = useRef(null);
  const lastUiUpdateRef = useRef(0);
  const lastRenderTimestampRef = useRef(performance.now());

  // App & Source State
  const [isRunning, setIsRunning] = useState(false);
  const [sourceType, setSourceType] = useState(null); // 'tab' | 'mic'
  const [activeEngine, setActiveEngine] = useState('sacred');
  const [activePalette, setActivePalette] = useState('cyberpunk');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'engine' | 'palette' | 'postfx'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [keepAwake, setKeepAwake] = useState(true);

  // Live RMS Audio Levels for Strips
  const [levels, setLevels] = useState({ low: 0, mid: 0, high: 0, peak: 0, sub: 0 });

  // EQ Band Gain Sensitivities
  const [subGain, setSubGain] = useState(120);
  const [lowGain, setLowGain] = useState(100);
  const [midGain, setMidGain] = useState(100);
  const [highGain, setHighGain] = useState(100);
  const [masterGain, setMasterGain] = useState(100);

  // Ableton-style Modular Matrix Routing: map audio sources to visual targets with Threshold Gate & Depth
  const [modMatrix, setModMatrix] = useState({
    sub: { target: 'warp_tunnel', amount: 150, gate: 15, intensity: 120 },
    low: { target: 'shockwave', amount: 150, gate: 20, intensity: 120 },
    mid: { target: 'wave_current', amount: 130, gate: 15, intensity: 100 },
    high: { target: 'reverse_spin', amount: 180, gate: 10, intensity: 130 }
  });

  // Dedicated Visual Engine Parameters (Engine-Specific & Tailored)
  const [params, setParams] = useState({
    // Global & PostFX
    speed: 1.0,
    bloom: 60,
    chroma: 40,
    grain: 20,
    strobe: 0,
    density: 8,
    repetition: 6,
    wireframeDetail: 32,
    particleCount: 800,

    // 1. Sacred Fractals
    sacredRings: 8,
    sacredPetals: 6,
    sacredScale: 1.0,
    sacredLineWidth: 2,

    // 2. Hyperspace Tunnel
    tunnelRings: 28,
    tunnelSides: 6,
    tunnelSpeed: 1.0,
    tunnelCoreSize: 20,

    // 3. Particle Swarm
    particleSize: 3,
    particleSwirl: 1.0,
    filamentDistance: 140,

    // 4. Cyber Wireframe
    wireframeCols: 32,
    wireframeRows: 18,
    wireframeHeight: 180,
    wireframeTilt: 15,

    // 5. Glitch Matrix
    matrixBands: 48,
    glitchIntensity: 30,
    scanlineSpeed: 1.0,
    matrixSliceScale: 1.0,

    // 6. Vector Oscilloscope
    oscilloWidth: 3,
    oscilloMirrors: 3,
    oscilloHeight: 1.0,
    oscilloSpread: 1.0
  });

  // Dynamic particle buffer state for particle engine
  const particlesRef = useRef([]);

  // Previous frame band energy for decoupled, punchy transient detection per band
  const prevBandsRef = useRef({ sub: 0, low: 0, mid: 0, high: 0 });

  // Mutable refs for zero-latency 60-120fps animation loop
  const stateRef = useRef({
    isRunning: false,
    activeEngine,
    activePalette,
    subGain, lowGain, midGain, highGain, masterGain,
    modMatrix,
    params,
    time: 0,
    rot: 0,
    tunnelZ: 0
  });

  // Sync state to refs immediately
  useEffect(() => {
    stateRef.current.activeEngine = activeEngine;
    stateRef.current.activePalette = activePalette;
    stateRef.current.subGain = subGain;
    stateRef.current.lowGain = lowGain;
    stateRef.current.midGain = midGain;
    stateRef.current.highGain = highGain;
    stateRef.current.masterGain = masterGain;
    stateRef.current.modMatrix = modMatrix;
    stateRef.current.params = params;
  }, [activeEngine, activePalette, subGain, lowGain, midGain, highGain, masterGain, modMatrix, params]);

  // Request Screen WakeLock to prevent browser / display from sleeping
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (e) {
      // Wake lock not supported or denied
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => { });
      wakeLockRef.current = null;
    }
  };

  // Initialize particles helper
  const initParticles = () => {
    const pts = [];
    const count = 1200;
    for (let i = 0; i < count; i++) {
      pts.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * 2000,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: Math.random() * 4 + 2,
        size: Math.random() * 3 + 1,
        hueOffset: Math.random() * 60
      });
    }
    particlesRef.current = pts;
  };

  // --- CORE 60FPS RENDER PIPELINE WITH ZERO-CRASH RESILIENCE ---
  const renderLoop = useCallback(function tick() {
    if (!stateRef.current.isRunning) return;
    try {
      if (renderFrameRef.current) {
        renderFrameRef.current();
      }
    } catch (err) {
      console.error('Render loop frame error (continuing loop):', err);
    }
    animRef.current = requestAnimationFrame(tick);
  }, []);

  // Keep rendering and audio processing active even when Tab is unfocused or in background
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // Tab moved to background: keep Web Audio context awake & force continuous tick
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
        if (stateRef.current.isRunning && !bgTimerRef.current) {
          bgTimerRef.current = setInterval(() => {
            if (renderFrameRef.current) {
              try {
                renderFrameRef.current();
              } catch (_) {}
            }
          }, 1000 / 30); // 30fps steady background clock
        }
      } else {
        // Tab in foreground: clear background interval and switch back to requestAnimationFrame
        if (bgTimerRef.current) {
          clearInterval(bgTimerRef.current);
          bgTimerRef.current = null;
        }
        if (stateRef.current.isRunning) {
          cancelAnimationFrame(animRef.current);
          animRef.current = requestAnimationFrame(renderLoop);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (bgTimerRef.current) clearInterval(bgTimerRef.current);
    };
  }, [renderLoop]);

  // Self-Healing Render Watchdog: Guarantees visualizer NEVER freezes
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

  // Handle Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvasRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width * dpr;
        canvasRef.current.height = rect.height * dpr;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stop & Clean up Streams
  const stopAudio = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    if (bgTimerRef.current) {
      clearInterval(bgTimerRef.current);
      bgTimerRef.current = null;
    }
    releaseWakeLock();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setIsRunning(false);
    stateRef.current.isRunning = false;
    setSourceType(null);
    setLevels({ low: 0, mid: 0, high: 0, peak: 0, sub: 0 });

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

  // Setup Web Audio Graph with sub-millisecond sync and crash-proof graph
  const buildAudioGraph = useCallback((stream) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    // 0.25 smoothing provides razor-sharp, millisecond-tight reaction to beats and transients
    analyser.smoothingTimeConstant = 0.25;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    // Create an inaudible gain node connected to destination to force the browser audio pipeline to NEVER sleep
    // Gain is strictly 0 to avoid echo cancellation feedback loops or Windows WASAPI stream stalls
    const keepAliveGain = audioCtx.createGain();
    keepAliveGain.gain.setValueAtTime(0, audioCtx.currentTime);
    source.connect(keepAliveGain);
    keepAliveGain.connect(audioCtx.destination);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    waveDataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    streamRef.current = stream;

    // Monitor track ended events (e.g. user clicked browser "Stop sharing" button)
    stream.getTracks().forEach(track => {
      track.onended = () => {
        if (stream.getAudioTracks().every(t => t.readyState === 'ended')) {
          stopAudio();
        }
      };
    });

    setIsRunning(true);
    stateRef.current.isRunning = true;

    // Request screen wake lock
    if (keepAwake) requestWakeLock();

    // Initialize particles
    initParticles();

    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(renderLoop);
  }, [keepAwake, renderLoop, stopAudio]);

  // Capture system/tab audio via getDisplayMedia (Edge/Chrome preferred)
  const captureTabAudio = async () => {
    setError('');
    try {
      stopAudio();
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000
        }
      });
      // Do NOT kill the video track immediately or some browsers pause the whole stream on Alt+Tab.
      // We keep the track alive in memory so background streaming never sleeps.
      buildAudioGraph(stream);
      setSourceType('tab');
    } catch (err) {
      setError('Audio capture cancelled or blocked. In the Edge/Chrome share picker, select a tab or window and enable the "Share with system audio" toggle at the bottom before clicking Share.');
    }
  };

  // Capture Microphone Audio (or Stereo Mix for Firefox)
  const captureMic = async () => {
    setError('');
    try {
      stopAudio();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      buildAudioGraph(stream);
      setSourceType('mic');
    } catch (err) {
      setError('Microphone access was denied. Please allow microphone permissions.');
    }
  };

  // Matrix Value Evaluator with Noise / Effect Gate Threshold
  const getModValue = (targetId, currentBandValues) => {
    let modSum = 0;
    const { modMatrix } = stateRef.current;
    if (!modMatrix) return 0;

    const evalBand = (bandKey) => {
      const route = modMatrix[bandKey];
      if (!route || route.target !== targetId) return 0;
      const rawVal = Number(currentBandValues[bandKey]) || 0;
      const gateThresh = (Number(route.gate ?? 0)) / 100;
      // Depth: audio-reactive sensitivity (0-500% → 0-5x multiplier on signal above gate)
      const depth = (Number(route.amount ?? 0)) / 100;
      // Intensity: flat output amplifier applied once gate clears (0-400% → 0-4x)
      const intensity = (route.intensity !== undefined ? Number(route.intensity) : 100) / 100;

      // If signal does not pass threshold gate, output is strictly zeroed
      if (rawVal < gateThresh || rawVal <= 0.005) return 0;

      // activeRange: 0–1 representing how far above gate the signal is
      const activeRange = (rawVal - gateThresh) / (1 - gateThresh + 0.0001);
      // Final output = activeRange × depth × intensity × masterGain
      return Math.min(8, activeRange * depth * intensity * (currentBandValues.master || 1.0));
    };

    modSum += evalBand('sub');
    modSum += evalBand('low');
    modSum += evalBand('mid');
    modSum += evalBand('high');

    return isNaN(modSum) ? 0 : modSum;
  };

  // Single Frame Render Engine
  const renderFrame = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    lastRenderTimestampRef.current = performance.now();

    // Automatically resume suspended audio context if Chrome/Edge paused it
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }

    const analyser = analyserRef.current;
    const freqData = dataArrayRef.current;
    const waveData = waveDataArrayRef.current;
    analyser.getByteFrequencyData(freqData);
    analyser.getByteTimeDomainData(waveData);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    if (W === 0 || H === 0) return;
    const cx = W / 2;
    const cy = H / 2;

    const st = stateRef.current;
    st.time += 0.015 * st.params.speed;

    // Calculate true isolated acoustic frequency sub-bands (FFT 2048 at ~48kHz = ~23.4Hz/bin):
    // 1. Sub Bass: 20 Hz - 65 Hz (bins 1 to 3) - strictly kicks & sub drops, zero bleed
    let subSum = 0, subMax = 0;
    for (let i = 1; i <= 3; i++) {
      const v = freqData[i] || 0;
      subSum += v;
      if (v > subMax) subMax = v;
    }
    const rawSub = (subSum / 3) / 255;
    const subPunch = Math.max(0, rawSub - (prevBandsRef.current.sub || 0));
    const subVal = Math.min(1, (Math.pow(rawSub, 1.1) * (st.subGain / 100) * 1.5) + (subPunch * 0.4));

    // 2. Low / Bass: 65 Hz - 250 Hz (bins 4 to 11) - punchy kicks, basslines, 808 body
    let lowSum = 0, lowMax = 0;
    for (let i = 4; i <= 11; i++) {
      const v = freqData[i] || 0;
      lowSum += v;
      if (v > lowMax) lowMax = v;
    }
    const rawLow = (lowSum / 8) / 255;
    const lowPunch = Math.max(0, rawLow - (prevBandsRef.current.low || 0));
    const lowVal = Math.min(1, (Math.pow(rawLow, 1.1) * (st.lowGain / 100) * 1.4) + (lowPunch * 0.35));

    // 3. Mids / Vocals & Synths: 250 Hz - 2500 Hz (bins 12 to 108) - vocals, snares, synths
    let midSum = 0;
    for (let i = 12; i <= 108; i++) {
      midSum += freqData[i] || 0;
    }
    const rawMid = (midSum / 97) / 255;
    const midPunch = Math.max(0, rawMid - (prevBandsRef.current.mid || 0));
    const midVal = Math.min(1, (Math.pow(rawMid, 1.0) * (st.midGain / 100) * 1.4) + (midPunch * 0.3));

    // 4. Highs / Hi-Hats & Cymbals: 2500 Hz - 16000 Hz (bins 109 to 680) - hi-hats, air, sibilance
    let highSum = 0, highMax = 0;
    let highCount = 0;
    for (let i = 109; i <= 680; i += 2) {
      const v = freqData[i] || 0;
      // High-shelf loudness weighting: compensate for natural 1/f spectral rolloff
      const weight = 1 + ((i - 109) / (680 - 109)) * 1.8;
      const weightedV = Math.min(255, v * weight);
      highSum += weightedV;
      if (weightedV > highMax) highMax = weightedV;
      highCount++;
    }
    const avgHigh = (highSum / highCount) / 255;
    const peakHigh = highMax / 255;
    // Blend avg (35%) and peak (65%) so hi-hat transients spike clearly
    const rawHigh = (avgHigh * 0.35) + (peakHigh * 0.65);
    const highPunch = Math.max(0, rawHigh - (prevBandsRef.current.high || 0));
    const highVal = Math.min(1, (rawHigh * (st.highGain / 100) * 1.5) + (highPunch * 0.4));

    // Store current frame's raw band levels for next frame's decoupled punch detection
    prevBandsRef.current = {
      sub: rawSub,
      low: rawLow,
      mid: rawMid,
      high: rawHigh
    };

    // Fast non-allocating peak search (no array spreading or GC churn)
    let peakRaw = 0;
    for (let i = 0; i < 1024; i++) {
      if (freqData[i] > peakRaw) peakRaw = freqData[i];
    }
    const peak = peakRaw / 255;

    const bands = {
      sub: subVal,
      low: lowVal,
      mid: midVal,
      high: highVal,
      master: (st.masterGain / 100)
    };

    // Throttle React state update to ~30fps so React re-renders never choke or freeze the 60fps canvas thread
    const now = performance.now();
    if (now - lastUiUpdateRef.current >= 33) {
      lastUiUpdateRef.current = now;
      setLevels({
        sub: subVal,
        low: lowVal,
        mid: midVal,
        high: highVal,
        peak
      });
    }

    try {

    // --- MODULATION MATRIX VALUE RESOLUTION ---
    // Reverse vs Forward Spin
    const revSpinMod = getModValue('reverse_spin', bands);
    const fwdSpinMod = getModValue('vortex_spin', bands);
    const spinDelta = (fwdSpinMod - revSpinMod) * 0.15; // Allows counter-clockwise spin!

    // Shockwave & Pulse Explosion
    const shockMod = getModValue('shockwave', bands);

    // Sinusoidal Wave & Fluid Undulation
    const waveMod = getModValue('wave_current', bands);

    // 3D Warp Thrust & Tunnel Speed
    const warpMod = getModValue('warp_tunnel', bands);

    // Kaleidoscope Facets & Mirror Symmetry
    const kaleidoMod = getModValue('kaleido_facets', bands);

    // Starburst Laser Streaks & Filament Lightning
    const laserMod = getModValue('laser_beams', bands);

    // Particle Mass & Sparkle
    const massMod = getModValue('particle_mass', bands);

    // Chromatic Hue Cycle & Jump
    const hueJumpMod = getModValue('color_cycle', bands);

    // Film Strobe & Glow Bloom
    const strobeBloomMod = getModValue('film_strobe', bands);

    const bloomMod = (strobeBloomMod || 0) * 1.5 + (st.params.bloom / 100);
    const chromaMod = (st.params.chroma / 100);
    const grainMod = (st.params.grain / 100);

    // Angular accumulation with bidirectional spin
    st.rot += 0.005 + spinDelta;
    st.tunnelZ += (0.05 + warpMod * 0.4) * (st.activeEngine === 'tunnel' ? (st.params.tunnelSpeed || st.params.speed) : st.params.speed);

    // Palette Colors Lookup & Interpolator (with Hue Jump Modulation)
    const currentPal = PALETTES.find(p => p.id === st.activePalette) || PALETTES[0];
    const palColors = currentPal.colors;
    const colorOffset = Math.floor(hueJumpMod * palColors.length + st.time * 2);
    const c0 = palColors[(0 + colorOffset) % palColors.length];
    const c1 = palColors[(1 + colorOffset) % palColors.length];

    // Background Decay & Trail Rendering (Never let canvas blow out to pure white)
    ctx.save();
    if (st.params.strobe > 0 && peak > 0.92 && Math.random() < st.params.strobe / 100) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.15 * Math.min(bloomMod, 1.5)})`;
      ctx.fillRect(0, 0, W, H);
    } else {
      // High-contrast deep dark trailing decay
      ctx.fillStyle = 'rgba(8, 8, 12, 0.22)';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // --- ENGINE 1: SACRED FRACTALS & MANDALA SYMMETRY ---
    if (st.activeEngine === 'sacred') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(st.rot);

      const warpThrust = 1 + warpMod * 0.9;
      const petals = Math.max(3, Math.round((st.params.sacredPetals || 6) + kaleidoMod * 16 + bands.mid * 4));
      const rings = Math.max(2, Math.round((st.params.sacredRings || 8) + shockMod * 8 + bands.low * 6));
      const baseRadius = Math.min(W, H) * 0.28 * (st.params.sacredScale || 1.0) * warpThrust * (1 + bands.sub * 0.75 + shockMod * 0.5);
      const strokeW = (st.params.sacredLineWidth || 2) * (1 + massMod * 1.5);

      // 3D Receding Warp Depth Portal (when warp_tunnel is modulated)
      if (warpMod > 0.05) {
        ctx.save();
        for (let d = 3; d >= 1; d--) {
          const depthScale = 1 + d * warpMod * 0.45;
          ctx.strokeStyle = palColors[(d + colorOffset) % palColors.length];
          ctx.lineWidth = 1 + warpMod * 2;
          ctx.globalAlpha = 0.35 / d;
          ctx.beginPath();
          ctx.arc(0, 0, baseRadius * depthScale, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Shockwave Pulse Explosion Ring (when shockwave is modulated)
      if (shockMod > 0.08) {
        ctx.save();
        ctx.strokeStyle = palColors[colorOffset % palColors.length];
        ctx.lineWidth = 2 + shockMod * 6;
        ctx.shadowBlur = 24 * Math.min(bloomMod, 2);
        ctx.shadowColor = palColors[colorOffset % palColors.length];
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * (1 + shockMod * 0.6), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (let r = 1; r <= rings; r++) {
        const ringRad = (baseRadius / rings) * r * (1 + bands.low * 0.6);
        const col = palColors[(r - 1 + colorOffset) % palColors.length];

        ctx.strokeStyle = col;
        ctx.lineWidth = (strokeW + bloomMod * 2.5) * (1 + bands.low * 0.5);
        ctx.shadowBlur = 14 * Math.min(bloomMod, 2);
        ctx.shadowColor = col;

        for (let p = 0; p < petals; p++) {
          const angle = (p / petals) * Math.PI * 2;
          const waveRipple = Math.sin(angle * 4 + st.time * 6) * (waveMod * 35);
          const px = Math.cos(angle) * (ringRad + waveRipple);
          const py = Math.sin(angle) * (ringRad + waveRipple);
          const petalRadius = (ringRad * 0.5) * (1 + bands.mid * 1.5 + massMod * 0.8);

          ctx.beginPath();
          ctx.arc(px, py, Math.max(1, petalRadius), 0, Math.PI * 2);
          ctx.stroke();

          // Laser Starburst filaments
          if (laserMod > 0.08 || (r % 2 === 0 && bands.high > 0.12)) {
            const innerCol = palColors[(r + 1 + colorOffset) % palColors.length];
            ctx.fillStyle = innerCol;
            ctx.beginPath();
            ctx.arc(px, py, Math.max(1, petalRadius * (0.3 + (bands.high + laserMod) * 0.5)), 0, Math.PI * 2);
            ctx.fill();

            // Direct laser ray from center to petal
            if (laserMod > 0.12 && p % 2 === 0) {
              ctx.strokeStyle = innerCol;
              ctx.lineWidth = 1 + laserMod * 2;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(px, py);
              ctx.stroke();
            }
          }
        }
      }
      ctx.restore();
    }

    // --- ENGINE 2: 3D HYPERSPACE WARP TUNNEL (MULTI-BAND REACTIVE) ---
    else if (st.activeEngine === 'tunnel') {
      ctx.save();
      const bassShakeX = (Math.random() - 0.5) * ((bands.sub + shockMod) * 20);
      const bassShakeY = (Math.random() - 0.5) * ((bands.sub + shockMod) * 20);
      ctx.translate(cx + bassShakeX, cy + bassShakeY);
      ctx.rotate(st.rot * 0.5 + (bands.mid * 0.2));

      const tunnelRings = st.params.tunnelRings || 28;
      const sides = Math.max(3, Math.round((st.params.tunnelSides || 6) + kaleidoMod * 8));

      // LAYER 1: HIGHS & LASER BEAMS
      if (bands.high > 0.08 || laserMod > 0.1) {
        const starCount = Math.floor(20 + (bands.high + laserMod) * 60);
        ctx.save();
        for (let s = 0; s < starCount; s++) {
          const angle = (s / starCount) * Math.PI * 2 + (st.time * (2 + spinDelta * 10));
          const rInner = (Math.min(W, H) * 0.05) + Math.random() * 20;
          const rOuter = (Math.min(W, H) * 0.6) * (1 + (bands.high + laserMod) * 0.6);
          const x1 = Math.cos(angle) * rInner;
          const y1 = Math.sin(angle) * rInner;
          const x2 = Math.cos(angle) * rOuter;
          const y2 = Math.sin(angle) * rOuter;
          const laserCol = palColors[(s + colorOffset) % palColors.length];

          ctx.strokeStyle = laserCol;
          ctx.lineWidth = 1 + (bands.high + laserMod) * 2.5;
          ctx.shadowBlur = 10 * bloomMod;
          ctx.shadowColor = laserCol;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // LAYER 2: LOW & SUB PORTAL RINGS
      for (let i = tunnelRings; i >= 1; i--) {
        const depth = ((i * 35 + st.tunnelZ * 120) % 1000) / 1000;
        const bassExpansion = (1 + bands.sub * 0.8 + bands.low * 0.4 + shockMod * 0.7);
        const scale = Math.pow(depth, 3.2) * (Math.min(W, H) * 0.9) * bassExpansion;
        const alpha = Math.sin(depth * Math.PI) * (0.4 + bloomMod * 0.5);
        const col = palColors[(i + colorOffset) % palColors.length];

        ctx.strokeStyle = col;
        ctx.lineWidth = (1 - depth) * (3 + bands.low * 4 + massMod * 3) + bloomMod * 2;
        ctx.shadowBlur = 14 * Math.min(bloomMod, 2) * (1 - depth);
        ctx.shadowColor = col;

        ctx.beginPath();
        for (let s = 0; s <= sides; s++) {
          const midRipple = Math.sin(s * 2 + st.time * 6) * ((bands.mid + waveMod) * 35 * depth);
          const a = (s / sides) * Math.PI * 2 + depth * (st.rot * 2 + bands.mid * 1.5);
          const x = Math.cos(a) * (scale + midRipple);
          const y = Math.sin(a) * (scale + midRipple);
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner Resonator Rings
        if (i % 3 === 0 && (bands.mid > 0.12 || waveMod > 0.1)) {
          const midCol = palColors[(i + 1 + colorOffset) % palColors.length];
          const innerScale = scale * 0.55 * (1 + Math.sin(st.time * 8 + depth * 5) * (bands.mid + waveMod) * 0.3);
          ctx.strokeStyle = midCol;
          ctx.lineWidth = 1.5 + (bands.mid + waveMod) * 2;
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(1, innerScale), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Center Singularity
      const baseCore = st.params.tunnelCoreSize || 20;
      const coreSize = (baseCore + (bands.sub + shockMod) * 40 + bands.low * 15) * (1 + bloomMod * 0.5);
      const coreCol = palColors[colorOffset % palColors.length];
      ctx.fillStyle = coreCol;
      ctx.shadowBlur = 25 * Math.min(bloomMod, 2);
      ctx.shadowColor = coreCol;
      ctx.beginPath();
      ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // --- ENGINE 3: PARTICLE SWARM & FLUID VORTEX (MULTI-BAND DISPERSION) ---
    else if (st.activeEngine === 'particles') {
      ctx.save();
      const pts = particlesRef.current;

      // Dynamic Forward Warp & Shockwave
      const forwardBoost = (1 + bands.sub * 4.5 + warpMod * 4.0) * st.params.speed;
      const subShockwave = bands.sub > 0.4 || shockMod > 0.25;

      // Particle Mass & Scaling
      const lowPulse = 1 + bands.low * 2.2 + massMod * 2.0;

      // Vortex angular speed with DIRECTIONAL REVERSE / FORWARD control!
      const swirlFactor = st.params.particleSwirl || 1.0;
      const vortexSpeed = (0.015 + spinDelta * 1.5 + bands.mid * 0.08) * swirlFactor;
      const waveFreq = st.time * 4 + (bands.mid + waveMod) * 8;

      // Highs & Laser filaments
      const highActive = bands.high > 0.15 || laserMod > 0.15;
      const activeCount = Math.min(pts.length, Math.round((st.params.particleCount || 800) + massMod * 600 + (bands.high + laserMod) * 500));

      // 1. RADIAL SHOCKWAVE EXPLOSION
      if (subShockwave) {
        ctx.save();
        const shockRadius = ((st.time * 800) % Math.max(W, H)) * ((bands.sub + shockMod) * 0.95);
        ctx.strokeStyle = palColors[colorOffset % palColors.length];
        ctx.lineWidth = 2 + (bands.sub + shockMod) * 7;
        ctx.shadowBlur = 20 * bloomMod;
        ctx.shadowColor = palColors[colorOffset % palColors.length];
        ctx.beginPath();
        ctx.arc(cx, cy, shockRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 2. CONCENTRIC ACOUSTIC PULSE RINGS
      if (bands.low > 0.25 || shockMod > 0.1) {
        ctx.save();
        const numRings = 3;
        for (let r = 1; r <= numRings; r++) {
          const rRadius = (Math.min(W, H) * 0.18 * r) * lowPulse;
          const rCol = palColors[(r + colorOffset) % palColors.length];
          ctx.strokeStyle = rCol;
          ctx.lineWidth = 1 + (bands.low + shockMod) * 2.5;
          ctx.globalAlpha = Math.min(0.6, (bands.low + shockMod) * 0.5);
          ctx.beginPath();
          ctx.arc(cx, cy, rRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. PARTICLE SIMULATION LOOP
      const basePSize = st.params.particleSize || 3;
      const maxFilamentDist = (st.params.filamentDistance || 140) + (bands.high + laserMod) * 120;

      for (let i = 0; i < activeCount; i++) {
        const p = pts[i];

        p.z -= forwardBoost * p.vz;
        if (p.z <= 0) {
          p.z = 2000;
          p.x = (Math.random() - 0.5) * 2000;
          p.y = (Math.random() - 0.5) * 2000;
        }

        const k = 400 / p.z;

        // VORTEX SWIRL: Uses signed vortexSpeed (Negative for Counter-Clockwise!)
        const distCenter = Math.hypot(p.x, p.y);
        const swirlAngle = vortexSpeed * (1200 / (distCenter + 60));
        const cosS = Math.cos(swirlAngle);
        const sinS = Math.sin(swirlAngle);
        const nx = p.x * cosS - p.y * sinS;
        const ny = p.x * sinS + p.y * cosS;
        p.x = nx;
        p.y = ny;

        // Radial push outward on Kick / Shockwave
        if (bands.low > 0.3 || shockMod > 0.2) {
          const push = 1 + (bands.low + shockMod) * 0.05;
          p.x *= push;
          p.y *= push;
          if (distCenter > 1600) {
            p.x *= 0.55;
            p.y *= 0.55;
          }
        }

        // Sinusoidal Wave Undulation
        const waveOffset = Math.sin(p.x * 0.01 + waveFreq) * ((bands.mid + waveMod) * 45);
        const screenX = cx + p.x * k;
        const screenY = cy + (p.y + waveOffset) * k;

        if (screenX >= 0 && screenX < W && screenY >= 0 && screenY < H) {
          const sparkle = highActive ? (1 + Math.sin(i + st.time * 20) * (bands.high + laserMod) * 2.0) : 1;
          const pSize = Math.max(1, p.size * (basePSize / 3) * k * (3.5 * lowPulse) * sparkle);

          const colIndex = (i + colorOffset) % palColors.length;
          const col = palColors[colIndex];
          const alpha = Math.min(1, (1 - p.z / 2000) * (0.6 + bloomMod * 0.4 + (bands.high + laserMod) * 0.4));

          ctx.fillStyle = col;
          ctx.shadowBlur = (8 + (bands.high + laserMod) * 20) * Math.min(bloomMod, 2);
          ctx.shadowColor = col;

          ctx.beginPath();
          ctx.arc(screenX, screenY, pSize, 0, Math.PI * 2);
          ctx.fill();

          // Kaleidoscope Facet Reflections (when kaleido_facets is modulated)
          if (kaleidoMod > 0.05 && i % 2 === 0) {
            const mirX = cx - (p.x * k);
            const mirY = cy - ((p.y + waveOffset) * k);
            ctx.beginPath();
            ctx.arc(mirX, mirY, pSize * 0.9, 0, Math.PI * 2);
            ctx.fill();
          }

          // Lightning Constellation Filaments
          if (highActive && i % 4 === 0 && i < activeCount - 1) {
            const nextP = pts[i + 1];
            const nextK = 400 / nextP.z;
            const nextScreenX = cx + nextP.x * nextK;
            const nextScreenY = cy + (nextP.y + waveOffset) * nextK;
            const filamentDist = Math.hypot(screenX - nextScreenX, screenY - nextScreenY);

            if (filamentDist < maxFilamentDist) {
              ctx.strokeStyle = col;
              ctx.lineWidth = 1 + (bands.high + laserMod) * 2;
              ctx.globalAlpha = Math.min(0.85, (1 - filamentDist / (maxFilamentDist * 1.8)) * (bands.high + laserMod));
              ctx.beginPath();
              ctx.moveTo(screenX, screenY);
              ctx.lineTo(nextScreenX, nextScreenY);
              ctx.stroke();
              ctx.globalAlpha = 1.0;
            }
          }
        }
      }

      ctx.restore();
    }

    // --- ENGINE 4: NEON CYBER TOPOGRAPHY WIREFRAME ---
    else if (st.activeEngine === 'wireframe') {
      ctx.save();
      ctx.translate(cx, cy * 1.15);
      const rows = st.params.wireframeRows || 18;
      const cols = Math.max(16, Math.round((st.params.wireframeCols || 32) + kaleidoMod * 16));
      const gridW = W * (1.2 + shockMod * 0.4);
      const gridH = H * (0.8 + warpMod * 0.5);
      const tiltDeg = st.params.wireframeTilt !== undefined ? st.params.wireframeTilt : 15;
      const tiltRad = (tiltDeg * Math.PI) / 180;
      const baseHeight = st.params.wireframeHeight || 180;

      ctx.rotate(tiltRad + (spinDelta * 3)); // Isometric camera angle + spin

      for (let r = 0; r < rows; r++) {
        const zRatio = (r / rows);
        const rowY = (r / rows) * gridH - gridH * 0.5;
        const col = palColors[(r + colorOffset) % palColors.length];

        ctx.strokeStyle = col;
        ctx.lineWidth = (1.5 + bloomMod + massMod * 1.5);
        ctx.shadowBlur = (8 + laserMod * 12) * Math.min(bloomMod, 2);
        ctx.shadowColor = col;

        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const colX = (c / cols) * gridW - gridW * 0.5;
          const freqIndex = Math.floor((c / cols) * freqData.length * 0.4);
          const waveElev = Math.sin(c * 0.4 + st.time * 6) * (waveMod * 60);
          const shockElev = Math.cos(r * 0.5 - st.time * 4) * (shockMod * 50);
          const elev = ((freqData[freqIndex] || 0) / 255) * (baseHeight * bands.master * (1 + bands.low * 1.5)) * Math.sin(c * 0.2 + st.time * 3) + waveElev + shockElev;
          const py = rowY - elev;

          c === 0 ? ctx.moveTo(colX, py) : ctx.lineTo(colX, py);
        }
        ctx.stroke();

        // Cross-wire laser beams
        if (laserMod > 0.15 && r % 3 === 0) {
          ctx.strokeStyle = palColors[(r + 2 + colorOffset) % palColors.length];
          ctx.lineWidth = 1 + laserMod * 2;
          ctx.beginPath();
          ctx.moveTo(-gridW * 0.5, rowY);
          ctx.lineTo(gridW * 0.5, rowY);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // --- ENGINE 5: GLITCH MATRIX & DATA SORTING ---
    else if (st.activeEngine === 'cyber') {
      ctx.save();
      const baseBands = st.params.matrixBands || 48;
      const bandsCount = Math.max(16, Math.round(baseBands + kaleidoMod * 24));
      const cellW = W / bandsCount;
      const sliceScale = st.params.matrixSliceScale || 1.0;
      const glitchChance = ((st.params.glitchIntensity ?? 30) / 100) * (0.15 + (bands.sub + shockMod) * 0.4);
      const scanSpeed = st.params.scanlineSpeed || 1.0;

      for (let i = 0; i < bandsCount; i++) {
        const binVal = ((freqData[Math.floor(i * (freqData.length / bandsCount))] || 0) / 255);
        const waveH = Math.sin(i * 0.3 + st.time * 5) * (waveMod * 80);
        const sliceH = Math.max(4, (binVal * H * sliceScale * (1 + bands.mid * 1.5) + waveH) * (1 + massMod * 0.8));
        const isGlitch = Math.random() < glitchChance;

        const xShift = spinDelta * 300;
        const x = (i * cellW + xShift + W) % W;
        const y = isGlitch ? Math.random() * (H - sliceH) : (H - sliceH) / 2;
        const col = palColors[(i + colorOffset) % palColors.length];

        ctx.fillStyle = col;
        ctx.shadowBlur = (laserMod > 0.1 ? 12 : 0) * bloomMod;
        ctx.shadowColor = col;
        ctx.fillRect(x, y, Math.max(1, cellW - 2), sliceH);

        // Cyber scanlines & Laser Streaks
        if (i % 2 === 0 || laserMod > 0.2) {
          ctx.fillStyle = palColors[(i + 1 + colorOffset) % palColors.length];
          const scanY = (y + st.time * (100 + warpMod * 200) * scanSpeed) % H;
          ctx.fillRect(x, scanY, Math.max(1, cellW - 2), (2 + laserMod * 4));
        }
      }
      ctx.restore();
    }

    // --- ENGINE 6: VECTOR OSCILLOSCOPE & HARMONIC SPECTRUM ---
    else if (st.activeEngine === 'bars') {
      ctx.save();
      const numPoints = waveData.length;
      const spread = st.params.oscilloSpread || 1.0;
      const step = (W / numPoints) * spread;
      const traceWidth = st.params.oscilloWidth || 3;
      const ampHeight = st.params.oscilloHeight || 1.0;

      ctx.strokeStyle = c0;
      ctx.lineWidth = (traceWidth + bloomMod * 2 + massMod * 3);
      ctx.shadowBlur = (15 + laserMod * 15) * Math.min(bloomMod, 2);
      ctx.shadowColor = c0;

      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const v = ((waveData[i] || 128) / 128.0) - 1.0;
        const waveDisplace = Math.sin(i * 0.05 + st.time * 8) * (waveMod * 50);
        const shockDisplace = (Math.random() - 0.5) * (shockMod * 40);
        const y = cy + (v * (H * 0.4 * ampHeight) * (1 + bands.low + bands.sub * 1.5 + warpMod) + waveDisplace + shockDisplace);
        const x = (i * step + (spinDelta * 200) + W) % W;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Mirrored Harmonic reflection & Kaleidoscope Multiplier
      const baseMirrors = st.params.oscilloMirrors || 3;
      const mirCount = Math.max(1, Math.round(baseMirrors + kaleidoMod * 3));
      for (let m = 1; m <= mirCount; m++) {
        ctx.strokeStyle = palColors[(m + colorOffset) % palColors.length];
        ctx.lineWidth = Math.max(1, (traceWidth * 0.5) + laserMod * 1.5);
        ctx.beginPath();
        for (let i = 0; i < numPoints; i += (m > 1 ? 2 : 1)) {
          const v = ((waveData[i] || 128) / 128.0) - 1.0;
          const y = cy - (v * (H * (0.3 / m) * ampHeight) * (1 + bands.high * 1.5));
          const x = (i * step) % W;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.restore();
    }

    // --- POST-PROCESSING: CHROMATIC GLITCH & GRAIN (Safe Overlays) ---
    if (chromaMod > 0.1 && bands.low > 0.35) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 0, 128, 0.04)';
      ctx.fillRect(Math.sin(st.time * 10) * 8, 0, W, H);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.fillRect(-Math.sin(st.time * 10) * 8, 0, W, H);
      ctx.restore();
    }

    // Dynamic Film Grain Overlay
    if (grainMod > 0.05) {
      ctx.save();
      const grainCount = Math.floor(Math.min(W * H * 0.00015 * grainMod, 400));
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let g = 0; g < grainCount; g++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
      }
      ctx.restore();
    }
    } catch (drawErr) {
      console.error('Frame render engine caught error (recovered):', drawErr);
      try {
        ctx.restore();
      } catch (_) {}
    }
  };

  useEffect(() => {
    renderFrameRef.current = renderFrame;
  });

  // Matrix Route Update Handler
  const handleMatrixChange = (band, field, value) => {
    setModMatrix(prev => ({
      ...prev,
      [band]: {
        ...prev[band],
        [field]: value
      }
    }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setIsFullscreen(false);
    }
  };

  const activeEngineObj = ENGINES.find(e => e.id === activeEngine) || ENGINES[0];
  const ActiveEngineIcon = activeEngineObj.icon;

  return (
    <div className={`daw-layout ${isFullscreen ? 'fullscreen-mode' : ''}`}>

      {/* --- TOP TRANSPORT & HEADER --- */}
      <header className="daw-topbar">
        <div className="topbar-section logo-section">
          <div className={`logo-indicator ${isRunning ? 'active' : ''}`}></div>
          <span className="logo-text">Cables</span>
          <span className="logo-sub">Audio Engine</span>
        </div>

        {/* AUDIO CAPTURE ACTIONS */}
        <div className="topbar-section capture-section">
          <button
            id="btn-capture-tab"
            className={`transport-btn capture-btn ${sourceType === 'tab' ? 'active-tab' : ''}`}
            onClick={captureTabAudio}
            title="Best in Edge/Chrome: pick a tab/window and toggle 'Share with system audio' at the bottom of the share dialog. Firefox works too but requires a separate audio permission step."
          >
            <Icons.Monitor /> Capture Tab Audio
          </button>
          <button
            id="btn-capture-mic"
            className={`transport-btn capture-btn ${sourceType === 'mic' ? 'active-mic' : ''}`}
            onClick={captureMic}
            title="Capture Microphone (or Stereo Mix for Firefox)"
          >
            <Icons.Mic /> Microphone / Stereo Mix
          </button>
          <button
            id="btn-stop"
            className={`transport-btn stop-btn ${!isRunning ? 'dimmed' : ''}`}
            onClick={stopAudio}
            title="Stop Audio & Visualizer"
          >
            <Icons.Stop /> Stop
          </button>
        </div>

        {/* ENGINE SELECTOR SHORTCUTS */}
        <div className="topbar-section engines-bar">
          {ENGINES.map(eng => {
            const IconComp = eng.icon;
            return (
              <button
                key={eng.id}
                className={`engine-chip ${activeEngine === eng.id ? 'active' : ''}`}
                onClick={() => setActiveEngine(eng.id)}
                title={eng.desc}
              >
                <IconComp />
                <span>{eng.name}</span>
              </button>
            );
          })}
        </div>

        {/* LIVE STATUS & CONTROLS */}
        <div className="topbar-section status-section">
          <button
            className={`awake-toggle-btn ${keepAwake ? 'active' : ''}`}
            onClick={() => setKeepAwake(!keepAwake)}
            title="Keep Audio Engine & Visuals awake in background / Alt-Tab"
          >
            <Icons.Eye />
            <span>{keepAwake ? 'AWAKE: ON' : 'AWAKE: OFF'}</span>
          </button>

          {isRunning ? (
            <span className="status-badge live">
              <span className="pulse-dot"></span>
              LIVE · {sourceType === 'tab' ? 'Browser Audio' : 'Mic / Stereo Mix'}
            </span>
          ) : (
            <span className="status-badge idle">● STANDBY</span>
          )}

          <button className="icon-btn" onClick={toggleFullscreen} title="Toggle Fullscreen">
            <Icons.Expand />
          </button>
        </div>
      </header>

      {/* --- MAIN VISUALIZER WORKSPACE --- */}
      <main className="daw-main">
        <canvas ref={canvasRef} className="viz-canvas" />

        {/* STANDBY / IDLE ONBOARDING SCREEN */}
        {!isRunning && (
          <div className="idle-overlay">
            <div className="idle-card">
              <div className="idle-badge">Soundcard &amp; Tab Audio Link</div>
              <h2>Ready to Visualize</h2>
              <p>Stream audio from any YouTube tab, SoundCloud, Spotify, or media player directly into the visualizer.</p>

              <div className="browser-tip-box">
                <div className="browser-tip-row">
                  <span className="browser-tip-badge recommended">&#x2B50; Edge / Chrome</span>
                  <span className="browser-tip-text">Click <strong>Capture Tab Audio</strong> &rarr; pick your tab &rarr; enable <strong>&quot;Share with system audio&quot;</strong> toggle &rarr; Share. Audio flows through instantly.</span>
                </div>
                <div className="browser-tip-row">
                  <span className="browser-tip-badge firefox">Firefox</span>
                  <span className="browser-tip-text">Use <strong>Microphone / Stereo Mix</strong> instead &mdash; set Windows sound input to <em>Stereo Mix</em> to capture system audio.</span>
                </div>
              </div>

              <div className="idle-actions">
                <button className="idle-action-btn primary" onClick={captureTabAudio}>
                  <Icons.Monitor /> Capture Tab Audio
                  <span className="idle-action-sub">Edge / Chrome &middot; enable &quot;Share with system audio&quot;</span>
                </button>
                <button className="idle-action-btn" onClick={captureMic}>
                  <Icons.Mic /> Microphone / Stereo Mix
                  <span className="idle-action-sub">Firefox &middot; or physical mic input</span>
                </button>
              </div>
              {error && <div className="error-callout">{error}</div>}
            </div>
          </div>
        )}

                {/* Live Audio Reactive HUD */}
        {isRunning && (
          <div className="live-hud-strip">
            <div className="hud-pill">
              <span className="hud-label">ENGINE</span>
              <span className="hud-val">{ENGINES.find(e => e.id === activeEngine)?.name}</span>
            </div>
            <div className="hud-pill">
              <span className="hud-label">PALETTE</span>
              <span className="hud-val">{PALETTES.find(p => p.id === activePalette)?.name}</span>
            </div>
            <div className="hud-pill">
              <span className="hud-label">PEAK</span>
              <span className="hud-val">{Math.round(levels.peak * 100)}%</span>
            </div>
            <div
              className="hud-pill"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                cancelAnimationFrame(animRef.current);
                animRef.current = requestAnimationFrame(renderLoop);
              }}
              title="Click to force-refresh render loop"
            >
              <span className="hud-label">SYNC</span>
              <span className="hud-val" style={{ color: '#00ffcc' }}>REALTIME ⚡</span>
            </div>
          </div>
        )}
      </main>

      {/* --- ABLETON / SERATO DOCKABLE DEVICE RACK --- */}
      <footer className="daw-rack">

        {/* RACK TABS */}
        <div className="rack-header">
          <div className="rack-tabs">
            <button
              className={`rack-tab ${activeTab === 'matrix' ? 'active' : ''}`}
              onClick={() => setActiveTab('matrix')}
            >
              <Icons.Matrix /> Modulation Matrix (EQ → Visual FX)
            </button>
            <button
              className={`rack-tab ${activeTab === 'engine' ? 'active' : ''}`}
              onClick={() => setActiveTab('engine')}
            >
              <Icons.Sliders /> Engine Parameters
            </button>
            <button
              className={`rack-tab ${activeTab === 'palette' ? 'active' : ''}`}
              onClick={() => setActiveTab('palette')}
            >
              <Icons.Palette /> Color Harmonics
            </button>
            <button
              className={`rack-tab ${activeTab === 'postfx' ? 'active' : ''}`}
              onClick={() => setActiveTab('postfx')}
            >
              <Icons.Fx /> Post-Processing Shaders
            </button>
          </div>
          <span className="rack-info">Ableton Live FX Rack v2.0 · Background Audio Lock</span>
        </div>

        <div className="rack-content">

          {/* TAB 1: MODULATION MATRIX ROUTING */}
          {activeTab === 'matrix' && (
            <div className="rack-device-grid">
              {/* SUB BASS STRIP */}
              <div className={`device-channel ${levels.sub >= ((modMatrix.sub.gate ?? 0) / 100) && levels.sub > 0.02 ? 'gate-triggered' : ''}`}>
                <div className="channel-banner" style={{ backgroundColor: '#ff0055' }}>
                  <span>Sub Bass (20–65Hz)</span>
                  <span className={`gate-status-tag ${levels.sub >= ((modMatrix.sub.gate ?? 0) / 100) && levels.sub > 0.02 ? 'active' : ''}`}>
                    {levels.sub >= ((modMatrix.sub.gate ?? 0) / 100) && levels.sub > 0.02 ? 'OPEN' : 'GATE'}
                  </span>
                </div>
                <div className="channel-body">
                  <div className="meter-container" title={`Gate Threshold: ${modMatrix.sub.gate ?? 0}% (Level: ${Math.round(levels.sub * 100)}%)`}>
                    <div className="meter-gate-line" style={{ bottom: `${modMatrix.sub.gate ?? 0}%` }}></div>
                    <div className="meter-bar" style={{ height: `${Math.min(100, levels.sub * 100)}%`, backgroundColor: '#ff0055' }}></div>
                  </div>
                  <div className="control-column">
                    <span className="strip-title">Gain</span>
                    <input
                      type="range" min="0" max="250" value={subGain}
                      onChange={e => setSubGain(Number(e.target.value))}
                      className="fader-input"
                    />
                    <span className="fader-val">{subGain}%</span>
                  </div>
                  <div className="matrix-routing-box">
                    <label>Routes to FX:</label>
                    <select
                      value={modMatrix.sub.target}
                      onChange={e => handleMatrixChange('sub', 'target', e.target.value)}
                      className="matrix-select"
                    >
                      {MOD_TARGETS.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <div className="mod-depth-row">
                      <span>Gate</span>
                      <input
                        type="range" min="0" max="90" value={modMatrix.sub.gate ?? 0}
                        onChange={e => handleMatrixChange('sub', 'gate', Number(e.target.value))}
                        className="fader-mini gate-slider"
                        title="Noise / Trigger Gate Threshold: signal below this is strictly muted"
                      />
                      <span>{modMatrix.sub.gate ?? 0}%</span>
                    </div>
                    <div className="mod-depth-row">
                      <span>Depth</span>
                      <input
                        type="range" min="0" max="500" value={modMatrix.sub.amount ?? 150}
                        onChange={e => handleMatrixChange('sub', 'amount', Number(e.target.value))}
                        className="fader-mini"
                        title="Audio-reactive sensitivity: how much signal above gate drives the effect"
                      />
                      <span>{modMatrix.sub.amount ?? 150}%</span>
                    </div>
                    <div className="mod-depth-row">
                      <span>Intensity</span>
                      <input
                        type="range" min="0" max="400" value={modMatrix.sub.intensity ?? 100}
                        onChange={e => handleMatrixChange('sub', 'intensity', Number(e.target.value))}
                        className="fader-mini intensity-slider"
                        title="Output strength: flat amplifier applied to visual effect once gate clears"
                      />
                      <span>{modMatrix.sub.intensity ?? 100}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LOW BASS STRIP */}
              <div className={`device-channel ${levels.low >= ((modMatrix.low.gate ?? 0) / 100) && levels.low > 0.02 ? 'gate-triggered' : ''}`}>
                <div className="channel-banner" style={{ backgroundColor: '#ff9900' }}>
                  <span>Low / Kick (65–250Hz)</span>
                  <span className={`gate-status-tag ${levels.low >= ((modMatrix.low.gate ?? 0) / 100) && levels.low > 0.02 ? 'active' : ''}`}>
                    {levels.low >= ((modMatrix.low.gate ?? 0) / 100) && levels.low > 0.02 ? 'OPEN' : 'GATE'}
                  </span>
                </div>
                <div className="channel-body">
                  <div className="meter-container" title={`Gate Threshold: ${modMatrix.low.gate ?? 0}% (Level: ${Math.round(levels.low * 100)}%)`}>
                    <div className="meter-gate-line" style={{ bottom: `${modMatrix.low.gate ?? 0}%` }}></div>
                    <div className="meter-bar" style={{ height: `${Math.min(100, levels.low * 100)}%`, backgroundColor: '#ff9900' }}></div>
                  </div>
                  <div className="control-column">
                    <span className="strip-title">Gain</span>
                    <input
                      type="range" min="0" max="250" value={lowGain}
                      onChange={e => setLowGain(Number(e.target.value))}
                      className="fader-input"
                    />
                    <span className="fader-val">{lowGain}%</span>
                  </div>
                  <div className="matrix-routing-box">
                    <label>Routes to FX:</label>
                    <select
                      value={modMatrix.low.target}
                      onChange={e => handleMatrixChange('low', 'target', e.target.value)}
                      className="matrix-select"
                    >
                      {MOD_TARGETS.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <div className="mod-depth-row">
                      <span>Gate</span>
                      <input
                        type="range" min="0" max="90" value={modMatrix.low.gate ?? 0}
                        onChange={e => handleMatrixChange('low', 'gate', Number(e.target.value))}
                        className="fader-mini gate-slider"
                        title="Noise / Trigger Gate Threshold: signal below this is strictly muted"
                      />
                      <span>{modMatrix.low.gate ?? 0}%</span>
                    </div>
                    <div className="mod-depth-row">
                      <span>Depth</span>
                      <input
                        type="range" min="0" max="500" value={modMatrix.low.amount ?? 150}
                        onChange={e => handleMatrixChange('low', 'amount', Number(e.target.value))}
                        className="fader-mini"
                        title="Audio-reactive sensitivity: how much signal above gate drives the effect"
                      />
                      <span>{modMatrix.low.amount ?? 150}%</span>
                    </div>
                    <div className="mod-depth-row">
                      <span>Intensity</span>
                      <input
                        type="range" min="0" max="400" value={modMatrix.low.intensity ?? 100}
                        onChange={e => handleMatrixChange('low', 'intensity', Number(e.target.value))}
                        className="fader-mini intensity-slider"
                        title="Output strength: flat amplifier applied to visual effect once gate clears"
                      />
                      <span>{modMatrix.low.intensity ?? 100}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MIDS STRIP */}
              <div className={`device-channel ${levels.mid >= ((modMatrix.mid.gate ?? 0) / 100) && levels.mid > 0.02 ? 'gate-triggered' : ''}`}>
                <div className="channel-banner" style={{ backgroundColor: '#00ffcc', color: '#000' }}>
                  <span>Mids / Lead (250–2.5kHz)</span>
                  <span className={`gate-status-tag ${levels.mid >= ((modMatrix.mid.gate ?? 0) / 100) && levels.mid > 0.02 ? 'active' : ''}`}>
                    {levels.mid >= ((modMatrix.mid.gate ?? 0) / 100) && levels.mid > 0.02 ? 'OPEN' : 'GATE'}
                  </span>
                </div>
                <div className="channel-body">
                  <div className="meter-container" title={`Gate Threshold: ${modMatrix.mid.gate ?? 0}% (Level: ${Math.round(levels.mid * 100)}%)`}>
                    <div className="meter-gate-line" style={{ bottom: `${modMatrix.mid.gate ?? 0}%` }}></div>
                    <div className="meter-bar" style={{ height: `${Math.min(100, levels.mid * 100)}%`, backgroundColor: '#00ffcc' }}></div>
                  </div>
                  <div className="control-column">
                    <span className="strip-title">Gain</span>
                    <input
                      type="range" min="0" max="250" value={midGain}
                      onChange={e => setMidGain(Number(e.target.value))}
                      className="fader-input"
                    />
                    <span className="fader-val">{midGain}%</span>
                  </div>
                  <div className="matrix-routing-box">
                    <label>Routes to FX:</label>
                    <select
                      value={modMatrix.mid.target}
                      onChange={e => handleMatrixChange('mid', 'target', e.target.value)}
                      className="matrix-select"
                    >
                      {MOD_TARGETS.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <div className="mod-depth-row">
                      <span>Gate</span>
                      <input
                        type="range" min="0" max="90" value={modMatrix.mid.gate ?? 0}
                        onChange={e => handleMatrixChange('mid', 'gate', Number(e.target.value))}
                        className="fader-mini gate-slider"
                        title="Noise / Trigger Gate Threshold: signal below this is strictly muted"
                      />
                      <span>{modMatrix.mid.gate ?? 0}%</span>
                    </div>
                    <div className="mod-depth-row">
                      <span>Depth</span>
                      <input
                        type="range" min="0" max="500" value={modMatrix.mid.amount ?? 150}
                        onChange={e => handleMatrixChange('mid', 'amount', Number(e.target.value))}
                        className="fader-mini"
                        title="Audio-reactive sensitivity: how much signal above gate drives the effect"
                      />
                      <span>{modMatrix.mid.amount ?? 150}%</span>
                    </div>
                    <div className="mod-depth-row">
                      <span>Intensity</span>
                      <input
                        type="range" min="0" max="400" value={modMatrix.mid.intensity ?? 100}
                        onChange={e => handleMatrixChange('mid', 'intensity', Number(e.target.value))}
                        className="fader-mini intensity-slider"
                        title="Output strength: flat amplifier applied to visual effect once gate clears"
                      />
                      <span>{modMatrix.mid.intensity ?? 100}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* HIGHS STRIP */}
              <div className={`device-channel ${levels.high >= ((modMatrix.high.gate ?? 0) / 100) && levels.high > 0.02 ? 'gate-triggered' : ''}`}>
                <div className="channel-banner" style={{ backgroundColor: '#a855f7' }}>
                  <span>Highs / Hi-Hat (2.5k–16kHz)</span>
                  <span className={`gate-status-tag ${levels.high >= ((modMatrix.high.gate ?? 0) / 100) && levels.high > 0.02 ? 'active' : ''}`}>
                    {levels.high >= ((modMatrix.high.gate ?? 0) / 100) && levels.high > 0.02 ? 'OPEN' : 'GATE'}
                  </span>
                </div>
                <div className="channel-body">
                  <div className="meter-container" title={`Gate Threshold: ${modMatrix.high.gate ?? 0}% (Level: ${Math.round(levels.high * 100)}%)`}>
                    <div className="meter-gate-line" style={{ bottom: `${modMatrix.high.gate ?? 0}%` }}></div>
                    <div className="meter-bar" style={{ height: `${Math.min(100, levels.high * 100)}%`, backgroundColor: '#a855f7' }}></div>
                  </div>
                  <div className="control-column">
                    <span className="strip-title">Gain</span>
                    <input
                      type="range" min="0" max="250" value={highGain}
                      onChange={e => setHighGain(Number(e.target.value))}
                      className="fader-input"
                    />
                    <span className="fader-val">{highGain}%</span>
                  </div>
                  <div className="matrix-routing-box">
                    <label>Routes to FX:</label>
                    <select
                      value={modMatrix.high.target}
                      onChange={e => handleMatrixChange('high', 'target', e.target.value)}
                      className="matrix-select"
                    >
                      {MOD_TARGETS.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <div className="mod-depth-row">
                      <span>Gate</span>
                      <input
                        type="range" min="0" max="90" value={modMatrix.high.gate ?? 0}
                        onChange={e => handleMatrixChange('high', 'gate', Number(e.target.value))}
                        className="fader-mini gate-slider"
                        title="Noise / Trigger Gate Threshold: signal below this is strictly muted"
                      />
                      <span>{modMatrix.high.gate ?? 0}%</span>
                    </div>
                    <div className="mod-depth-row">
                      <span>Depth</span>
                      <input
                        type="range" min="0" max="500" value={modMatrix.high.amount ?? 150}
                        onChange={e => handleMatrixChange('high', 'amount', Number(e.target.value))}
                        className="fader-mini"
                        title="Audio-reactive sensitivity: how much signal above gate drives the effect"
                      />
                      <span>{modMatrix.high.amount ?? 150}%</span>
                    </div>
                    <div className="mod-depth-row">
                      <span>Intensity</span>
                      <input
                        type="range" min="0" max="400" value={modMatrix.high.intensity ?? 100}
                        onChange={e => handleMatrixChange('high', 'intensity', Number(e.target.value))}
                        className="fader-mini intensity-slider"
                        title="Output strength: flat amplifier applied to visual effect once gate clears"
                      />
                      <span>{modMatrix.high.intensity ?? 100}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MASTER OUTPUT GAIN */}
              <div className="device-channel master-channel">
                <div className="channel-banner" style={{ backgroundColor: '#ffffff', color: '#000' }}>Master Gain</div>
                <div className="channel-body">
                  <div className="meter-container">
                    <div className="meter-bar" style={{ height: `${Math.min(100, levels.peak * (masterGain / 100) * 100)}%`, backgroundColor: '#3b82f6' }}></div>
                  </div>
                  <div className="control-column">
                    <span className="strip-title">Master Output</span>
                    <input
                      type="range" min="0" max="200" value={masterGain}
                      onChange={e => setMasterGain(Number(e.target.value))}
                      className="fader-input"
                    />
                    <span className="fader-val">{masterGain}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEDICATED ENGINE PARAMETERS (UNIQUE PER EFFECT TYPE) */}
          {activeTab === 'engine' && (
            <div className="engine-parameters-view">
              {/* TOP ENGINE SWITCHER & STATUS BANNER */}
              <div className="engine-nav-banner">
                <div className="engine-nav-info">
                  <div className="engine-nav-badge">
                    <span className="engine-live-dot"></span>
                    ACTIVE ENGINE
                  </div>
                  <div className="engine-nav-title">
                    <ActiveEngineIcon />
                    <h3>{activeEngineObj.name}</h3>
                  </div>
                  <p className="engine-nav-desc">{activeEngineObj.desc}</p>
                </div>

                <div className="engine-pills-row" role="tablist" aria-label="Select Engine Preset">
                  {ENGINES.map(eng => {
                    const IconComp = eng.icon;
                    const isSelected = activeEngine === eng.id;
                    return (
                      <button
                        key={eng.id}
                        id={`btn-engine-switch-${eng.id}`}
                        className={`engine-pill-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => setActiveEngine(eng.id)}
                        title={eng.desc}
                      >
                        <IconComp />
                        <span>{eng.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* UNIQUE PARAMETERS PER ENGINE */}
              {activeEngine === 'sacred' && (
                <div className="rack-params-grid">
                  <div className="param-device-box">
                    <h4>Mandala Geometry & Harmonics</h4>
                    <div className="param-slider-row">
                      <label>Concentric Rings:</label>
                      <input
                        type="range" min="2" max="24" step="1" value={params.sacredRings ?? 8}
                        onChange={e => setParams({ ...params, sacredRings: Number(e.target.value) })}
                      />
                      <span>{params.sacredRings ?? 8} rings</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Petal Symmetry:</label>
                      <input
                        type="range" min="3" max="24" step="1" value={params.sacredPetals ?? 6}
                        onChange={e => setParams({ ...params, sacredPetals: Number(e.target.value) })}
                      />
                      <span>{params.sacredPetals ?? 6} petals</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Radial Scale:</label>
                      <input
                        type="range" min="0.4" max="2.5" step="0.1" value={params.sacredScale ?? 1.0}
                        onChange={e => setParams({ ...params, sacredScale: Number(e.target.value) })}
                      />
                      <span>{(params.sacredScale ?? 1.0).toFixed(1)}x</span>
                    </div>
                  </div>

                  <div className="param-device-box">
                    <h4>Stroke Dynamics & Rotation</h4>
                    <div className="param-slider-row">
                      <label>Stroke Width:</label>
                      <input
                        type="range" min="1" max="8" step="1" value={params.sacredLineWidth ?? 2}
                        onChange={e => setParams({ ...params, sacredLineWidth: Number(e.target.value) })}
                      />
                      <span>{params.sacredLineWidth ?? 2}px</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Rotation Velocity:</label>
                      <input
                        type="range" min="0.2" max="3.0" step="0.1" value={params.speed ?? 1.0}
                        onChange={e => setParams({ ...params, speed: Number(e.target.value) })}
                      />
                      <span>{(params.speed ?? 1.0).toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              )}

              {activeEngine === 'tunnel' && (
                <div className="rack-params-grid">
                  <div className="param-device-box">
                    <h4>Warp Geometry & Depth</h4>
                    <div className="param-slider-row">
                      <label>Ring Depth Layers:</label>
                      <input
                        type="range" min="10" max="60" step="2" value={params.tunnelRings ?? 28}
                        onChange={e => setParams({ ...params, tunnelRings: Number(e.target.value) })}
                      />
                      <span>{params.tunnelRings ?? 28} rings</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Polygon Facets:</label>
                      <input
                        type="range" min="3" max="16" step="1" value={params.tunnelSides ?? 6}
                        onChange={e => setParams({ ...params, tunnelSides: Number(e.target.value) })}
                      />
                      <span>{params.tunnelSides ?? 6} sides ({
                        params.tunnelSides === 3 ? 'Tri' :
                        params.tunnelSides === 4 ? 'Square' :
                        params.tunnelSides === 5 ? 'Penta' :
                        params.tunnelSides === 6 ? 'Hex' :
                        params.tunnelSides === 8 ? 'Octa' :
                        (params.tunnelSides ?? 6) >= 12 ? 'Cylinder' : 'Poly'
                      })</span>
                    </div>
                  </div>

                  <div className="param-device-box">
                    <h4>Warp Dynamics & Singularity</h4>
                    <div className="param-slider-row">
                      <label>Warp Speed Factor:</label>
                      <input
                        type="range" min="0.2" max="3.0" step="0.1" value={params.tunnelSpeed ?? 1.0}
                        onChange={e => setParams({ ...params, tunnelSpeed: Number(e.target.value) })}
                      />
                      <span>{(params.tunnelSpeed ?? 1.0).toFixed(1)}x</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Singularity Core:</label>
                      <input
                        type="range" min="5" max="60" step="5" value={params.tunnelCoreSize ?? 20}
                        onChange={e => setParams({ ...params, tunnelCoreSize: Number(e.target.value) })}
                      />
                      <span>{params.tunnelCoreSize ?? 20}px</span>
                    </div>
                  </div>
                </div>
              )}

              {activeEngine === 'particles' && (
                <div className="rack-params-grid">
                  <div className="param-device-box">
                    <h4>Particle Cloud Density</h4>
                    <div className="param-slider-row">
                      <label>Particle Count:</label>
                      <input
                        type="range" min="100" max="1500" step="50" value={params.particleCount ?? 800}
                        onChange={e => setParams({ ...params, particleCount: Number(e.target.value) })}
                      />
                      <span>{params.particleCount ?? 800}</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Stardust Grain Size:</label>
                      <input
                        type="range" min="1" max="8" step="1" value={params.particleSize ?? 3}
                        onChange={e => setParams({ ...params, particleSize: Number(e.target.value) })}
                      />
                      <span>{params.particleSize ?? 3}px</span>
                    </div>
                  </div>

                  <div className="param-device-box">
                    <h4>Fluid Dynamics & Filaments</h4>
                    <div className="param-slider-row">
                      <label>Vortex Swirl Rate:</label>
                      <input
                        type="range" min="0.2" max="3.0" step="0.1" value={params.particleSwirl ?? 1.0}
                        onChange={e => setParams({ ...params, particleSwirl: Number(e.target.value) })}
                      />
                      <span>{(params.particleSwirl ?? 1.0).toFixed(1)}x</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Filament Distance:</label>
                      <input
                        type="range" min="50" max="300" step="10" value={params.filamentDistance ?? 140}
                        onChange={e => setParams({ ...params, filamentDistance: Number(e.target.value) })}
                      />
                      <span>{params.filamentDistance ?? 140}px</span>
                    </div>
                  </div>
                </div>
              )}

              {activeEngine === 'wireframe' && (
                <div className="rack-params-grid">
                  <div className="param-device-box">
                    <h4>Terrain Mesh Topology</h4>
                    <div className="param-slider-row">
                      <label>Mesh Columns:</label>
                      <input
                        type="range" min="16" max="64" step="4" value={params.wireframeCols ?? 32}
                        onChange={e => setParams({ ...params, wireframeCols: Number(e.target.value) })}
                      />
                      <span>{params.wireframeCols ?? 32} cols</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Terrain Rows:</label>
                      <input
                        type="range" min="8" max="36" step="2" value={params.wireframeRows ?? 18}
                        onChange={e => setParams({ ...params, wireframeRows: Number(e.target.value) })}
                      />
                      <span>{params.wireframeRows ?? 18} rows</span>
                    </div>
                  </div>

                  <div className="param-device-box">
                    <h4>Elevation & Camera Geometry</h4>
                    <div className="param-slider-row">
                      <label>Bass Elevation:</label>
                      <input
                        type="range" min="60" max="350" step="10" value={params.wireframeHeight ?? 180}
                        onChange={e => setParams({ ...params, wireframeHeight: Number(e.target.value) })}
                      />
                      <span>{params.wireframeHeight ?? 180}px</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Isometric Camera Tilt:</label>
                      <input
                        type="range" min="0" max="45" step="1" value={params.wireframeTilt ?? 15}
                        onChange={e => setParams({ ...params, wireframeTilt: Number(e.target.value) })}
                      />
                      <span>{params.wireframeTilt ?? 15}°</span>
                    </div>
                  </div>
                </div>
              )}

              {activeEngine === 'cyber' && (
                <div className="rack-params-grid">
                  <div className="param-device-box">
                    <h4>Matrix Column Slices</h4>
                    <div className="param-slider-row">
                      <label>Column Bands:</label>
                      <input
                        type="range" min="16" max="96" step="4" value={params.matrixBands ?? 48}
                        onChange={e => setParams({ ...params, matrixBands: Number(e.target.value) })}
                      />
                      <span>{params.matrixBands ?? 48} bands</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Data Slice Scale:</label>
                      <input
                        type="range" min="0.5" max="3.0" step="0.1" value={params.matrixSliceScale ?? 1.0}
                        onChange={e => setParams({ ...params, matrixSliceScale: Number(e.target.value) })}
                      />
                      <span>{(params.matrixSliceScale ?? 1.0).toFixed(1)}x</span>
                    </div>
                  </div>

                  <div className="param-device-box">
                    <h4>Artifact Distortion & Scanlines</h4>
                    <div className="param-slider-row">
                      <label>Glitch Jitter Rate:</label>
                      <input
                        type="range" min="0" max="100" step="5" value={params.glitchIntensity ?? 30}
                        onChange={e => setParams({ ...params, glitchIntensity: Number(e.target.value) })}
                      />
                      <span>{params.glitchIntensity ?? 30}%</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Scanline Velocity:</label>
                      <input
                        type="range" min="0.2" max="3.0" step="0.1" value={params.scanlineSpeed ?? 1.0}
                        onChange={e => setParams({ ...params, scanlineSpeed: Number(e.target.value) })}
                      />
                      <span>{(params.scanlineSpeed ?? 1.0).toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              )}

              {activeEngine === 'bars' && (
                <div className="rack-params-grid">
                  <div className="param-device-box">
                    <h4>Oscilloscope Wave Trace</h4>
                    <div className="param-slider-row">
                      <label>Trace Line Width:</label>
                      <input
                        type="range" min="1" max="10" step="1" value={params.oscilloWidth ?? 3}
                        onChange={e => setParams({ ...params, oscilloWidth: Number(e.target.value) })}
                      />
                      <span>{params.oscilloWidth ?? 3}px</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Wave Amplitude:</label>
                      <input
                        type="range" min="0.3" max="2.5" step="0.1" value={params.oscilloHeight ?? 1.0}
                        onChange={e => setParams({ ...params, oscilloHeight: Number(e.target.value) })}
                      />
                      <span>{(params.oscilloHeight ?? 1.0).toFixed(1)}x</span>
                    </div>
                  </div>

                  <div className="param-device-box">
                    <h4>Harmonics & Frequency Spread</h4>
                    <div className="param-slider-row">
                      <label>Harmonic Mirrors:</label>
                      <input
                        type="range" min="1" max="8" step="1" value={params.oscilloMirrors ?? 3}
                        onChange={e => setParams({ ...params, oscilloMirrors: Number(e.target.value) })}
                      />
                      <span>{params.oscilloMirrors ?? 3} mirrors</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Frequency Spread:</label>
                      <input
                        type="range" min="0.5" max="2.0" step="0.1" value={params.oscilloSpread ?? 1.0}
                        onChange={e => setParams({ ...params, oscilloSpread: Number(e.target.value) })}
                      />
                      <span>{(params.oscilloSpread ?? 1.0).toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COLOR PALETTES */}
          {activeTab === 'palette' && (
            <div className="rack-palette-grid">
              {PALETTES.map(pal => (
                <div
                  key={pal.id}
                  className={`palette-card ${activePalette === pal.id ? 'active' : ''}`}
                  onClick={() => setActivePalette(pal.id)}
                >
                  <div className="palette-preview">
                    {pal.colors.map((c, i) => (
                      <div key={i} className="color-chip" style={{ backgroundColor: c }}></div>
                    ))}
                  </div>
                  <div className="palette-name">{pal.name}</div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: POST-PROCESSING SHADERS */}
          {activeTab === 'postfx' && (
            <div className="rack-params-grid">
              <div className="param-device-box">
                <h4>Bloom & Glow Intensity</h4>
                <div className="param-slider-row">
                  <label>Bloom Radius:</label>
                  <input
                    type="range" min="0" max="100" value={params.bloom}
                    onChange={e => setParams({ ...params, bloom: Number(e.target.value) })}
                  />
                  <span>{params.bloom}%</span>
                </div>
              </div>

              <div className="param-device-box">
                <h4>Chromatic Aberration & Prism</h4>
                <div className="param-slider-row">
                  <label>Color Split Offset:</label>
                  <input
                    type="range" min="0" max="100" value={params.chroma}
                    onChange={e => setParams({ ...params, chroma: Number(e.target.value) })}
                  />
                  <span>{params.chroma}%</span>
                </div>
              </div>

              <div className="param-device-box">
                <h4>Film Grain & Strobe Gating</h4>
                <div className="param-slider-row">
                  <label>Film Grain:</label>
                  <input
                    type="range" min="0" max="100" value={params.grain}
                    onChange={e => setParams({ ...params, grain: Number(e.target.value) })}
                  />
                  <span>{params.grain}%</span>
                </div>
                <div className="param-slider-row">
                  <label>Beat Strobe Gate:</label>
                  <input
                    type="range" min="0" max="100" value={params.strobe}
                    onChange={e => setParams({ ...params, strobe: Number(e.target.value) })}
                  />
                  <span>{params.strobe}%</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </footer>

    </div>
  );
}
