import React, { useRef, useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import VisualizerCanvas from './VisualizerCanvas';
import SpectralizerBar from './SpectralizerBar';
import GenerativeShotOverlay, { fireGenerativeShot } from './GenerativeShotOverlay';
import { audioStore } from './AudioStore';
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
// generative: true => triggers a one-shot centered shape overlay, fades out; does NOT drive continuous 3D engine animation
const MOD_TARGETS = [
  { id: 'none', name: '-- Blank (No FX Route) --' },
  { id: 'reverse_spin', name: 'Spin Direction: Reverse (Counter-Clockwise)' },
  { id: 'vortex_spin', name: 'Spin Direction: Forward (Clockwise Accelerator)' },
  { id: 'shockwave', name: 'Radial Shockwave & Pulse Explosion' },
  { id: 'wave_current', name: 'Sinusoidal Wave & Fluid Undulation' },
  { id: 'warp_tunnel', name: '3D Warp Thrust & Tunnel Speed' },
  { id: 'particle_size', name: 'Particle 3D Size & Scale Dynamics' },
  { id: 'particle_speed', name: 'Particle Swirl & Orbit Speed' },
  { id: 'particle_mass', name: 'Particle Mass & Force Field Pull' },
  { id: 'particle_turbulence', name: 'Particle Noise & Jitter Chaos' },
  // --- GENERATIVE ONE-SHOT OVERLAYS (gate open fires a shape; must close+reopen to fire again) ---
  { id: 'geo_burst', name: '✦ [SHOT] Hexagon Geo Burst', generative: true },
  { id: 'kaleido_facets', name: '✦ [SHOT] Mandala Kaleidoscope Burst', generative: true },
  { id: 'laser_beams', name: '✦ [SHOT] Starburst Laser Ray Explosion', generative: true },
  { id: 'digital_grid', name: '✦ [SHOT] Hologram Grid Flash', generative: true },
  { id: 'film_strobe', name: '✦ [SHOT] Concentric Ring Flash', generative: true },
  { id: 'color_cycle', name: '✦ [SHOT] Triangle Color Burst', generative: true },
  { id: 'particle_shape_morph', name: '✦ [SHOT] Morphing Star Stamp', generative: true },
  { id: 'ink_splash', name: '✦ [SHOT] Ink Splash / Organic Burst', generative: true },
];

export default function App() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const bgTimerRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const waveDataArrayRef = useRef(null);
  const wsRef = useRef(null);
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
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'engine' | 'palette' | 'postfx' | 'layout'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [keepAwake, setKeepAwake] = useState(true);

  const [nativeDevices, setNativeDevices] = useState([]);
  const [selectedNativeDevice, setSelectedNativeDevice] = useState('');
  const [isTauriEnv, setIsTauriEnv] = useState(false);

  useEffect(() => {
    // Attempt to invoke the Tauri command directly. It will fail on the web.
    invoke('get_audio_devices')
      .then((devices) => {
        setIsTauriEnv(true);
        const deviceList = ['System Default', ...devices];
        setNativeDevices(deviceList);
        if (deviceList.length > 0) {
          const savedDevice = localStorage.getItem('cables_audio_device');
          let targetDevice = 'System Default';
          
          if (savedDevice && deviceList.includes(savedDevice)) {
            targetDevice = savedDevice;
          } else {
            const realtekDevice = devices.find(d => d.toLowerCase().includes('realtek'));
            if (realtekDevice) {
              targetDevice = realtekDevice;
            }
          }
          
          setSelectedNativeDevice(targetDevice);
          const invokeName = targetDevice === 'System Default' ? '' : targetDevice;
          invoke('set_audio_device', { name: invokeName }).catch(err => console.error("Failed to set device", err));
          localStorage.setItem('cables_audio_device', targetDevice);
        }
      })
      .catch((err) => console.log("Not in Tauri or failed to get audio devices", err));
  }, []);

  const handleDeviceChange = (e) => {
    const val = e.target.value;
    setSelectedNativeDevice(val);
    localStorage.setItem('cables_audio_device', val);
    const invokeName = val === 'System Default' ? '' : val;
    invoke('set_audio_device', { name: invokeName }).catch(err => console.error("Failed to set device", err));
  };

  // Live RMS Audio Levels for Strips
  const [levels, setLevels] = useState({ low: 0, mid: 0, high: 0, peak: 0, sub: 0 });

  // EQ Band Gain Sensitivities - 100% by default for immediate responsive visualization
  const [subGain, setSubGain] = useState(100);
  const [lowGain, setLowGain] = useState(100);
  const [midGain, setMidGain] = useState(100);
  const [highGain, setHighGain] = useState(100);
  const [masterGain, setMasterGain] = useState(100);

  // Dynamic Frequency Ranges for the 4 bands
  const [freqRanges, setFreqRanges] = useState({
    sub: [20, 65],
    low: [65, 250],
    mid: [250, 2500],
    high: [2500, 16000]
  });

  // Global DSP Analysis Parameters (audio-visualizer.com inspired)
  const [sensitivity, setSensitivity] = useState(1.0); // 0.1x to 3.0x input sensitivity
  const [smoothing, setSmoothing] = useState(0.25);    // 0.00 to 0.95 analyser smoothing
  const [fftDetail, setFftDetail] = useState(2048);    // 128 to 2048 FFT resolution (2^N)

  // Ableton-style Modular Matrix Routing: map audio sources to visual targets with Threshold Gate & Depth
  // Default target: 'none' (clean blank state initially per user workflow)
  const [modMatrix, setModMatrix] = useState({
    sub: { target: 'none', amount: 150, gate: 15, intensity: 100 },
    low: { target: 'none', amount: 150, gate: 20, intensity: 100 },
    mid: { target: 'none', amount: 130, gate: 15, intensity: 100 },
    high: { target: 'none', amount: 180, gate: 10, intensity: 100 }
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

    // Layout & Positioning (Echowave inspired)
    xOffset: 0,
    yOffset: 0,
    zoom: 1.0,

    // Specterr Contour & Transparency Parameters (app.specterr.com inspired)
    outlineWidth: 6,
    outlineSegments: 16,
    outlineColor: '#000000',
    transparency: 40,
    transparentMode: true,
    showSpecterrRing: true,

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

    // 3. Particle Swarm & 3D Instanced Mesh Shapes
    particleShape: 'spheres',
    particleSize: 2.0,
    particleMass: 1.0,
    particleSwirl: 1.0,
    particleTurbulence: 0.5,
    particleCount: 1000,
    filamentDistance: 140,

    // Global FX Rig Overrides per Layer
    geoBurstShape: 'icosahedron',
    laserCount: 24,
    gridStyle: 'floor_ceiling',

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

  // Multi-Visualizer Secondary Edge/Border Layer Config
  const [edgeLayerConfig, setEdgeLayerConfig] = useState({
    enabled: false, // Turned off by default
    style: 'bars',
    placement: 'top_bottom',
    minFreqHz: 2500,
    maxFreqHz: 16000,
    barCount: 16,
    barHeight: 120,
    barGap: 4,
    gain: 130,
    showPeaks: true
  });

  // User Preset Management System (Save / Load / Export / Import JSON)
  const [userPresets, setUserPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('cables_user_presets');
      if (saved) return JSON.parse(saved);
    } catch (_) { }
    return [];
  });
  const [newPresetName, setNewPresetName] = useState('');
  const fileInputRef = useRef(null);

  const saveUserPreset = (presetName) => {
    const title = (presetName || newPresetName).trim() || `Custom Preset ${userPresets.length + 1}`;
    const newPreset = {
      id: 'preset_' + Date.now(),
      name: title,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      activeEngine,
      activePalette,
      subGain, lowGain, midGain, highGain, masterGain,
      sensitivity, smoothing, fftDetail,
      modMatrix,
      params,
      edgeLayerConfig,
      freqRanges
    };
    const updated = [newPreset, ...userPresets];
    setUserPresets(updated);
    try {
      localStorage.setItem('cables_user_presets', JSON.stringify(updated));
    } catch (_) { }
    setNewPresetName('');
  };

  const loadUserPreset = (preset) => {
    if (!preset) return;
    if (preset.activeEngine) setActiveEngine(preset.activeEngine);
    if (preset.activePalette) setActivePalette(preset.activePalette);
    if (preset.subGain !== undefined) setSubGain(preset.subGain);
    if (preset.lowGain !== undefined) setLowGain(preset.lowGain);
    if (preset.midGain !== undefined) setMidGain(preset.midGain);
    if (preset.highGain !== undefined) setHighGain(preset.highGain);
    if (preset.masterGain !== undefined) setMasterGain(preset.masterGain);
    if (preset.sensitivity !== undefined) setSensitivity(preset.sensitivity);
    if (preset.smoothing !== undefined) setSmoothing(preset.smoothing);
    if (preset.fftDetail !== undefined) setFftDetail(preset.fftDetail);
    if (preset.modMatrix) setModMatrix(preset.modMatrix);
    if (preset.params) setParams(preset.params);
    if (preset.edgeLayerConfig) setEdgeLayerConfig(preset.edgeLayerConfig);
    if (preset.freqRanges) setFreqRanges(preset.freqRanges);
  };

  const deleteUserPreset = (id) => {
    const updated = userPresets.filter(p => p.id !== id);
    setUserPresets(updated);
    try {
      localStorage.setItem('cables_user_presets', JSON.stringify(updated));
    } catch (_) { }
  };

  const exportPresetJSON = (preset) => {
    const jsonStr = JSON.stringify(preset, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(preset.name || 'preset').toLowerCase().replace(/\s+/g, '_')}.cables.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importPresetJSON = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed && typeof parsed === 'object') {
          const imported = {
            id: 'preset_' + Date.now(),
            name: parsed.name ? `${parsed.name} (Imported)` : 'Imported Preset',
            createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            activeEngine: parsed.activeEngine || 'sacred',
            activePalette: parsed.activePalette || 'cyberpunk',
            subGain: parsed.subGain ?? 0,
            lowGain: parsed.lowGain ?? 0,
            midGain: parsed.midGain ?? 0,
            highGain: parsed.highGain ?? 0,
            masterGain: parsed.masterGain ?? 100,
            sensitivity: parsed.sensitivity ?? 1.0,
            smoothing: parsed.smoothing ?? 0.25,
            fftDetail: parsed.fftDetail ?? 2048,
            modMatrix: parsed.modMatrix || {
              sub: { target: 'none', amount: 150, gate: 15, intensity: 100 },
              low: { target: 'none', amount: 150, gate: 20, intensity: 100 },
              mid: { target: 'none', amount: 130, gate: 15, intensity: 100 },
              high: { target: 'none', amount: 180, gate: 10, intensity: 100 }
            },
            params: parsed.params || params,
            edgeLayerConfig: parsed.edgeLayerConfig || edgeLayerConfig,
            freqRanges: parsed.freqRanges || freqRanges
          };
          const updated = [imported, ...userPresets];
          setUserPresets(updated);
          localStorage.setItem('cables_user_presets', JSON.stringify(updated));
          loadUserPreset(imported);
        }
      } catch (err) {
        alert('Invalid preset JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
    sensitivity,
    smoothing,
    fftDetail,
    modMatrix,
    params,
    edgeLayerConfig,
    freqRanges,
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
    stateRef.current.sensitivity = sensitivity;
    stateRef.current.smoothing = smoothing;
    stateRef.current.fftDetail = fftDetail;
    stateRef.current.modMatrix = modMatrix;
    stateRef.current.params = params;
    stateRef.current.edgeLayerConfig = edgeLayerConfig;
    stateRef.current.freqRanges = freqRanges;
    
    // Sync to new AudioStore pipeline
    audioStore.updateConfig({
      subGain, lowGain, midGain, highGain, masterGain, sensitivity, smoothing, ranges: freqRanges
    });
  }, [activeEngine, activePalette, subGain, lowGain, midGain, highGain, masterGain, sensitivity, smoothing, fftDetail, modMatrix, params, edgeLayerConfig, freqRanges]);

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
          audioCtxRef.current.resume().catch(() => { });
        }
        if (stateRef.current.isRunning && !bgTimerRef.current) {
          bgTimerRef.current = setInterval(() => {
            if (renderFrameRef.current) {
              try {
                renderFrameRef.current();
              } catch (_) { }
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
          audioCtxRef.current.resume().catch(() => { });
        }
      }
    }, 400);
    return () => clearInterval(watchdog);
  }, [renderLoop]);

  // Live real-time UI synchronization for VU Meters, Master meter, Peak indicator, and Gate indicators
  useEffect(() => {
    if (!isRunning) return;
    let animId;
    let lastTime = 0;
    const syncAudioLevels = (now) => {
      animId = requestAnimationFrame(syncAudioLevels);
      if (now - lastTime > 30) { // ~33 FPS UI sync for optimal performance & responsiveness
        lastTime = now;
        const b = audioStore.bands;
        if (b) {
          setLevels({
            sub: b.sub ?? 0,
            low: b.low ?? 0,
            mid: b.mid ?? 0,
            high: b.high ?? 0,
            rawSub: b.rawSub ?? 0,
            rawLow: b.rawLow ?? 0,
            rawMid: b.rawMid ?? 0,
            rawHigh: b.rawHigh ?? 0,
            peak: b.peak ?? 0
          });

          // Fire generative one-shot overlays based on modMatrix routing
          const mm = stateRef.current.modMatrix;
          const palette = stateRef.current.activePalette;
          const paletteObj = [
            { id: 'cyberpunk', colors: ['#ff007f', '#00f0ff', '#7928ca', '#ffe600'] },
            { id: 'electric', colors: ['#00ffcc', '#3b82f6', '#8b5cf6', '#ec4899'] },
            { id: 'solar', colors: ['#ff4d00', '#ff9900', '#ffcc00', '#ff0055'] },
            { id: 'deepsea', colors: ['#00ffff', '#0077ff', '#00ff88', '#2e0854'] },
            { id: 'acid', colors: ['#39ff14', '#00ff66', '#a6ff00', '#ffffff'] },
            { id: 'vaporwave', colors: ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff'] }
          ].find(p => p.id === palette);
          const colors = paletteObj?.colors || ['#00f0ff', '#ff007f', '#7928ca', '#ffe600'];

          if (mm) {
            const bands = ['sub', 'low', 'mid', 'high'];
            bands.forEach((bandKey, i) => {
              const route = mm[bandKey];
              if (!route || route.target === 'none') return;
              const energy = b[`raw${bandKey.charAt(0).toUpperCase() + bandKey.slice(1)}`] ?? 0;
              const gate = (route.gate ?? 0) / 100;
              const color = colors[i % colors.length];
              fireGenerativeShot(route.target, bandKey, energy, gate, color);
            });
          }
        }
      }
    };
    animId = requestAnimationFrame(syncAudioLevels);
    return () => cancelAnimationFrame(animId);
  }, [isRunning]);

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

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => { });
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
      audioCtx.resume().catch(() => { });
    }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = stateRef.current.fftDetail || 2048;
    // Dynamic smoothing time constant from state (defaults to 0.25 for crisp responsiveness)
    analyser.smoothingTimeConstant = stateRef.current.smoothing !== undefined ? stateRef.current.smoothing : 0.25;
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

  // Connect to Tauri Rust Backend (Zero-Latency Native Capture)
  const captureTabAudio = async () => {
    setError('');
    stopAudio();
    try {
      audioStore.connectTauri();
      const ws = new WebSocket('ws://127.0.0.1:3030');
      ws.binaryType = 'arraybuffer';
      ws.onmessage = (e) => {
        const buffer = new Uint8Array(e.data);
        const freqLen = 1024;
        dataArrayRef.current = buffer.slice(0, freqLen);
        waveDataArrayRef.current = buffer.slice(freqLen);
      };
      ws.onopen = () => {
        setIsRunning(true);
        stateRef.current.isRunning = true;
        setSourceType('tauri');
        if (keepAwake) requestWakeLock();
        initParticles();
        cancelAnimationFrame(animRef.current);
        animRef.current = requestAnimationFrame(renderLoop);
      };
      ws.onclose = () => {
        stopAudio();
      };
      ws.onerror = () => {
        setError('Could not connect to Tauri backend on ws://127.0.0.1:3030. Is the native audio server running?');
        stopAudio();
      };
      wsRef.current = ws;
    } catch (err) {
      setError('Failed to initiate Tauri WebSocket connection.');
    }
  };

  // Both buttons route to the native Tauri backend now
  const captureMic = captureTabAudio;

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

  // Dynamic Frequency Slice Extractor for Edge & Multi-Visualizer Compositor
  const getFrequencySlice = (freqData, sampleRate, fftSize, minHz, maxHz, numBars, sens, gain) => {
    if (!freqData || freqData.length === 0) return new Array(numBars).fill(0);
    const binHz = sampleRate / fftSize;
    const maxBin = freqData.length - 1;
    const startBin = Math.max(1, Math.min(maxBin, Math.round(minHz / binHz)));
    const endBin = Math.max(startBin, Math.min(maxBin, Math.round(maxHz / binHz)));
    const binSpan = Math.max(1, endBin - startBin + 1);

    const result = [];
    const barsPerBin = binSpan / numBars;

    for (let b = 0; b < numBars; b++) {
      const bStart = Math.floor(startBin + b * barsPerBin);
      const bEnd = Math.max(bStart, Math.floor(startBin + (b + 1) * barsPerBin));
      let sum = 0;
      let count = 0;
      for (let i = bStart; i <= bEnd; i++) {
        if (i <= maxBin) {
          sum += freqData[i] || 0;
          count++;
        }
      }
      const avg = count > 0 ? sum / count : 0;
      const norm = Math.min(1.0, (avg / 255) * sens * (gain / 100));
      result.push(norm);
    }
    return result;
  };

  // Single Frame Render Engine
  const renderFrame = () => {
    // OLD 2D CANVAS RENDERER DISABLED - Now using React Three Fiber via VisualizerCanvas
    if (!dataArrayRef.current || !waveDataArrayRef.current) return;
    lastRenderTimestampRef.current = performance.now();
    
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      analyserRef.current.getByteTimeDomainData(waveDataArrayRef.current);
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

  // DSP Analysis Handlers (Sensitivity, Smoothing, Detail FFT)
  const handleSensitivityChange = (val) => {
    setSensitivity(val);
    stateRef.current.sensitivity = val;
  };

  const handleSmoothingChange = (val) => {
    setSmoothing(val);
    stateRef.current.smoothing = val;
    if (analyserRef.current) {
      analyserRef.current.smoothingTimeConstant = val;
    }
  };

  const handleFftDetailChange = (val) => {
    setFftDetail(val);
    stateRef.current.fftDetail = val;
    if (analyserRef.current) {
      try {
        analyserRef.current.fftSize = val;
        dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
        waveDataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      } catch (err) {
        console.error('Failed to dynamically update FFT size:', err);
      }
    }
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
            title={isTauriEnv ? "Start Native Audio Engine" : "Capture Tab Audio"}
          >
            <Icons.Monitor /> {isTauriEnv ? 'Start Native Engine' : 'Connect Native Audio'}
          </button>
          {isTauriEnv && nativeDevices.length > 0 && (
            <select
              value={selectedNativeDevice}
              onChange={handleDeviceChange}
              className="transport-btn"
              style={{ padding: '0 8px', maxWidth: '200px', textOverflow: 'ellipsis', background: 'rgba(255,255,255,0.1)' }}
            >
              {nativeDevices.map(d => <option key={d} value={d} style={{ color: '#000' }}>{d}</option>)}
            </select>
          )}
          <button
            id="btn-capture-mic"
            className={`transport-btn capture-btn ${sourceType === 'tauri' ? 'active-mic' : ''}`}
            onClick={captureMic}
            title="Connect Native Tauri Audio Backend"
          >
            <Icons.Mic /> Start Server Link
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
              LIVE · Tauri Native (WASAPI)
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
      <div className="daw-body">
        <main className="daw-main">
        <div className="viz-canvas" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
          {isRunning && (
            <VisualizerCanvas 
              layers={[{ id: 1, engine: activeEngine, modMatrix, params, palette: PALETTES.find(p => p.id === activePalette) }]} 
              masterParams={params} 
            />
          )}
        </div>
        <canvas ref={canvasRef} className="viz-canvas" style={{ pointerEvents: 'none', display: 'none' }} />

        {/* Generative One-Shot Shape Overlay */}
        <GenerativeShotOverlay isRunning={isRunning} />

        {/* Stable real-time FFT Spectralizer on bottom of screen */}
        {isRunning && (
          <SpectralizerBar 
            modMatrix={modMatrix} 
            levels={levels} 
            freqRanges={freqRanges} 
            setFreqRanges={setFreqRanges} 
          />
        )}

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

              <div className="idle-actions" style={{ flexDirection: 'column', gap: '16px' }}>
                {isTauriEnv && nativeDevices.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>SELECT AUDIO DEVICE</span>
                    <select
                      value={selectedNativeDevice}
                      onChange={handleDeviceChange}
                      style={{ padding: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid #333', maxWidth: '300px' }}
                    >
                      {nativeDevices.map(d => <option key={d} value={d} style={{ color: '#000' }}>{d}</option>)}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', width: '100%' }}>
                  <button className="idle-action-btn primary" onClick={captureTabAudio}>
                    <Icons.Monitor /> {isTauriEnv ? 'Start Visualizer' : 'Connect Native Audio'}
                    <span className="idle-action-sub">{isTauriEnv ? 'Listen to selected device' : 'Tauri Desktop & Zero-Latency WASAPI'}</span>
                  </button>
                  {!isTauriEnv && (
                    <a
                      href="/Cables_2.0_Setup.zip"
                      download
                      className="idle-action-btn"
                      style={{ textDecoration: 'none', background: '#7928ca' }}
                    >
                      <Icons.Play /> Download Pro Desktop
                      <span className="idle-action-sub">Standalone Windows 11 App (Zero Latency)</span>
                    </a>
                  )}
                </div>
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
              <span className="hud-val" style={{ color: levels.peak >= 0.015 ? '#00ffcc' : '#888888' }}>
                {levels.peak >= 0.015 ? 'REALTIME ⚡' : 'DORMANT (SILENT)'}
              </span>
            </div>
          </div>
        )}
      </main>

      <aside className="daw-sidebar">
        <div className="sidebar-nav">
          <button className={`sidebar-tab ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTab('matrix')}><Icons.Matrix /> Modulation Matrix</button>
          <button className={`sidebar-tab ${activeTab === 'engine' ? 'active' : ''}`} onClick={() => setActiveTab('engine')}><Icons.Sliders /> Engine Parameters</button>
          <button className={`sidebar-tab ${activeTab === 'palette' ? 'active' : ''}`} onClick={() => setActiveTab('palette')}><Icons.Palette /> Color Harmonics</button>
          <button className={`sidebar-tab ${activeTab === 'postfx' ? 'active' : ''}`} onClick={() => setActiveTab('postfx')}><Icons.Fx /> Post-Processing</button>
          <button className={`sidebar-tab ${activeTab === 'layout' ? 'active' : ''}`} onClick={() => setActiveTab('layout')}><Icons.Expand /> Workspace Layout</button>
          <button className={`sidebar-tab ${activeTab === 'layers' ? 'active' : ''}`} onClick={() => setActiveTab('layers')}><Icons.Wireframe /> Layer Compositor</button>
          <button className={`sidebar-tab ${activeTab === 'presets' ? 'active' : ''}`} onClick={() => setActiveTab('presets')}><Icons.Sparkles /> User Presets</button>
        </div>
        <div className="sidebar-content">

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

              {/* MASTER OUTPUT GAIN & DSP ACOUSTIC ANALYSIS */}
              <div className="device-channel master-channel">
                <div className="channel-banner" style={{ backgroundColor: '#ffffff', color: '#000' }}>
                  <span>Master & DSP Engine</span>
                  <span className="dsp-badge">FFT {fftDetail}</span>
                </div>
                <div className="channel-body master-body">
                  <div className="meter-container" title={`Master Peak Level: ${Math.round(levels.peak * 100)}%`}>
                    <div className="meter-bar" style={{ height: `${Math.min(100, levels.peak * (masterGain / 100) * 100)}%`, backgroundColor: '#3b82f6' }}></div>
                  </div>
                  <div className="control-column">
                    <span className="strip-title">Master</span>
                    <input
                      type="range" min="0" max="200" value={masterGain}
                      onChange={e => setMasterGain(Number(e.target.value))}
                      className="fader-input"
                      title="Master Output Gain (0% - 200%)"
                    />
                    <span className="fader-val">{masterGain}%</span>
                  </div>
                  <div className="dsp-controls-box">
                    <div className="dsp-header">Analysis DSP</div>

                    {/* SENSITIVITY SLIDER */}
                    <div className="dsp-slider-row">
                      <div className="dsp-label-row">
                        <span className="dsp-lbl">Sensitivity</span>
                        <span className="dsp-val">{sensitivity.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range" min="0.1" max="3.0" step="0.05"
                        value={sensitivity}
                        onChange={e => handleSensitivityChange(Number(e.target.value))}
                        className="fader-mini dsp-slider sensitivity-slider"
                        title="Sensitivity: scales incoming audio responsiveness before gating (0.1x - 3.0x)"
                      />
                    </div>

                    {/* SMOOTHING SLIDER */}
                    <div className="dsp-slider-row">
                      <div className="dsp-label-row">
                        <span className="dsp-lbl">Smoothing</span>
                        <span className="dsp-val">{smoothing.toFixed(2)}</span>
                      </div>
                      <input
                        type="range" min="0.0" max="0.95" step="0.01"
                        value={smoothing}
                        onChange={e => handleSmoothingChange(Number(e.target.value))}
                        className="fader-mini dsp-slider smoothing-slider"
                        title="Smoothing: time-constant averaging from instant transients to fluid decay (0.00 - 0.95)"
                      />
                    </div>

                    {/* DETAIL (FFT) SLIDER */}
                    <div className="dsp-slider-row">
                      <div className="dsp-label-row">
                        <span className="dsp-lbl">Detail (FFT)</span>
                        <span className="dsp-val">{fftDetail}</span>
                      </div>
                      <input
                        type="range" min="7" max="11" step="1"
                        value={Math.round(Math.log2(fftDetail))}
                        onChange={e => handleFftDetailChange(Math.pow(2, Number(e.target.value)))}
                        className="fader-mini dsp-slider fft-slider"
                        title="Detail (FFT): frequency resolution bins (128 to 2048)"
                      />
                    </div>
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
                    <h4>3D Particle Geometry & Density</h4>
                    <div className="param-slider-row">
                      <label>3D Particle Shape:</label>
                      <select
                        value={params.particleShape || 'spheres'}
                        onChange={e => setParams({ ...params, particleShape: e.target.value })}
                        className="matrix-select"
                        style={{ background: '#111827', color: '#00ffcc', border: '1px solid #374151', borderRadius: '4px', padding: '2px 6px' }}
                      >
                        <option value="spheres">Spheres (Smooth 3D Balls)</option>
                        <option value="cubes">Cubes (Digital Blocks)</option>
                        <option value="tetrahedrons">Tetrahedrons (Sharp Pyramids)</option>
                        <option value="rings">Torus Rings (Harmonic Donuts)</option>
                        <option value="dodecahedrons">Dodecahedrons (12-Faceted Gem)</option>
                        <option value="icosahedrons">Icosahedrons (20-Faceted Core)</option>
                      </select>
                    </div>
                    <div className="param-slider-row">
                      <label>Particle Count:</label>
                      <input
                        type="range" min="100" max="2000" step="50" value={params.particleCount ?? 1000}
                        onChange={e => setParams({ ...params, particleCount: Number(e.target.value) })}
                      />
                      <span>{params.particleCount ?? 1000}</span>
                    </div>
                    <div className="param-slider-row">
                      <label>3D Base Size:</label>
                      <input
                        type="range" min="0.5" max="6.0" step="0.1" value={params.particleSize ?? 2.0}
                        onChange={e => setParams({ ...params, particleSize: Number(e.target.value) })}
                      />
                      <span>{(params.particleSize ?? 2.0).toFixed(1)}x</span>
                    </div>
                  </div>

                  <div className="param-device-box">
                    <h4>Physics, Swirl & Turbulence</h4>
                    <div className="param-slider-row">
                      <label>Vortex Swirl Rate:</label>
                      <input
                        type="range" min="0.2" max="3.0" step="0.1" value={params.particleSwirl ?? 1.0}
                        onChange={e => setParams({ ...params, particleSwirl: Number(e.target.value) })}
                      />
                      <span>{(params.particleSwirl ?? 1.0).toFixed(1)}x</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Particle Mass Pull:</label>
                      <input
                        type="range" min="0.1" max="4.0" step="0.1" value={params.particleMass ?? 1.0}
                        onChange={e => setParams({ ...params, particleMass: Number(e.target.value) })}
                      />
                      <span>{(params.particleMass ?? 1.0).toFixed(1)}x</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Turbulence Jitter:</label>
                      <input
                        type="range" min="0.0" max="3.0" step="0.1" value={params.particleTurbulence ?? 0.5}
                        onChange={e => setParams({ ...params, particleTurbulence: Number(e.target.value) })}
                      />
                      <span>{(params.particleTurbulence ?? 0.5).toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="param-device-box">
                    <h4>Global FX Rig Overrides</h4>
                    <div className="param-slider-row">
                      <label>Geo Burst Geometry:</label>
                      <select
                        value={params.geoBurstShape || 'icosahedron'}
                        onChange={e => setParams({ ...params, geoBurstShape: e.target.value })}
                        className="matrix-select"
                        style={{ background: '#111827', color: '#ff007f', border: '1px solid #374151', borderRadius: '4px', padding: '2px 6px' }}
                      >
                        <option value="icosahedron">Icosahedron Crystal</option>
                        <option value="octahedron">Octahedron Prism</option>
                        <option value="dodecahedron">Dodecahedron Shell</option>
                        <option value="torusKnot">Torus Knot Vortex</option>
                        <option value="tetrahedron">Tetrahedron Pyramid</option>
                      </select>
                    </div>
                    <div className="param-slider-row">
                      <label>Laser Beams Count:</label>
                      <input
                        type="range" min="12" max="64" step="4" value={params.laserCount ?? 24}
                        onChange={e => setParams({ ...params, laserCount: Number(e.target.value) })}
                      />
                      <span>{params.laserCount ?? 24} rays</span>
                    </div>
                    <div className="param-slider-row">
                      <label>Digital Grid Style:</label>
                      <select
                        value={params.gridStyle || 'floor_ceiling'}
                        onChange={e => setParams({ ...params, gridStyle: e.target.value })}
                        className="matrix-select"
                        style={{ background: '#111827', color: '#3b82f6', border: '1px solid #374151', borderRadius: '4px', padding: '2px 6px' }}
                      >
                        <option value="floor_ceiling">Holographic Floor & Ceiling</option>
                        <option value="floor_only">Sub-Floor Grid Only</option>
                        <option value="grid_cube">Cyber Matrix Grid Chamber</option>
                      </select>
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

          {/* TAB 4: POST-PROCESSING & SPECTERR SHADERS */}
          {activeTab === 'postfx' && (
            <div className="rack-params-grid">
              {/* SPECTERR CONTOUR: OUTLINE SEGMENTS & COLOR */}
              <div className="param-device-box specterr-box">
                <div className="specterr-box-header">
                  <h4>Specterr Contour: Outline Segments</h4>
                  <span className="specterr-tag">SPECTERR FX</span>
                </div>
                <div className="param-slider-row">
                  <label>Outline Width:</label>
                  <input
                    type="range" min="0" max="24" step="1" value={params.outlineWidth ?? 6}
                    onChange={e => setParams({ ...params, outlineWidth: Number(e.target.value) })}
                    title="Outline stroke thickness around waveform & geometry"
                  />
                  <span>{params.outlineWidth ?? 6}px</span>
                </div>
                <div className="param-slider-row">
                  <label>Outline Segments:</label>
                  <input
                    type="range" min="0" max="32" step="2" value={params.outlineSegments ?? 16}
                    onChange={e => setParams({ ...params, outlineSegments: Number(e.target.value) })}
                    title="0 = Continuous / Solid stroke; 4 to 32 = Segmented rhythmic chops"
                  />
                  <span>{(params.outlineSegments ?? 16) === 0 ? 'Solid' : `${params.outlineSegments} segs`}</span>
                </div>
                <div className="param-slider-row">
                  <label>Outline Color:</label>
                  <div className="outline-color-picker">
                    {[
                      { id: '#000000', label: 'Dark', bg: '#000000', border: '#555' },
                      { id: '#ffffff', label: 'White', bg: '#ffffff', border: '#fff' },
                      { id: '#00f0ff', label: 'Cyan', bg: '#00f0ff', border: '#00f0ff' },
                      { id: '#ff007f', label: 'Pink', bg: '#ff007f', border: '#ff007f' },
                      { id: '#39ff14', label: 'Lime', bg: '#39ff14', border: '#39ff14' },
                      { id: 'palette', label: 'Palette', bg: 'linear-gradient(135deg, #00f0ff, #ec4899)', border: '#fff' }
                    ].map(oc => (
                      <button
                        key={oc.id}
                        type="button"
                        className={`color-chip-btn ${params.outlineColor === oc.id ? 'active' : ''}`}
                        style={{ background: oc.bg, borderColor: oc.border }}
                        onClick={() => setParams({ ...params, outlineColor: oc.id })}
                        title={oc.label}
                      />
                    ))}
                  </div>
                  <span className="outline-color-name">
                    {params.outlineColor === '#000000' ? 'Dark' :
                      params.outlineColor === '#ffffff' ? 'White' :
                        params.outlineColor === '#00f0ff' ? 'Cyan' :
                          params.outlineColor === '#ff007f' ? 'Pink' :
                            params.outlineColor === '#39ff14' ? 'Lime' : 'Palette'}
                  </span>
                </div>
              </div>

              {/* SPECTERR TRANSPARENCY & WAVE RING */}
              <div className="param-device-box specterr-box">
                <div className="specterr-box-header">
                  <h4>Specterr Transparency & Crest</h4>
                  <span className="specterr-tag">SPECTERR FX</span>
                </div>
                <div className="param-slider-row">
                  <label>Transparent Mode:</label>
                  <button
                    type="button"
                    className={`specterr-toggle-btn ${params.transparentMode ? 'active' : ''}`}
                    onClick={() => setParams({ ...params, transparentMode: !params.transparentMode })}
                  >
                    {params.transparentMode ? 'ON (Transparent)' : 'OFF (Opaque)'}
                  </button>
                </div>
                <div className="param-slider-row">
                  <label>Fill Transparency:</label>
                  <input
                    type="range" min="0" max="100" step="5" value={params.transparency ?? 40}
                    onChange={e => setParams({ ...params, transparency: Number(e.target.value) })}
                    title="0% = Solid fills; 100% = Fully hollow outline contours revealing starfield"
                  />
                  <span>{params.transparency ?? 40}%</span>
                </div>
                <div className="param-slider-row">
                  <label>Waveform Ring:</label>
                  <button
                    type="button"
                    className={`specterr-toggle-btn ${params.showSpecterrRing ? 'active' : ''}`}
                    onClick={() => setParams({ ...params, showSpecterrRing: !params.showSpecterrRing })}
                  >
                    {params.showSpecterrRing ? 'SHOW CREST' : 'HIDE CREST'}
                  </button>
                </div>
              </div>

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

          {/* TAB 5: LAYOUT & WORKSPACE (ECHOWAVE INSPIRED) */}
          {activeTab === 'layout' && (
            <div className="rack-params-grid">
              <div className="param-device-box">
                <div className="specterr-box-header">
                  <h4>Workspace Transformation</h4>
                  <span className="specterr-tag" style={{ background: '#3b82f6', color: '#fff' }}>ECHOWAVE</span>
                </div>
                <div className="param-slider-row">
                  <label>X Offset (Pan):</label>
                  <input
                    type="range" min="-100" max="100" step="1" value={params.xOffset ?? 0}
                    onChange={e => setParams({ ...params, xOffset: Number(e.target.value) })}
                    title="Pan visualizer horizontally across the screen"
                  />
                  <span>{params.xOffset ?? 0}%</span>
                  <button style={{ marginLeft: '10px', fontSize: '10px', padding: '2px 6px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setParams({ ...params, xOffset: 0 })}>Reset</button>
                </div>
                <div className="param-slider-row">
                  <label>Y Offset (Pan):</label>
                  <input
                    type="range" min="-100" max="100" step="1" value={params.yOffset ?? 0}
                    onChange={e => setParams({ ...params, yOffset: Number(e.target.value) })}
                    title="Pan visualizer vertically across the screen"
                  />
                  <span>{params.yOffset ?? 0}%</span>
                  <button style={{ marginLeft: '10px', fontSize: '10px', padding: '2px 6px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setParams({ ...params, yOffset: 0 })}>Reset</button>
                </div>
                <div className="param-slider-row">
                  <label>Zoom (Scale):</label>
                  <input
                    type="range" min="0.1" max="5.0" step="0.1" value={params.zoom ?? 1.0}
                    onChange={e => setParams({ ...params, zoom: Number(e.target.value) })}
                    title="Scale the entire visualizer up or down"
                  />
                  <span>{(params.zoom ?? 1.0).toFixed(1)}x</span>
                  <button style={{ marginLeft: '10px', fontSize: '10px', padding: '2px 6px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setParams({ ...params, zoom: 1.0 })}>Reset</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MULTI-LAYER EDGE COMPOSITOR */}
          {activeTab === 'layers' && (
            <div className="rack-params-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              <div className="param-device-box">
                <div className="specterr-box-header">
                  <h4>Edge Layer Compositor Status</h4>
                  <span className="specterr-tag" style={{ background: '#a855f7', color: '#fff' }}>MULTI-LAYER</span>
                </div>
                <div className="param-slider-row">
                  <label>Enable Secondary Edge Layer:</label>
                  <input
                    type="checkbox"
                    checked={edgeLayerConfig.enabled}
                    onChange={e => setEdgeLayerConfig({ ...edgeLayerConfig, enabled: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span style={{ color: edgeLayerConfig.enabled ? '#00ffcc' : '#888' }}>
                    {edgeLayerConfig.enabled ? 'ACTIVE ⚡' : 'MUTED'}
                  </span>
                </div>
                <div className="param-slider-row">
                  <label>Rendering Style:</label>
                  <select
                    value={edgeLayerConfig.style}
                    onChange={e => setEdgeLayerConfig({ ...edgeLayerConfig, style: e.target.value })}
                    className="matrix-select"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px', borderRadius: '4px' }}
                  >
                    <option value="bars" style={{ color: '#000' }}>Linear Spectrum Bars (High-Precision Peak Caps)</option>
                    <option value="oscillo" style={{ color: '#000' }}>Oscilloscope Wave Traces (Border Wave Ribbon)</option>
                    <option value="laser" style={{ color: '#000' }}>Glowing Laser Streaks (Starburst Filaments)</option>
                    <option value="sparks" style={{ color: '#000' }}>Granular Spark Emitters (Hi-Hat / Snare Spikes)</option>
                  </select>
                </div>
                <div className="param-slider-row">
                  <label>Screen Edge Placement:</label>
                  <select
                    value={edgeLayerConfig.placement}
                    onChange={e => setEdgeLayerConfig({ ...edgeLayerConfig, placement: e.target.value })}
                    className="matrix-select"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px', borderRadius: '4px' }}
                  >
                    <option value="top_bottom" style={{ color: '#000' }}>Top &amp; Bottom Mirrored</option>
                    <option value="top" style={{ color: '#000' }}>Top Border Only</option>
                    <option value="bottom" style={{ color: '#000' }}>Bottom Border Only</option>
                  </select>
                </div>
              </div>

              <div className="param-device-box">
                <h4>Frequency Slice &amp; Geometry Controls</h4>
                <div className="param-slider-row">
                  <label>Min Freq Cutoff (Hz):</label>
                  <input
                    type="range" min="20" max="10000" step="50"
                    value={edgeLayerConfig.minFreqHz}
                    onChange={e => setEdgeLayerConfig({ ...edgeLayerConfig, minFreqHz: Number(e.target.value) })}
                  />
                  <span>{edgeLayerConfig.minFreqHz} Hz</span>
                </div>
                <div className="param-slider-row">
                  <label>Max Freq Cutoff (Hz):</label>
                  <input
                    type="range" min="1000" max="20000" step="100"
                    value={edgeLayerConfig.maxFreqHz}
                    onChange={e => setEdgeLayerConfig({ ...edgeLayerConfig, maxFreqHz: Number(e.target.value) })}
                  />
                  <span>{edgeLayerConfig.maxFreqHz} Hz</span>
                </div>
                <div className="param-slider-row">
                  <label>Bar Resolution:</label>
                  <input
                    type="range" min="4" max="64" step="2"
                    value={edgeLayerConfig.barCount}
                    onChange={e => setEdgeLayerConfig({ ...edgeLayerConfig, barCount: Number(e.target.value) })}
                  />
                  <span>{edgeLayerConfig.barCount} bars</span>
                </div>
                <div className="param-slider-row">
                  <label>Max Bar Height:</label>
                  <input
                    type="range" min="20" max="300" step="5"
                    value={edgeLayerConfig.barHeight}
                    onChange={e => setEdgeLayerConfig({ ...edgeLayerConfig, barHeight: Number(e.target.value) })}
                  />
                  <span>{edgeLayerConfig.barHeight}px</span>
                </div>
                <div className="param-slider-row">
                  <label>Gain Sensitivity:</label>
                  <input
                    type="range" min="50" max="300" step="5"
                    value={edgeLayerConfig.gain}
                    onChange={e => setEdgeLayerConfig({ ...edgeLayerConfig, gain: Number(e.target.value) })}
                  />
                  <span>{edgeLayerConfig.gain}%</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: USER PRESETS MANAGER */}
          {activeTab === 'presets' && (
            <div className="rack-params-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
              <div className="param-device-box">
                <div className="specterr-box-header">
                  <h4>Save Live Preset</h4>
                  <span className="specterr-tag" style={{ background: '#ec4899', color: '#fff' }}>USER PRESET</span>
                </div>
                <p style={{ fontSize: '11px', color: '#aaa', margin: '0 0 10px 0' }}>
                  Capture all live matrix mappings, gains, engine tweaks, colors &amp; edge compositor settings into a reusable preset slot.
                </p>
                <div className="dsp-slider-row" style={{ flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
                  <input
                    type="text"
                    placeholder="Preset Title (e.g. Neon Stardust)"
                    value={newPresetName}
                    onChange={e => setNewPresetName(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 12px', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <button
                    className="idle-action-btn primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '12px' }}
                    onClick={() => saveUserPreset(newPresetName)}
                  >
                    <Icons.Sparkles /> Save Current Preset
                  </button>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4>Import Preset File</h4>
                  <input
                    type="file"
                    accept=".json,.cables"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={importPresetJSON}
                  />
                  <button
                    className="idle-action-btn"
                    style={{ width: '100%', justifyContent: 'center', background: '#3b82f6', color: '#fff', marginTop: '6px', fontSize: '12px' }}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <Icons.Expand /> Import .cables JSON File
                  </button>
                </div>
              </div>

              <div className="param-device-box">
                <div className="specterr-box-header">
                  <h4>User Preset Library ({userPresets.length})</h4>
                  <span className="specterr-tag" style={{ background: '#7928ca', color: '#fff' }}>SLOTS</span>
                </div>
                {userPresets.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '12px' }}>
                    No custom presets saved yet. Adjust your visualizer and click "Save Current Preset" above!
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                    {userPresets.map(preset => (
                      <div
                        key={preset.id}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#00ffcc', fontSize: '13px' }}>{preset.name}</strong>
                          <span style={{ fontSize: '9px', color: '#777' }}>{preset.createdAt}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#aaa', display: 'flex', gap: '8px' }}>
                          <span>Engine: <b style={{ color: '#fff' }}>{preset.activeEngine}</b></span>
                          <span>Palette: <b style={{ color: '#fff' }}>{preset.activePalette}</b></span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          <button
                            style={{ flex: 1, padding: '4px 8px', fontSize: '11px', background: '#39ff14', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => loadUserPreset(preset)}
                          >
                            Load
                          </button>
                          <button
                            style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => exportPresetJSON(preset)}
                            title="Export to .json"
                          >
                            Export
                          </button>
                          <button
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#ff0055', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => deleteUserPreset(preset.id)}
                            title="Delete Preset"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </aside>
      </div>
    </div>
  );
}
