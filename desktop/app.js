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
  const btnStartMic = document.getElementById('btnStartMic');
  const btnToggleSim = document.getElementById('btnToggleSim');

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

  // Load Initial Preset
  loadPreset('cyber_core');

  // Slider Event Listeners
  for (let i = 1; i <= 4; i++) {
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

  // Audio Buttons
  btnStartMic.addEventListener('click', async () => {
    const ok = await audioIngest.startMicrophone();
    if (ok) {
      btnStartMic.style.background = 'linear-gradient(135deg, #00ff88, #00b359)';
      btnStartMic.textContent = '🎤 WASAPI / Mic Active';
    }
  });

  let isSimulating = false;
  btnToggleSim.addEventListener('click', () => {
    isSimulating = !isSimulating;
    audioIngest.toggleSimulation(isSimulating);
    btnToggleSim.style.background = isSimulating ? 'rgba(255, 183, 0, 0.4)' : 'rgba(255, 0, 127, 0.2)';
    btnToggleSim.textContent = isSimulating ? 'Stop Test Signal' : 'Toggle Test Signal';
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

  animationLoop();
});
