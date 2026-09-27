import React, { useRef, useEffect, useState, useCallback } from 'react';
import './index.css';

// --- ICONS ---
const Icons = {
  Play: () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M8 5v14l11-7z"/></svg>,
  Stop: () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M6 6h12v12H6z"/></svg>,
  Mic: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Monitor: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Expand: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
  Sparkles: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>,
  Tunnel: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Sacred: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><circle cx="12" cy="12" r="5"/></svg>,
  Wireframe: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M2 17 12 22 22 17"/><path d="M2 12 12 17 22 12"/><path d="M2 7 12 12 22 7"/><path d="M12 2 2 7l10 5 10-5-10-5z"/></svg>,
  Cyber: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  Oscillo: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="2 12 6 12 9 4 15 20 18 12 22 12"/></svg>,
  Sliders: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  Palette: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  Fx: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="12" cy="12" r="9"/><path d="M10 8h5a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-5"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>,
  Matrix: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>,
  Eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
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

// --- MODULATION MATRIX TARGETS ---
const MOD_TARGETS = [
  { id: 'geometry', name: 'Geometry Density / Complexity' },
  { id: 'repetition', name: 'Symmetry / Repeat Count' },
  { id: 'warp', name: '3D Camera Warp / Tunnel Speed' },
  { id: 'particles', name: 'Particle Emission & Velocity' },
  { id: 'chroma', name: 'Chromatic Aberration' },
  { id: 'bloom', name: 'Glow Bloom & Strobe' },
  { id: 'grain', name: 'Film Grain / Scanlines' },
  { id: 'rotation', name: 'Rotation / Spin Velocity' },
  { id: 'hue', name: 'Color Shift & Hue Cycling' }
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

  // Ableton-style Modular Matrix Routing: map audio sources to visual targets
  const [modMatrix, setModMatrix] = useState({
    sub: { target: 'warp', amount: 100 },
    low: { target: 'geometry', amount: 90 },
    mid: { target: 'rotation', amount: 75 },
    high: { target: 'particles', amount: 110 }
  });

  // Dedicated Visual Engine Parameters
  const [params, setParams] = useState({
    density: 8,
    repetition: 6,
    speed: 1.0,
    grain: 20,
    bloom: 60,
    chroma: 40,
    strobe: 0,
    wireframeDetail: 32,
    particleCount: 800,
    particleLife: 1.0,
    symmetryAngle: 60
  });

  // Dynamic particle buffer state for particle engine
  const particlesRef = useRef([]);

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
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  // Keep rendering and audio processing active even when Tab is unfocused or in background
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // Tab moved to background: keep Web Audio context awake & force continuous tick
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        if (stateRef.current.isRunning && !bgTimerRef.current) {
          bgTimerRef.current = setInterval(() => {
            renderFrame();
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      audioCtxRef.current.close();
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

  // Setup Web Audio Graph with continuous background active node
  const buildAudioGraph = useCallback((stream) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.75;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    // Create an inaudible gain node connected to destination to force the browser audio pipeline to NEVER sleep
    const keepAliveGain = audioCtx.createGain();
    keepAliveGain.gain.value = 0.00001; // virtually silent but actively streamed to speakers
    source.connect(keepAliveGain);
    keepAliveGain.connect(audioCtx.destination);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    waveDataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    streamRef.current = stream;

    setIsRunning(true);
    stateRef.current.isRunning = true;

    // Request screen wake lock
    if (keepAwake) requestWakeLock();

    // Initialize particles
    initParticles();

    animRef.current = requestAnimationFrame(renderLoop);
  }, [keepAwake]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Capture Firefox/Chrome YouTube / System Audio via getDisplayMedia
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
      setError('System/Tab audio capture was cancelled. In the picker, make sure to check "Share audio"!');
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

  // Matrix Value Evaluator
  const getModValue = (targetId, currentBandValues) => {
    let modSum = 0;
    const { modMatrix } = stateRef.current;
    if (modMatrix.sub.target === targetId) modSum += currentBandValues.sub * (modMatrix.sub.amount / 100);
    if (modMatrix.low.target === targetId) modSum += currentBandValues.low * (modMatrix.low.amount / 100);
    if (modMatrix.mid.target === targetId) modSum += currentBandValues.mid * (modMatrix.mid.amount / 100);
    if (modMatrix.high.target === targetId) modSum += currentBandValues.high * (modMatrix.high.amount / 100);
    return modSum;
  };

  // Single Frame Render Engine
  const renderFrame = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const analyser = analyserRef.current;
    const freqData = dataArrayRef.current;
    const waveData = waveDataArrayRef.current;
    analyser.getByteFrequencyData(freqData);
    analyser.getByteTimeDomainData(waveData);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const st = stateRef.current;
    st.time += 0.015 * st.params.speed;

    // Calculate detailed frequency sub-bands with amplified dynamic curves
    let subSum = 0, lowSum = 0, midSum = 0, highSum = 0;
    for (let i = 0; i < 15; i++) subSum += freqData[i];       // 0 - 60 Hz Sub
    for (let i = 15; i < 60; i++) lowSum += freqData[i];      // 60 - 250 Hz Bass
    for (let i = 60; i < 350; i++) midSum += freqData[i];     // 250 - 2.5kHz Mids
    for (let i = 350; i < 1024; i++) highSum += freqData[i];  // 2.5k - 20kHz Highs

    const rawSub = (subSum / 15) / 255;
    const rawLow = (lowSum / 45) / 255;
    const rawMid = (midSum / 290) / 255;
    const rawHigh = (highSum / 674) / 255;
    const peak = Math.max(...freqData) / 255;

    // Apply quadratic response curve for punchy, reactive visuals
    const bands = {
      sub: Math.pow(rawSub, 1.2) * (st.subGain / 100) * 1.5,
      low: Math.pow(rawLow, 1.2) * (st.lowGain / 100) * 1.4,
      mid: Math.pow(rawMid, 1.1) * (st.midGain / 100) * 1.3,
      high: Math.pow(rawHigh, 1.0) * (st.highGain / 100) * 1.5,
      master: (st.masterGain / 100)
    };

    setLevels({
      sub: Math.min(1, bands.sub),
      low: Math.min(1, bands.low),
      mid: Math.min(1, bands.mid),
      high: Math.min(1, bands.high),
      peak
    });

    // Matrix modulated outputs with amplified response factors
    const geomMod = getModValue('geometry', bands) * 1.8;
    const repMod = getModValue('repetition', bands) * 1.6;
    const warpMod = getModValue('warp', bands) * 1.7;
    const partMod = getModValue('particles', bands) * 1.8;
    const chromaMod = getModValue('chroma', bands) * 1.5 + (st.params.chroma / 100);
    const bloomMod = getModValue('bloom', bands) * 1.5 + (st.params.bloom / 100);
    const grainMod = getModValue('grain', bands) + (st.params.grain / 100);
    const rotMod = getModValue('rotation', bands) * 2.0;
    const hueMod = getModValue('hue', bands) * 2.0;

    st.rot += 0.006 + (rotMod * 0.08);
    st.tunnelZ += (0.05 + warpMod * 0.35) * st.params.speed;

    // Palette Colors Lookup & Interpolator
    const currentPal = PALETTES.find(p => p.id === st.activePalette) || PALETTES[0];
    const palColors = currentPal.colors;
    const c0 = palColors[0];
    const c1 = palColors[1];
    const c2 = palColors[2] || palColors[0];
    const c3 = palColors[3] || palColors[1];

    // Helper to get palette color by float index (0..1)
    const getPalColor = (t, alpha = 1) => {
      const idx = Math.floor(Math.abs(t) * (palColors.length - 1)) % palColors.length;
      const nextIdx = (idx + 1) % palColors.length;
      return palColors[idx];
    };

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

      const petals = Math.max(3, Math.round(st.params.repetition + repMod * 10));
      const rings = Math.max(2, Math.round(st.params.density + geomMod * 12));
      const baseRadius = Math.min(W, H) * 0.28 * (1 + bands.sub * 0.75);

      for (let r = 1; r <= rings; r++) {
        const ringRad = (baseRadius / rings) * r * (1 + bands.low * 0.6);
        const col = palColors[(r - 1) % palColors.length];

        ctx.strokeStyle = col;
        ctx.lineWidth = (1.5 + bloomMod * 2.5) * (1 + bands.low * 0.5);
        ctx.shadowBlur = 14 * Math.min(bloomMod, 2);
        ctx.shadowColor = col;

        for (let p = 0; p < petals; p++) {
          const angle = (p / petals) * Math.PI * 2;
          const px = Math.cos(angle) * ringRad;
          const py = Math.sin(angle) * ringRad;
          const petalRadius = (ringRad * 0.5) * (1 + bands.mid * 1.5);

          ctx.beginPath();
          ctx.arc(px, py, Math.max(1, petalRadius), 0, Math.PI * 2);
          ctx.stroke();

          // Concentric geometric star polygons
          if (r % 2 === 0 && bands.high > 0.12) {
            const innerCol = palColors[(r + 1) % palColors.length];
            ctx.fillStyle = innerCol;
            ctx.beginPath();
            ctx.arc(px, py, Math.max(1, petalRadius * (0.3 + bands.high * 0.4)), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    // --- ENGINE 2: 3D HYPERSPACE WARP TUNNEL (MULTI-BAND REACTIVE) ---
    else if (st.activeEngine === 'tunnel') {
      ctx.save();
      // Sub-bass camera tremor & warp center
      const bassShakeX = (Math.random() - 0.5) * (bands.sub * 18);
      const bassShakeY = (Math.random() - 0.5) * (bands.sub * 18);
      ctx.translate(cx + bassShakeX, cy + bassShakeY);
      ctx.rotate(st.rot * 0.5 + (bands.mid * 0.2));

      const tunnelRings = 28;
      const sides = Math.max(3, Math.round(st.params.repetition + repMod * 4));

      // LAYER 1: HIGHS (High-frequency Hyperspace Starfield Streaks & Laser Beams)
      if (bands.high > 0.08) {
        const starCount = Math.floor(20 + bands.high * 50);
        ctx.save();
        for (let s = 0; s < starCount; s++) {
          const angle = (s / starCount) * Math.PI * 2 + (st.time * 2);
          const rInner = (Math.min(W, H) * 0.05) + Math.random() * 20;
          const rOuter = (Math.min(W, H) * 0.6) * (1 + bands.high * 0.5);
          const x1 = Math.cos(angle) * rInner;
          const y1 = Math.sin(angle) * rInner;
          const x2 = Math.cos(angle) * rOuter;
          const y2 = Math.sin(angle) * rOuter;
          const laserCol = palColors[s % palColors.length];

          ctx.strokeStyle = laserCol;
          ctx.lineWidth = 1 + bands.high * 2.5;
          ctx.shadowBlur = 10 * bloomMod;
          ctx.shadowColor = laserCol;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // LAYER 2: LOW & SUB (Main Pulsing 3D Polygonal Portal Rings)
      for (let i = tunnelRings; i >= 1; i--) {
        const depth = ((i * 35 + st.tunnelZ * 120) % 1000) / 1000;
        // Sub-bass expands field of view, Low-bass punches ring diameter
        const bassExpansion = (1 + bands.sub * 0.8 + bands.low * 0.4);
        const scale = Math.pow(depth, 3.2) * (Math.min(W, H) * 0.9) * bassExpansion;
        const alpha = Math.sin(depth * Math.PI) * (0.4 + bloomMod * 0.5);
        const col = palColors[i % palColors.length];

        ctx.strokeStyle = col;
        ctx.lineWidth = (1 - depth) * (3 + bands.low * 4) + bloomMod * 2;
        ctx.shadowBlur = 14 * Math.min(bloomMod, 2) * (1 - depth);
        ctx.shadowColor = col;

        ctx.beginPath();
        for (let s = 0; s <= sides; s++) {
          // Mid frequencies twist ring vertices and induce wave ripples
          const midRipple = Math.sin(s * 2 + st.time * 6) * (bands.mid * 25 * depth);
          const a = (s / sides) * Math.PI * 2 + depth * (st.rot * 2 + bands.mid * 1.5);
          const x = Math.cos(a) * (scale + midRipple);
          const y = Math.sin(a) * (scale + midRipple);
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // LAYER 3: MIDS (Harmonic Inner Resonator Rings & Cross-Struts)
        if (i % 3 === 0 && bands.mid > 0.12) {
          const midCol = palColors[(i + 1) % palColors.length];
          const innerScale = scale * 0.55 * (1 + Math.sin(st.time * 8 + depth * 5) * bands.mid * 0.3);
          ctx.strokeStyle = midCol;
          ctx.lineWidth = 1.5 + bands.mid * 2;
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(1, innerScale), 0, Math.PI * 2);
          ctx.stroke();

          // Longitudinal tunnel rail struts
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.25})`;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(st.rot + depth) * scale, Math.sin(st.rot + depth) * scale);
          ctx.stroke();
        }

        // LAYER 4: HIGHS (Crystalline Corner Nodes on Outer Perimeter)
        if (bands.high > 0.25 && depth > 0.4) {
          const sparkCol = palColors[(i + 3) % palColors.length];
          ctx.fillStyle = sparkCol;
          for (let s = 0; s < sides; s++) {
            const a = (s / sides) * Math.PI * 2 + depth * (st.rot * 2);
            const nx = Math.cos(a) * scale;
            const ny = Math.sin(a) * scale;
            ctx.beginPath();
            ctx.arc(nx, ny, 2 + bands.high * 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Center Singularity (Sub-bass core pulse)
      const coreSize = (8 + bands.sub * 35 + bands.low * 15) * (1 + bloomMod * 0.5);
      const coreCol = palColors[0];
      ctx.fillStyle = coreCol;
      ctx.shadowBlur = 25 * Math.min(bloomMod, 2);
      ctx.shadowColor = coreCol;
      ctx.beginPath();
      ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // --- ENGINE 3: PARTICLE SWARM & FLUID VORTEX ---
    else if (st.activeEngine === 'particles') {
      ctx.save();
      const pts = particlesRef.current;
      const particleSpeed = (1 + bands.sub * 2 + warpMod) * st.params.speed;
      const activeCount = Math.min(pts.length, Math.round(st.params.particleCount + partMod * 600));

      for (let i = 0; i < activeCount; i++) {
        const p = pts[i];
        p.z -= particleSpeed * p.vz;
        if (p.z <= 0) p.z = 2000;

        const k = 400 / p.z;
        const screenX = cx + p.x * k;
        const screenY = cy + p.y * k;

        // Vortex swirling angle
        const distCenter = Math.hypot(p.x, p.y);
        const swirlAngle = (0.01 + bands.mid * 0.05) * (1000 / (distCenter + 50));
        const cosS = Math.cos(swirlAngle);
        const sinS = Math.sin(swirlAngle);
        const nx = p.x * cosS - p.y * sinS;
        const ny = p.x * sinS + p.y * cosS;
        p.x = nx;
        p.y = ny;

        if (screenX >= 0 && screenX < W && screenY >= 0 && screenY < H) {
          const pSize = Math.max(1, p.size * k * 4 * (1 + bands.high));
          const colIndex = (i + Math.floor(st.time * 2)) % palColors.length;
          const col = palColors[colIndex];

          ctx.fillStyle = col;
          ctx.shadowBlur = 8 * Math.min(bloomMod, 2);
          ctx.shadowColor = col;

          ctx.beginPath();
          ctx.arc(screenX, screenY, pSize, 0, Math.PI * 2);
          ctx.fill();

          // Connective constellation filaments
          if (bands.high > 0.4 && i % 8 === 0 && i < activeCount - 1) {
            const nextP = pts[i + 1];
            const nextK = 400 / nextP.z;
            const nx = cx + nextP.x * nextK;
            const ny = cy + nextP.y * nextK;
            ctx.strokeStyle = col;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(nx, ny);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    // --- ENGINE 4: NEON CYBER TOPOGRAPHY WIREFRAME ---
    else if (st.activeEngine === 'wireframe') {
      ctx.save();
      ctx.translate(cx, cy * 1.15);
      const rows = 18;
      const cols = st.params.wireframeDetail || 32;
      const gridW = W * 1.2;
      const gridH = H * 0.8;

      ctx.rotate(Math.PI * 0.15); // Isometric camera angle

      for (let r = 0; r < rows; r++) {
        const zRatio = (r / rows);
        const rowY = (r / rows) * gridH - gridH * 0.5;
        const col = palColors[r % palColors.length];

        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5 + bloomMod;
        ctx.shadowBlur = 8 * Math.min(bloomMod, 2);
        ctx.shadowColor = col;

        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const colX = (c / cols) * gridW - gridW * 0.5;
          const freqIndex = Math.floor((c / cols) * freqData.length * 0.4);
          const elev = (freqData[freqIndex] / 255) * (180 * bands.master * (1 + bands.low)) * Math.sin(c * 0.2 + st.time * 3);
          const py = rowY - elev;

          c === 0 ? ctx.moveTo(colX, py) : ctx.lineTo(colX, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // --- ENGINE 5: GLITCH MATRIX & DATA SORTING ---
    else if (st.activeEngine === 'cyber') {
      ctx.save();
      const bandsCount = 48;
      const cellW = W / bandsCount;

      for (let i = 0; i < bandsCount; i++) {
        const binVal = freqData[Math.floor(i * (freqData.length / bandsCount))] / 255;
        const sliceH = binVal * H * (1 + bands.mid);
        const isGlitch = Math.random() < (0.05 + bands.sub * 0.3);

        const x = i * cellW;
        const y = isGlitch ? Math.random() * (H - sliceH) : (H - sliceH) / 2;
        const col = palColors[i % palColors.length];

        ctx.fillStyle = col;
        ctx.fillRect(x, y, cellW - 2, sliceH);

        // Cyber scanlines
        if (i % 2 === 0) {
          ctx.fillStyle = palColors[(i + 1) % palColors.length];
          ctx.fillRect(x, (y + st.time * 100) % H, cellW - 2, 4);
        }
      }
      ctx.restore();
    }

    // --- ENGINE 6: VECTOR OSCILLOSCOPE & HARMONIC SPECTRUM ---
    else if (st.activeEngine === 'bars') {
      ctx.save();
      const numPoints = waveData.length;
      const step = W / numPoints;

      ctx.strokeStyle = c0;
      ctx.lineWidth = 3 + bloomMod * 2;
      ctx.shadowBlur = 15 * Math.min(bloomMod, 2);
      ctx.shadowColor = c0;

      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const v = (waveData[i] / 128.0) - 1.0;
        const y = cy + (v * (H * 0.4) * (1 + bands.low + bands.sub));
        const x = i * step;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Mirrored Harmonic reflection
      ctx.strokeStyle = c1;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const v = (waveData[i] / 128.0) - 1.0;
        const y = cy - (v * (H * 0.3) * (1 + bands.high));
        const x = i * step;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
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
  };

  // --- CORE 60FPS RENDER PIPELINE ---
  const renderLoop = useCallback(() => {
    if (!stateRef.current.isRunning) return;
    renderFrame();
    animRef.current = requestAnimationFrame(renderLoop);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

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
            title="Capture sound from Firefox, Chrome YouTube tab, Spotify, or desktop soundcard"
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
              <div className="idle-badge">Soundcard & Tab Audio Link</div>
              <h2>Ready to Visualize</h2>
              <p>
                Click <strong>Capture Tab Audio</strong> (Chrome/Edge) or <strong>Microphone / Stereo Mix</strong> (Firefox)
                to stream music directly from your YouTube tab, SoundCloud, or media player.
              </p>
              <div className="idle-actions">
                <button className="idle-action-btn primary" onClick={captureTabAudio}>
                  <Icons.Monitor /> Capture YouTube / Tab Audio
                </button>
                <button className="idle-action-btn" onClick={captureMic}>
                  <Icons.Mic /> Microphone / Stereo Mix
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
              <div className="device-channel">
                <div className="channel-banner" style={{ backgroundColor: '#ff0055' }}>Sub Bass (0–60Hz)</div>
                <div className="channel-body">
                  <div className="meter-container">
                    <div className="meter-bar" style={{ height: `${Math.min(100, levels.sub * (subGain / 100) * 100)}%`, backgroundColor: '#ff0055' }}></div>
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
                      <span>Depth</span>
                      <input
                        type="range" min="0" max="200" value={modMatrix.sub.amount}
                        onChange={e => handleMatrixChange('sub', 'amount', Number(e.target.value))}
                        className="fader-mini"
                      />
                      <span>{modMatrix.sub.amount}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LOW BASS STRIP */}
              <div className="device-channel">
                <div className="channel-banner" style={{ backgroundColor: '#ff9900' }}>Low / Kick (60–250Hz)</div>
                <div className="channel-body">
                  <div className="meter-container">
                    <div className="meter-bar" style={{ height: `${Math.min(100, levels.low * (lowGain / 100) * 100)}%`, backgroundColor: '#ff9900' }}></div>
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
                      <span>Depth</span>
                      <input
                        type="range" min="0" max="200" value={modMatrix.low.amount}
                        onChange={e => handleMatrixChange('low', 'amount', Number(e.target.value))}
                        className="fader-mini"
                      />
                      <span>{modMatrix.low.amount}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MIDS STRIP */}
              <div className="device-channel">
                <div className="channel-banner" style={{ backgroundColor: '#00ffcc' }}>Mids / Vocal (250–2.5kHz)</div>
                <div className="channel-body">
                  <div className="meter-container">
                    <div className="meter-bar" style={{ height: `${Math.min(100, levels.mid * (midGain / 100) * 100)}%`, backgroundColor: '#00ffcc' }}></div>
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
                      <span>Depth</span>
                      <input
                        type="range" min="0" max="200" value={modMatrix.mid.amount}
                        onChange={e => handleMatrixChange('mid', 'amount', Number(e.target.value))}
                        className="fader-mini"
                      />
                      <span>{modMatrix.mid.amount}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* HIGHS STRIP */}
              <div className="device-channel">
                <div className="channel-banner" style={{ backgroundColor: '#a855f7' }}>Highs / Hi-Hat (2.5k–20kHz)</div>
                <div className="channel-body">
                  <div className="meter-container">
                    <div className="meter-bar" style={{ height: `${Math.min(100, levels.high * (highGain / 100) * 100)}%`, backgroundColor: '#a855f7' }}></div>
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
                      <span>Depth</span>
                      <input
                        type="range" min="0" max="200" value={modMatrix.high.amount}
                        onChange={e => handleMatrixChange('high', 'amount', Number(e.target.value))}
                        className="fader-mini"
                      />
                      <span>{modMatrix.high.amount}%</span>
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

          {/* TAB 2: DEDICATED ENGINE PARAMETERS */}
          {activeTab === 'engine' && (
            <div className="rack-params-grid">
              <div className="param-device-box">
                <h4>Geometric Density & Complexity</h4>
                <div className="param-slider-row">
                  <label>Rings / Layers:</label>
                  <input
                    type="range" min="2" max="24" value={params.density}
                    onChange={e => setParams({ ...params, density: Number(e.target.value) })}
                  />
                  <span>{params.density}</span>
                </div>
                <div className="param-slider-row">
                  <label>Symmetry Repeat:</label>
                  <input
                    type="range" min="3" max="32" value={params.repetition}
                    onChange={e => setParams({ ...params, repetition: Number(e.target.value) })}
                  />
                  <span>{params.repetition}x</span>
                </div>
              </div>

              <div className="param-device-box">
                <h4>Particles & Velocity</h4>
                <div className="param-slider-row">
                  <label>Particle Count:</label>
                  <input
                    type="range" min="100" max="1500" step="50" value={params.particleCount}
                    onChange={e => setParams({ ...params, particleCount: Number(e.target.value) })}
                  />
                  <span>{params.particleCount}</span>
                </div>
                <div className="param-slider-row">
                  <label>Global Speed Rate:</label>
                  <input
                    type="range" min="0.2" max="3.0" step="0.1" value={params.speed}
                    onChange={e => setParams({ ...params, speed: Number(e.target.value) })}
                  />
                  <span>{params.speed.toFixed(1)}x</span>
                </div>
              </div>

              <div className="param-device-box">
                <h4>Wireframe Topology</h4>
                <div className="param-slider-row">
                  <label>Mesh Resolution:</label>
                  <input
                    type="range" min="16" max="64" step="4" value={params.wireframeDetail}
                    onChange={e => setParams({ ...params, wireframeDetail: Number(e.target.value) })}
                  />
                  <span>{params.wireframeDetail} cols</span>
                </div>
              </div>
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
