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
  const btnCaptureSystemAudio = document.getElementById('btnCaptureSystemAudio');
  const audioFileInput = document.getElementById('audioFileInput');

  // Meter Elements
  const meterBass = document.getElementById('meterBass');
  const meterMid = document.getElementById('meterMid');
  const meterTreble = document.getElementById('meterTreble');

  // Sensitivity Sliders & Controls
  const sliderMasterGain = document.getElementById('slider_masterGain');
  const valMasterGain = document.getElementById('val_masterGain');
  const checkAgc = document.getElementById('check_agc');

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

  // Wire Master Sensitivity Boost & AGC
  sliderMasterGain.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audioIngest.masterGain = val;
    valMasterGain.textContent = `${val.toFixed(1)}x`;
  });

  checkAgc.addEventListener('change', (e) => {
    audioIngest.enableAGC = e.target.checked;
  });

  btnCaptureSystemAudio.addEventListener('click', async () => {
    const ok = await audioIngest.startSystemAudioLoopback();
    if (ok) {
      btnCaptureSystemAudio.style.background = 'linear-gradient(135deg, #00ff88, #00b359)';
      btnCaptureSystemAudio.textContent = '🖥️ System Audio Live Active';
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

  // ==========================================
  // Slider Rules & Custom Preset Manager System
  // ==========================================
  const sliderRulesPresetSelect = document.getElementById('sliderRulesPresetSelect');
  const btnSaveSliderRule = document.getElementById('btnSaveSliderRule');
  const btnDeleteSliderRule = document.getElementById('btnDeleteSliderRule');
  const btnExportRules = document.getElementById('btnExportRules');
  const btnImportRules = document.getElementById('btnImportRules');
  const importRulesFileInput = document.getElementById('importRulesFileInput');

  function getStoredRules() {
    try {
      const raw = localStorage.getItem('touchart_slider_rules');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveStoredRules(rules) {
    localStorage.setItem('touchart_slider_rules', JSON.stringify(rules));
    refreshRulesDropdown();
  }

  function refreshRulesDropdown() {
    const rules = getStoredRules();
    sliderRulesPresetSelect.innerHTML = '<option value="default">Rule Preset: Default Studio Setup</option>';
    
    for (const name of Object.keys(rules)) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = `Rule Preset: ${name}`;
      sliderRulesPresetSelect.appendChild(opt);
    }
  }

  refreshRulesDropdown();

  btnSaveSliderRule.addEventListener('click', () => {
    const name = prompt('Enter a name for this set of slider rules:', 'My Preset Rules 1');
    if (!name) return;

    const currentRule = {
      p1: parseFloat(document.getElementById('slider_p1').value),
      p2: parseFloat(document.getElementById('slider_p2').value),
      p3: parseFloat(document.getElementById('slider_p3').value),
      p4: parseFloat(document.getElementById('slider_p4').value),
      p5: parseFloat(document.getElementById('slider_p5').value),
      masterGain: parseFloat(sliderMasterGain.value),
      bassGain: bassGain,
      midGain: midGain,
      trebleGain: trebleGain,
      equationKey: presetSelect.value
    };

    const rules = getStoredRules();
    rules[name] = currentRule;
    saveStoredRules(rules);
    sliderRulesPresetSelect.value = name;
    alert(`Saved slider rule preset "${name}" successfully!`);
  });

  btnDeleteSliderRule.addEventListener('click', () => {
    const selected = sliderRulesPresetSelect.value;
    if (selected === 'default') {
      alert('Cannot delete the default studio preset.');
      return;
    }

    if (confirm(`Delete rule preset "${selected}"?`)) {
      const rules = getStoredRules();
      delete rules[selected];
      saveStoredRules(rules);
    }
  });

  sliderRulesPresetSelect.addEventListener('change', (e) => {
    const name = e.target.value;
    if (name === 'default') return;

    const rules = getStoredRules();
    const rule = rules[name];
    if (rule) {
      applyRule(rule);
    }
  });

  function applyRule(rule) {
    if (rule.p1 !== undefined) setSlider('slider_p1', 'val_p1', 'param1', rule.p1);
    if (rule.p2 !== undefined) setSlider('slider_p2', 'val_p2', 'param2', rule.p2);
    if (rule.p3 !== undefined) setSlider('slider_p3', 'val_p3', 'param3', rule.p3);
    if (rule.p4 !== undefined) setSlider('slider_p4', 'val_p4', 'param4', rule.p4);
    if (rule.p5 !== undefined) setSlider('slider_p5', 'val_p5', 'param5', rule.p5);

    if (rule.masterGain !== undefined) {
      sliderMasterGain.value = rule.masterGain;
      audioIngest.masterGain = rule.masterGain;
      valMasterGain.textContent = `${rule.masterGain.toFixed(1)}x`;
    }
    if (rule.bassGain !== undefined) {
      bassGain = rule.bassGain;
      document.getElementById('slider_bassGain').value = bassGain;
      document.getElementById('val_bassGain').textContent = bassGain.toFixed(2);
    }
    if (rule.midGain !== undefined) {
      midGain = rule.midGain;
      document.getElementById('slider_midGain').value = midGain;
      document.getElementById('val_midGain').textContent = midGain.toFixed(2);
    }
    if (rule.trebleGain !== undefined) {
      trebleGain = rule.trebleGain;
      document.getElementById('slider_trebleGain').value = trebleGain;
      document.getElementById('val_trebleGain').textContent = trebleGain.toFixed(2);
    }
    if (rule.equationKey && PRESET_EQUATIONS[rule.equationKey]) {
      presetSelect.value = rule.equationKey;
      loadPreset(rule.equationKey);
    }
  }

  function setSlider(sliderId, valId, paramKey, value) {
    const slider = document.getElementById(sliderId);
    const valDisplay = document.getElementById(valId);
    if (slider && valDisplay) {
      slider.value = value;
      valDisplay.textContent = value.toFixed(2);
      shaderEngine.params[paramKey] = value;
    }
  }

  // Export JSON Rules
  btnExportRules.addEventListener('click', () => {
    const rules = getStoredRules();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rules, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "touchart_slider_rules.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  });

  // Import JSON Rules
  btnImportRules.addEventListener('click', () => {
    importRulesFileInput.click();
  });

  importRulesFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        const existing = getStoredRules();
        const merged = { ...existing, ...imported };
        saveStoredRules(merged);
        alert('Rules imported successfully!');
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
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
    } else if (val === 'system_loopback') {
      await audioIngest.startSystemAudioLoopback();
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
      specCtx.fillStyle = 'rgba(0, 240, 255, 0.4)';
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
