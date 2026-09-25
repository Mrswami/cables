/**
 * Main TouchArt Studio Controller App
 */

document.addEventListener('DOMContentLoaded', () => {
  const artCanvas = document.getElementById('artCanvas');
  const spectrumOverlay = document.getElementById('spectrumOverlay');
  const specCtx = spectrumOverlay.getContext('2d');
  
  const codeEditor = document.getElementById('codeEditor');
  const errorLog = document.getElementById('errorLog');
  const fpsCounter = document.getElementById('fpsCounter');
  const presetSelect = document.getElementById('equationPresetSelect');
  const btnRecompile = document.getElementById('btnRecompile');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const audioSourceSelect = document.getElementById('audioSourceSelect');
  const audioHardwareDeviceSelect = document.getElementById('audioHardwareDeviceSelect');
  const btnRefreshHardware = document.getElementById('btnRefreshHardware');
  const audioFileInput = document.getElementById('audioFileInput');

  // Meter Elements
  const meterBass = document.getElementById('meterBass');
  const meterMid = document.getElementById('meterMid');
  const meterTreble = document.getElementById('meterTreble');

  // Gains
  let bassGain = 1.0;
  let midGain = 1.0;
  let trebleGain = 1.0;

  // Initialize Shader Engine
  const shaderEngine = new TouchArtShaderEngine(artCanvas);

  // Initialize Audio Ingest
  const audioIngest = new TouchArtAudioIngest((metrics, fftData) => {
    // Apply gains
    shaderEngine.audio.bass = Math.min(1.0, metrics.bass * bassGain);
    shaderEngine.audio.mid = Math.min(1.0, metrics.mid * midGain);
    shaderEngine.audio.treble = Math.min(1.0, metrics.treble * trebleGain);
    shaderEngine.audio.rms = metrics.rms;
    shaderEngine.audio.peak = metrics.peak;

    // Update Meter Bars
    meterBass.style.width = `${shaderEngine.audio.bass * 100}%`;
    meterMid.style.width = `${shaderEngine.audio.mid * 100}%`;
    meterTreble.style.width = `${shaderEngine.audio.treble * 100}%`;

    // Render FFT Spectrum Overlay
    if (fftData) {
      drawSpectrumOverlay(fftData);
    }
  });

  // Populate Hardware Audio Devices (JBL Headphones, Soundcard, Mic, Stereo Mix)
  async function populateHardwareDevices() {
    audioHardwareDeviceSelect.innerHTML = '<option value="">Default System Audio Device</option>';
    const devices = await audioIngest.getHardwareDevices();
    
    devices.forEach(device => {
      const opt = document.createElement('option');
      opt.value = device.id;
      opt.textContent = device.label;
      audioHardwareDeviceSelect.appendChild(opt);
    });
  }

  populateHardwareDevices();

  btnRefreshHardware.addEventListener('click', () => {
    populateHardwareDevices();
  });

  // Switch Selected Audio Hardware Device
  audioHardwareDeviceSelect.addEventListener('change', async (e) => {
    const deviceId = e.target.value;
    await audioIngest.startAudioDevice(deviceId || null);
  });

  // Load Initial Preset
  loadPreset('cyber_core');

  // Slider Event Listeners (u_param 1-5)
  for (let i = 1; i <= 5; i++) {
    const slider = document.getElementById(`slider_p${i}`);
    const valDisplay = document.getElementById(`val_p${i}`);
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valDisplay.textContent = val.toFixed(2);
        shaderEngine.params[`param${i}`] = val;
      });
    }
  }

  // Audio Gain Controls
  document.getElementById('slider_bassGain').addEventListener('input', (e) => {
    bassGain = parseFloat(e.target.value);
    document.getElementById('val_bassGain').textContent = bassGain.toFixed(2);
  });
  document.getElementById('slider_midGain').addEventListener('input', (e) => {
    midGain = parseFloat(e.target.value);
    document.getElementById('val_midGain').textContent = midGain.toFixed(2);
  });
  document.getElementById('slider_trebleGain').addEventListener('input', (e) => {
    trebleGain = parseFloat(e.target.value);
    document.getElementById('val_trebleGain').textContent = trebleGain.toFixed(2);
  });

  // Stream Mode Dropdown Switcher
  audioSourceSelect.addEventListener('change', async (e) => {
    const val = e.target.value;
    audioIngest.toggleSimulation(false);

    if (val === 'wasapi_mic') {
      const selectedDevice = audioHardwareDeviceSelect.value || null;
      await audioIngest.startAudioDevice(selectedDevice);
    } else if (val === 'test_signal') {
      audioIngest.toggleSimulation(true);
    } else if (val === 'audio_file') {
      audioFileInput.click();
    } else if (val === 'ableton_ws' || val === 'audacity_rest') {
      audioIngest.connectWebSocketSync();
    }
  });

  // Audio File Upload Handler
  audioFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    audioIngest.initAudioContext();
    audioIngest.isSimulating = false;

    const url = URL.createObjectURL(file);
    const audioEl = new Audio(url);
    audioEl.controls = true;
    audioEl.play();

    const fileNode = audioIngest.audioCtx.createMediaElementSource(audioEl);
    fileNode.connect(audioIngest.analyser);
    audioIngest.analyser.connect(audioIngest.audioCtx.destination);
    audioIngest.processAudioLoop();
  });

  // Preset Selection
  presetSelect.addEventListener('change', (e) => {
    loadPreset(e.target.value);
  });

  function loadPreset(key) {
    if (PRESET_EQUATIONS[key]) {
      codeEditor.value = PRESET_EQUATIONS[key].code;
      compileEditorCode();
    }
  }

  // Recompile GLSL Code
  btnRecompile.addEventListener('click', compileEditorCode);

  function compileEditorCode() {
    const code = codeEditor.value;
    const success = shaderEngine.compileShader(code);
    
    if (success) {
      errorLog.style.display = 'none';
      errorLog.textContent = '';
    } else {
      errorLog.style.display = 'block';
      errorLog.textContent = shaderEngine.compileError || 'Compile Error';
    }
  }

  // Fullscreen Toggle
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  // FFT Spectrum Renderer
  function drawSpectrumOverlay(fftData) {
    spectrumOverlay.width = spectrumOverlay.clientWidth * window.devicePixelRatio;
    spectrumOverlay.height = spectrumOverlay.clientHeight * window.devicePixelRatio;
    const w = spectrumOverlay.width;
    const h = spectrumOverlay.height;

    specCtx.clearRect(0, 0, w, h);
    const barWidth = w / 64;

    for (let i = 0; i < 64; i++) {
      const val = (fftData[i * 4] / 255) * h;
      specCtx.fillStyle = 'rgba(0, 240, 255, 0.3)';
      specCtx.fillRect(i * barWidth, h - val, barWidth - 1, val);
    }
  }

  // Animation Loop
  function animationLoop() {
    shaderEngine.render();
    fpsCounter.textContent = `${shaderEngine.currentFps} FPS`;
    requestAnimationFrame(animationLoop);
  }

  // Start with default hardware device audio capture
  audioIngest.startAudioDevice(null);

  animationLoop();
});
