/**
 * Main TouchArt Studio Controller App
 * Wires 15 parameters (u_param1-10 + 4 Post-FX), EQ Visualizer, Debug Overlay
 */

document.addEventListener('DOMContentLoaded', () => {
  const artCanvas = document.getElementById('artCanvas');
  const spectrumOverlay = document.getElementById('spectrumOverlay');
  const specCtx = spectrumOverlay.getContext('2d');
  const eqCanvas = document.getElementById('eqVisualizer');
  const eqCtx = eqCanvas.getContext('2d');
  
  const codeEditor = document.getElementById('codeEditor');
  const errorLog = document.getElementById('errorLog');
  const fpsCounter = document.getElementById('fpsCounter');
  const presetSelect = document.getElementById('equationPresetSelect');
  const btnRecompile = document.getElementById('btnRecompile');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnToggleDebug = document.getElementById('btnToggleDebug');
  const audioSourceSelect = document.getElementById('audioSourceSelect');
  const audioHardwareDeviceSelect = document.getElementById('audioHardwareDeviceSelect');
  const btnRefreshHardware = document.getElementById('btnRefreshHardware');
  const btnCaptureSystemAudio = document.getElementById('btnCaptureSystemAudio');
  const audioFileInput = document.getElementById('audioFileInput');

  // Debug Overlay Elements
  const debugOverlay = document.getElementById('debugOverlay');
  const dbgBass = document.getElementById('dbg_bass');
  const dbgMid = document.getElementById('dbg_mid');
  const dbgTreble = document.getElementById('dbg_treble');
  const dbgRms = document.getElementById('dbg_rms');
  const dbgPeak = document.getElementById('dbg_peak');
  const dbgAgc = document.getElementById('dbg_agc');
  const dbgDevice = document.getElementById('dbg_device');
  const dbgFrametime = document.getElementById('dbg_frametime');
  const debugFrameGraph = document.getElementById('debugFrameGraph');
  const debugGraphCtx = debugFrameGraph.getContext('2d');
  let debugVisible = false;
  let frameTimeSamples = [];

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

  // Visual Smoothness / Damping State (aiXander & VolkanSah organic ballistics)
  const sliderSmoothness = document.getElementById('slider_smoothness');
  const valSmoothness = document.getElementById('val_smoothness');
  let audioDamping = 0.86; // 0.50 (responsive) to 0.98 (silky ambient flow)

  if (sliderSmoothness) {
    sliderSmoothness.addEventListener('input', (e) => {
      audioDamping = parseFloat(e.target.value);
      const percent = Math.round(audioDamping * 100);
      const label = audioDamping > 0.88 ? 'Silky Ambient' : (audioDamping > 0.75 ? 'Smooth Flow' : 'Responsive');
      if (valSmoothness) valSmoothness.textContent = `${percent}% (${label})`;
    });
  }

  // Target metrics buffer for 60/120 FPS continuous interpolation
  const targetAudio = {
    subBass: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    rms: 0,
    peak: 0,
    beat: 0,
    rhythm: 0
  };

  // EQ Visualizer State
  let eqFftData = null;
  let eqSmoothedBars = new Float32Array(128).fill(0);

  // Initialize Shader Engine
  const shaderEngine = new TouchArtShaderEngine(artCanvas);

  // Initialize Audio Ingest
  const audioIngest = new TouchArtAudioIngest((metrics, fftData) => {
    // Buffer targets with user gain applied
    targetAudio.subBass = metrics.subBass || 0;
    targetAudio.bass = Math.min(1.0, (metrics.bass || 0) * bassGain);
    targetAudio.mid = Math.min(1.0, (metrics.mid || 0) * midGain);
    targetAudio.treble = Math.min(1.0, (metrics.treble || 0) * trebleGain);
    targetAudio.rms = metrics.rms || 0;
    targetAudio.peak = metrics.peak || 0;
    targetAudio.beat = metrics.beat || 0;
    targetAudio.rhythm = metrics.rhythmPhase || 0;

    // Store FFT data for EQ visualizer
    if (fftData) {
      eqFftData = fftData;
    }

    // Update Python WASAPI Loopback UI Badge if active
    if (audioIngest.isPythonLoopback) {
      const badgePython = document.getElementById('badgePythonStatus');
      const devInfo = document.getElementById('pythonDeviceInfo');
      if (badgePython) {
        badgePython.textContent = '● LIVE LOOPBACK';
        badgePython.style.background = 'rgba(0, 255, 136, 0.25)';
        badgePython.style.color = '#00ff88';
        badgePython.style.borderColor = '#00ff88';
      }
      if (devInfo && audioIngest.pythonDeviceName) {
        devInfo.textContent = `🎧 ${audioIngest.pythonDeviceName}`;
      }
      if (debugVisible && dbgDevice) {
        dbgDevice.textContent = audioIngest.pythonDeviceName || 'Python WASAPI';
      }
    }

    // Update Debug Overlay
    if (debugVisible) {
      dbgBass.textContent = shaderEngine.audio.bass.toFixed(3);
      dbgMid.textContent = shaderEngine.audio.mid.toFixed(3);
      dbgTreble.textContent = shaderEngine.audio.treble.toFixed(3);
      dbgRms.textContent = metrics.rms.toFixed(3);
      dbgPeak.textContent = audioIngest.peakEnvelope.toFixed(3);
      const agcMult = (1.0 / audioIngest.peakEnvelope) * audioIngest.masterGain;
      dbgAgc.textContent = agcMult.toFixed(2) + 'x';
    }
  });

  // ==========================================
  // Debug Overlay Toggle
  // ==========================================
  btnToggleDebug.addEventListener('click', () => {
    debugVisible = !debugVisible;
    debugOverlay.style.display = debugVisible ? 'block' : 'none';
    btnToggleDebug.style.background = debugVisible 
      ? 'rgba(255, 183, 0, 0.4)' 
      : 'rgba(255, 183, 0, 0.15)';
  });

  // ==========================================
  // EQ Visualizer Renderer (64-band gradient bars)
  // ==========================================
  function drawEQVisualizer() {
    const dpr = window.devicePixelRatio || 1;
    const w = eqCanvas.clientWidth * dpr;
    const h = eqCanvas.clientHeight * dpr;
    if (eqCanvas.width !== w || eqCanvas.height !== h) {
      eqCanvas.width = w;
      eqCanvas.height = h;
    }

    eqCtx.clearRect(0, 0, w, h);

    const bands = 64;
    const barGap = 2 * dpr;
    const barWidth = (w - barGap * (bands - 1)) / bands;

    for (let i = 0; i < bands; i++) {
      let rawVal = 0;
      if (eqFftData && eqFftData.length > 0) {
        const binIndex = i < eqFftData.length ? i : Math.min(Math.floor(i * eqFftData.length / bands), eqFftData.length - 1);
        rawVal = eqFftData[binIndex] / 255.0;
      }

      // Asymmetric ballistics smoothing (VolkanSah / aiXander algorithm)
      if (rawVal > eqSmoothedBars[i]) {
        eqSmoothedBars[i] = eqSmoothedBars[i] * 0.35 + rawVal * 0.65;
      } else {
        eqSmoothedBars[i] = eqSmoothedBars[i] * 0.90 + rawVal * 0.10;
      }
      const val = eqSmoothedBars[i];
      const barHeight = val * h * 0.95;

      const x = i * (barWidth + barGap);
      const y = h - barHeight;

      // Gradient: cyan -> pink -> amber based on frequency
      const hue = 180 - (i / bands) * 200; // cyan -> magenta
      const saturation = 80 + val * 20;
      const lightness = 40 + val * 30;
      
      // Create vertical gradient per bar
      const gradient = eqCtx.createLinearGradient(x, h, x, y);
      gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness * 0.5}%, 0.6)`);
      gradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.85)`);
      gradient.addColorStop(1, `hsla(${hue + 20}, 100%, ${lightness + 15}%, 1.0)`);

      eqCtx.fillStyle = gradient;
      eqCtx.fillRect(x, y, barWidth, barHeight);

      // Glow cap on top of each bar
      if (barHeight > 2) {
        eqCtx.fillStyle = `hsla(${hue + 20}, 100%, 80%, 0.9)`;
        eqCtx.fillRect(x, y, barWidth, 2 * dpr);
      }
    }

    // Center line
    eqCtx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    eqCtx.lineWidth = 1;
    eqCtx.beginPath();
    eqCtx.moveTo(0, h * 0.5);
    eqCtx.lineTo(w, h * 0.5);
    eqCtx.stroke();
  }

  // ==========================================
  // Debug Frame Time Graph
  // ==========================================
  function drawDebugFrameGraph(dt) {
    if (!debugVisible) return;
    frameTimeSamples.push(dt);
    if (frameTimeSamples.length > 100) frameTimeSamples.shift();

    const canvas = debugFrameGraph;
    const ctx = debugGraphCtx;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 16.67ms target line
    const targetY = h - (16.67 / 50) * h;
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, targetY);
    ctx.lineTo(w, targetY);
    ctx.stroke();

    // Frame time bars
    const barW = w / 100;
    for (let i = 0; i < frameTimeSamples.length; i++) {
      const ft = frameTimeSamples[i];
      const barH = Math.min((ft / 50) * h, h);
      const color = ft > 33 ? '#ff4757' : ft > 20 ? '#ffb700' : '#00ff88';
      ctx.fillStyle = color;
      ctx.fillRect(i * barW, h - barH, barW - 1, barH);
    }
  }

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
      const badge = document.getElementById('virtualCableStatusBadge');
      if (badge) badge.textContent = '🖥️ Active: Browser System Audio Loopback';
      if (debugVisible) dbgDevice.textContent = 'System Loopback';
    }
  });

  // Populate Hardware Audio Devices (VB-Cable, Voicemeeter, Headphones, Soundcard, Mic, Stereo Mix)
  const virtualCableStatusBadge = document.getElementById('virtualCableStatusBadge');
  const btnAutoVirtualCable = document.getElementById('btnAutoVirtualCable');

  async function populateHardwareDevices() {
    audioHardwareDeviceSelect.innerHTML = '<option value="">Default System Audio Device</option>';
    const devices = await audioIngest.getHardwareDevices();
    
    let virtualCount = 0;
    devices.forEach(device => {
      const opt = document.createElement('option');
      opt.value = device.id;
      opt.textContent = device.label;
      if (device.category === 'virtual_cable' || device.category === 'voicemeeter') {
        opt.style.color = '#00f0ff';
        opt.style.fontWeight = '700';
        virtualCount++;
      } else if (device.category === 'stereo_mix') {
        opt.style.color = '#00ff88';
      }
      audioHardwareDeviceSelect.appendChild(opt);
    });

    if (virtualCount > 0 && btnAutoVirtualCable) {
      btnAutoVirtualCable.innerHTML = `<span>🎛️</span><span>Auto-Select Virtual Cable (${virtualCount} Detected)</span>`;
      btnAutoVirtualCable.style.borderColor = 'var(--accent-green)';
    }
  }

  populateHardwareDevices();

  btnRefreshHardware.addEventListener('click', () => {
    populateHardwareDevices();
  });

  // Auto-Select Virtual Cable Button Handler
  if (btnAutoVirtualCable) {
    btnAutoVirtualCable.addEventListener('click', async () => {
      const result = await audioIngest.autoDetectVirtualCable();
      if (result.success && result.device) {
        audioHardwareDeviceSelect.value = result.device.id;
        if (virtualCableStatusBadge) {
          virtualCableStatusBadge.textContent = `🎛️ Digital Link: ${result.device.rawLabel} (Active)`;
          virtualCableStatusBadge.style.color = '#00ff88';
          virtualCableStatusBadge.style.borderColor = '#00ff88';
        }
        btnAutoVirtualCable.style.background = 'linear-gradient(135deg, rgba(0, 255, 136, 0.4), rgba(0, 240, 255, 0.4))';
        btnAutoVirtualCable.style.borderColor = '#00ff88';
        if (debugVisible) dbgDevice.textContent = result.device.rawLabel;
      } else {
        alert(
          'Virtual Cable Search Result:\n\n' +
          'No VB-Audio Virtual Cable or Voicemeeter device was detected as an active recording input.\n\n' +
          'Quick 2-Minute Fix:\n' +
          '1. Install VB-CABLE Driver (free from vb-audio.com) or Voicemeeter Banana.\n' +
          '2. In Windows Sound Settings, set Output to "CABLE Input".\n' +
          '3. In Windows Sound Control Panel -> Recording -> "CABLE Output" -> Listen -> check "Listen to this device" with your headphones selected.\n' +
          '4. Click Rescan and select CABLE Output.'
        );
      }
    });
  }

  // Switch Selected Audio Hardware Device
  audioHardwareDeviceSelect.addEventListener('change', async (e) => {
    const deviceId = e.target.value;
    await audioIngest.startAudioDevice(deviceId || null);
    const opt = audioHardwareDeviceSelect.options[audioHardwareDeviceSelect.selectedIndex];
    const devLabel = opt ? opt.textContent : 'Default System Audio';
    if (virtualCableStatusBadge) {
      virtualCableStatusBadge.textContent = `🎧 Active Input: ${devLabel.substring(0, 32)}`;
    }
    if (debugVisible) {
      dbgDevice.textContent = devLabel.substring(0, 30);
    }
  });

  // Reconnect / Restart Python WASAPI Loopback Bridge & Dynamic Status Listener
  const badgePython = document.getElementById('badgePythonStatus');
  const pythonDeviceInfo = document.getElementById('pythonDeviceInfo');

  audioIngest.onStatusChange = (status) => {
    if (!badgePython) return;
    if (status === 'connected') {
      badgePython.textContent = '● LIVE LOOPBACK';
      badgePython.style.background = 'rgba(0, 255, 136, 0.25)';
      badgePython.style.color = '#00ff88';
      badgePython.style.borderColor = '#00ff88';
      if (pythonDeviceInfo && audioIngest.pythonDeviceName) {
        pythonDeviceInfo.textContent = `🎧 ${audioIngest.pythonDeviceName}`;
      }
    } else if (status === 'connecting') {
      badgePython.textContent = '● CONNECTING...';
      badgePython.style.background = 'rgba(255, 183, 0, 0.2)';
      badgePython.style.color = '#ffb700';
      badgePython.style.borderColor = 'rgba(255, 183, 0, 0.4)';
    } else {
      badgePython.textContent = '● STANDBY (Web Mode)';
      badgePython.style.background = 'rgba(0, 240, 255, 0.1)';
      badgePython.style.color = 'var(--accent-cyan)';
      badgePython.style.borderColor = 'rgba(0, 240, 255, 0.2)';
    }
  };

  const btnRestartPythonBridge = document.getElementById('btnRestartPythonBridge');
  if (btnRestartPythonBridge) {
    btnRestartPythonBridge.addEventListener('click', () => {
      if (typeof require !== 'undefined') {
        try {
          const { ipcRenderer } = require('electron');
          if (ipcRenderer) {
            ipcRenderer.send('restart-python-bridge');
          }
        } catch (err) {}
      }
      if (badgePython) {
        badgePython.textContent = '● CONNECTING...';
        badgePython.style.background = 'rgba(255, 183, 0, 0.2)';
        badgePython.style.color = '#ffb700';
      }
      audioIngest.connectWebSocketSync();
    });
  }

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

    const currentRule = {};
    // Save all 10 params
    for (let i = 1; i <= 10; i++) {
      currentRule[`p${i}`] = parseFloat(document.getElementById(`slider_p${i}`).value);
    }
    // Save Post-FX
    currentRule.bloom = parseFloat(document.getElementById('slider_bloom').value);
    currentRule.chromatic = parseFloat(document.getElementById('slider_chromatic').value);
    currentRule.vignette = parseFloat(document.getElementById('slider_vignette').value);
    currentRule.filmgrain = parseFloat(document.getElementById('slider_filmgrain').value);
    // Save Audio
    currentRule.masterGain = parseFloat(sliderMasterGain.value);
    currentRule.bassGain = bassGain;
    currentRule.midGain = midGain;
    currentRule.trebleGain = trebleGain;
    currentRule.equationKey = presetSelect.value;
    currentRule.masterAutomationActive = masterAutomationActive;
    currentRule.automations = JSON.parse(JSON.stringify(automationSlots));

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
    // Apply all 10 param sliders
    for (let i = 1; i <= 10; i++) {
      const key = `p${i}`;
      if (rule[key] !== undefined) {
        setSlider(`slider_p${i}`, `val_p${i}`, `param${i}`, rule[key]);
      }
    }

    // Apply Post-FX
    if (rule.bloom !== undefined) setPostFx('slider_bloom', 'val_bloom', 'bloom', rule.bloom);
    if (rule.chromatic !== undefined) setPostFx('slider_chromatic', 'val_chromatic', 'chromatic', rule.chromatic);
    if (rule.vignette !== undefined) setPostFx('slider_vignette', 'val_vignette', 'vignette', rule.vignette);
    if (rule.filmgrain !== undefined) setPostFx('slider_filmgrain', 'val_filmgrain', 'filmgrain', rule.filmgrain);

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
    if (rule.masterAutomationActive !== undefined) {
      masterAutomationActive = rule.masterAutomationActive;
      btnMasterAutomation.classList.toggle('active', masterAutomationActive);
      btnMasterAutomation.textContent = masterAutomationActive ? '⚡ ACTIVE' : '⏸️ PAUSED';
    }
    if (rule.automations && Array.isArray(rule.automations)) {
      rule.automations.forEach((savedSlot, idx) => {
        if (idx < automationSlots.length) {
          const slot = automationSlots[idx];
          slot.enabled = savedSlot.enabled;
          slot.target = savedSlot.target;
          slot.source = savedSlot.source;
          slot.mode = savedSlot.mode;
          slot.depth = savedSlot.depth;
          slot.baseValue = savedSlot.baseValue;

          const slotNum = idx + 1;
          const chk = document.getElementById(`auto_en_${slotNum}`);
          const selTgt = document.getElementById(`auto_target_${slotNum}`);
          const selSrc = document.getElementById(`auto_source_${slotNum}`);
          const selMod = document.getElementById(`auto_mode_${slotNum}`);
          const sldDep = document.getElementById(`auto_depth_${slotNum}`);
          const valDep = document.getElementById(`auto_depth_val_${slotNum}`);

          if (chk) chk.checked = slot.enabled;
          if (selTgt) selTgt.value = slot.target;
          if (selSrc) selSrc.value = slot.source;
          if (selMod) selMod.value = slot.mode;
          if (sldDep) sldDep.value = slot.depth;
          if (valDep) valDep.textContent = `${slot.depth >= 0 ? '+' : ''}${Math.round(slot.depth * 100)}%`;
        }
      });
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

  function setPostFx(sliderId, valId, fxKey, value) {
    const slider = document.getElementById(sliderId);
    const valDisplay = document.getElementById(valId);
    if (slider && valDisplay) {
      slider.value = value;
      valDisplay.textContent = value.toFixed(2);
      shaderEngine.postFx[fxKey] = value;
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
  loadPreset('spectral_wave_grid');

  // ==========================================
  // Audio Rhythm Slider Automation Engine
  // ==========================================
  let masterAutomationActive = true;
  const btnMasterAutomation = document.getElementById('btnMasterAutomation');

  const automationSlots = [
    { id: 1, target: 'param1', source: 'bass', mode: 'add', depth: 0.70, baseValue: 0.35, enabled: true },
    { id: 2, target: 'param3', source: 'beat', mode: 'add', depth: 0.80, baseValue: 0.20, enabled: true },
    { id: 3, target: 'param4', source: 'mid', mode: 'add', depth: 0.50, baseValue: 0.50, enabled: false },
    { id: 4, target: 'bloom', source: 'beat', mode: 'add', depth: 0.75, baseValue: 0.05, enabled: false }
  ];

  if (btnMasterAutomation) {
    btnMasterAutomation.addEventListener('click', () => {
      masterAutomationActive = !masterAutomationActive;
      btnMasterAutomation.classList.toggle('active', masterAutomationActive);
      btnMasterAutomation.textContent = masterAutomationActive ? '⚡ ACTIVE' : '⏸️ PAUSED';
    });
  }

  // Wire Automation Slot UI Inputs
  for (let i = 1; i <= 4; i++) {
    const slotIndex = i - 1;
    const slot = automationSlots[slotIndex];
    const chk = document.getElementById(`auto_en_${i}`);
    const selTgt = document.getElementById(`auto_target_${i}`);
    const selSrc = document.getElementById(`auto_source_${i}`);
    const selMod = document.getElementById(`auto_mode_${i}`);
    const sldDep = document.getElementById(`auto_depth_${i}`);
    const valDep = document.getElementById(`auto_depth_val_${i}`);

    if (chk) {
      chk.addEventListener('change', (e) => {
        slot.enabled = e.target.checked;
        const led = document.getElementById(`auto_led_${i}`);
        if (!slot.enabled && led) led.className = 'auto-led';
      });
    }

    if (selTgt) {
      selTgt.addEventListener('change', (e) => {
        slot.target = e.target.value;
        if (slot.target.startsWith('param')) {
          slot.baseValue = shaderEngine.params[slot.target] || 0.5;
        } else if (shaderEngine.postFx[slot.target] !== undefined) {
          slot.baseValue = shaderEngine.postFx[slot.target];
        }
      });
    }

    if (selSrc) {
      selSrc.addEventListener('change', (e) => {
        slot.source = e.target.value;
      });
    }

    if (selMod) {
      selMod.addEventListener('change', (e) => {
        slot.mode = e.target.value;
      });
    }

    if (sldDep) {
      sldDep.addEventListener('input', (e) => {
        slot.depth = parseFloat(e.target.value);
        if (valDep) valDep.textContent = `${slot.depth >= 0 ? '+' : ''}${Math.round(slot.depth * 100)}%`;
      });
    }
  }

  function updateRhythmAutomations() {
    const audio = shaderEngine.audio;
    const automatedTargets = new Set();

    for (let i = 1; i <= 4; i++) {
      const slot = automationSlots[i - 1];
      const led = document.getElementById(`auto_led_${i}`);
      const valDisplay = document.getElementById(`auto_val_${i}`);

      if (!masterAutomationActive || !slot.enabled) {
        if (led) led.className = 'auto-led';
        continue;
      }

      // Sample rhythm source
      let signal = 0;
      if (slot.source === 'bass') signal = audio.bass;
      else if (slot.source === 'beat') signal = audio.beat;
      else if (slot.source === 'mid') signal = audio.mid;
      else if (slot.source === 'treble') signal = audio.treble;
      else if (slot.source === 'rms') signal = audio.rms;
      else if (slot.source === 'lfoSine') signal = audioIngest.metrics.lfoSine || (Math.sin(audioIngest.rhythmPhase) * 0.5 + 0.5);
      else if (slot.source === 'lfoSaw') signal = audioIngest.metrics.lfoSaw || (audioIngest.rhythmPhase / (Math.PI * 2.0));

      // Compute modulated value
      let modVal = slot.baseValue;
      if (slot.mode === 'add') {
        modVal = slot.baseValue + signal * slot.depth;
      } else if (slot.mode === 'duck') {
        modVal = slot.baseValue * (1.0 - signal * Math.abs(slot.depth));
      } else if (slot.mode === 'direct') {
        modVal = signal * slot.depth;
      }
      modVal = Math.max(0.0, Math.min(1.0, modVal));

      // Apply to target
      if (slot.target.startsWith('param')) {
        shaderEngine.params[slot.target] = modVal;
        const pNum = slot.target.replace('param', '');
        const sliderEl = document.getElementById(`slider_p${pNum}`);
        const valEl = document.getElementById(`val_p${pNum}`);
        if (sliderEl && valEl) {
          sliderEl.value = modVal;
          sliderEl.classList.add('slider-auto-active');
          valEl.innerHTML = `${modVal.toFixed(2)} <span class="badge-auto">⚡ AUTO</span>`;
        }
      } else if (shaderEngine.postFx[slot.target] !== undefined) {
        shaderEngine.postFx[slot.target] = modVal;
        const sliderEl = document.getElementById(`slider_${slot.target}`);
        const valEl = document.getElementById(`val_${slot.target}`);
        if (sliderEl && valEl) {
          sliderEl.value = modVal;
          sliderEl.classList.add('slider-auto-active');
          valEl.innerHTML = `${modVal.toFixed(2)} <span class="badge-auto">⚡ AUTO</span>`;
        }
      }

      automatedTargets.add(slot.target);

      if (valDisplay) valDisplay.textContent = modVal.toFixed(2);
      if (led) {
        led.className = 'auto-led' + (signal > 0.1 ? ' active' : '') + (audio.beat > 0.4 ? ' beat' : '');
      }
    }

    // Clean up badges from non-automated sliders
    for (let p = 1; p <= 10; p++) {
      const key = `param${p}`;
      if (!automatedTargets.has(key)) {
        const sliderEl = document.getElementById(`slider_p${p}`);
        const valEl = document.getElementById(`val_p${p}`);
        if (sliderEl) sliderEl.classList.remove('slider-auto-active');
        if (valEl && valEl.querySelector('.badge-auto')) {
          valEl.textContent = parseFloat(sliderEl.value).toFixed(2);
        }
      }
    }
    ['bloom', 'chromatic', 'vignette', 'filmgrain'].forEach(fx => {
      if (!automatedTargets.has(fx)) {
        const sliderEl = document.getElementById(`slider_${fx}`);
        const valEl = document.getElementById(`val_${fx}`);
        if (sliderEl) sliderEl.classList.remove('slider-auto-active');
        if (valEl && valEl.querySelector('.badge-auto')) {
          valEl.textContent = parseFloat(sliderEl.value).toFixed(2);
        }
      }
    });
  }

  // ==========================================
  // Slider Event Listeners (u_param 1-10)
  // ==========================================
  for (let i = 1; i <= 10; i++) {
    const slider = document.getElementById(`slider_p${i}`);
    const valDisplay = document.getElementById(`val_p${i}`);
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valDisplay.textContent = val.toFixed(2);
        shaderEngine.params[`param${i}`] = val;
        // Update base value for any automation targeting this param
        automationSlots.forEach(s => {
          if (s.target === `param${i}`) s.baseValue = val;
        });
      });
    }
  }

  // ==========================================
  // Post-FX Slider Event Listeners
  // ==========================================
  const postFxSliders = [
    { id: 'slider_bloom', valId: 'val_bloom', key: 'bloom' },
    { id: 'slider_chromatic', valId: 'val_chromatic', key: 'chromatic' },
    { id: 'slider_vignette', valId: 'val_vignette', key: 'vignette' },
    { id: 'slider_filmgrain', valId: 'val_filmgrain', key: 'filmgrain' }
  ];

  postFxSliders.forEach(({ id, valId, key }) => {
    const slider = document.getElementById(id);
    const valDisplay = document.getElementById(valId);
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valDisplay.textContent = val.toFixed(2);
        shaderEngine.postFx[key] = val;
        // Update base value for any automation targeting this FX
        automationSlots.forEach(s => {
          if (s.target === key) s.baseValue = val;
        });
      });
    }
  });

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

  // FFT Spectrum Renderer (smooth ambient overlay on viewport bottom)
  function drawSpectrumOverlay() {
    if (!spectrumOverlay) return;
    const dpr = window.devicePixelRatio || 1;
    const w = spectrumOverlay.clientWidth * dpr;
    const h = spectrumOverlay.clientHeight * dpr;
    if (w === 0 || h === 0) return;

    if (spectrumOverlay.width !== w || spectrumOverlay.height !== h) {
      spectrumOverlay.width = w;
      spectrumOverlay.height = h;
    }

    specCtx.clearRect(0, 0, w, h);
    const bands = 64;
    const barWidth = w / bands;

    for (let i = 0; i < bands; i++) {
      const val = eqSmoothedBars[i] || 0;
      if (val < 0.01) continue;
      const barHeight = val * h * 0.95;
      const hue = 180 - (i / bands) * 200;
      specCtx.fillStyle = `hsla(${hue}, 85%, 55%, 0.35)`;
      specCtx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);
    }
  }

  // ==========================================
  // Main Animation Loop
  // ==========================================
  let lastFrameTime = performance.now();

  function animationLoop() {
    const now = performance.now();
    const dt = now - lastFrameTime;
    lastFrameTime = now;

    // Real-time Rhythm Slider Automation
    updateRhythmAutomations();

    // Continuous Organic Temporal Interpolation (aiXander & VolkanSah Damping Filter)
    const damp = audioDamping;
    const invDamp = 1.0 - damp;
    shaderEngine.audio.subBass = shaderEngine.audio.subBass * damp + targetAudio.subBass * invDamp;
    shaderEngine.audio.bass = shaderEngine.audio.bass * damp + targetAudio.bass * invDamp;
    shaderEngine.audio.mid = shaderEngine.audio.mid * damp + targetAudio.mid * invDamp;
    shaderEngine.audio.treble = shaderEngine.audio.treble * damp + targetAudio.treble * invDamp;
    shaderEngine.audio.rms = shaderEngine.audio.rms * damp + targetAudio.rms * invDamp;
    shaderEngine.audio.peak = shaderEngine.audio.peak * damp + targetAudio.peak * invDamp;
    shaderEngine.audio.beat = shaderEngine.audio.beat * damp + targetAudio.beat * invDamp;
    shaderEngine.audio.rhythm = targetAudio.rhythm;

    // Smooth Hardware Band Meter Animations
    if (meterBass) meterBass.style.width = `${Math.min(100, shaderEngine.audio.bass * 100)}%`;
    if (meterMid) meterMid.style.width = `${Math.min(100, shaderEngine.audio.mid * 100)}%`;
    if (meterTreble) meterTreble.style.width = `${Math.min(100, shaderEngine.audio.treble * 100)}%`;

    shaderEngine.render();
    fpsCounter.textContent = `${shaderEngine.currentFps} FPS`;

    // Draw EQ Visualizer (footer)
    drawEQVisualizer();

    // Draw spectrum overlay (viewport bottom)
    drawSpectrumOverlay();

    // Debug frame timing
    if (debugVisible) {
      dbgFrametime.textContent = `${dt.toFixed(1)}ms`;
      drawDebugFrameGraph(dt);
    }

    requestAnimationFrame(animationLoop);
  }

  // Start with default hardware device audio capture
  audioIngest.startAudioDevice(null);

  animationLoop();
});
