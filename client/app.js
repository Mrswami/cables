/**
 * Cables.gl Live DAW & Audio Sync Client App
 * Processes live WebAudio mic/line-in inputs, renders FFT, and streams metrics via WebSocket.
 */

let ws = null;
let audioCtx = null;
let analyser = null;
let microphoneStream = null;
let audioSourceNode = null;
let audioFileNode = null;
let isAudioActive = false;
let isSimulating = false;
let simulationInterval = null;

// UI Elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const activeSourceTag = document.getElementById('activeSourceTag');
const btnMic = document.getElementById('btnMic');
const btnSimulate = document.getElementById('btnSimulate');
const audioFileInput = document.getElementById('audioFileInput');
const fftCanvas = document.getElementById('fftCanvas');
const ctx = fftCanvas.getContext('2d');

// Meters & Progress Bars
const valSubBass = document.getElementById('valSubBass');
const barSubBass = document.getElementById('barSubBass');
const valBass = document.getElementById('valBass');
const barBass = document.getElementById('barBass');
const valMid = document.getElementById('valMid');
const barMid = document.getElementById('barMid');
const valTreble = document.getElementById('valTreble');
const barTreble = document.getElementById('barTreble');

const valStemDrums = document.getElementById('valStemDrums');
const barStemDrums = document.getElementById('barStemDrums');
const valStemBass = document.getElementById('valStemBass');
const barStemBass = document.getElementById('barStemBass');
const valStemVocals = document.getElementById('valStemVocals');
const barStemVocals = document.getElementById('barStemVocals');
const valStemSynths = document.getElementById('valStemSynths');
const barStemSynths = document.getElementById('barStemSynths');
const bpmDisplay = document.getElementById('bpmDisplay');

// Resize canvas properly
function resizeCanvas() {
  fftCanvas.width = fftCanvas.clientWidth * window.devicePixelRatio;
  fftCanvas.height = fftCanvas.clientHeight * window.devicePixelRatio;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initialize WebSocket Connection to Server
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.hostname}:8080`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    statusDot.classList.remove('disconnected');
    statusText.textContent = 'Connected (8080)';
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'sync_update' || msg.type === 'init') {
        const data = msg.data;
        if (data.bpm) {
          bpmDisplay.textContent = `${data.bpm.toFixed(2)} BPM | Pos: ${data.positionSeconds.toFixed(1)}s`;
        }
        if (isSimulating && data.audio) {
          updateUIWithMetrics(data.audio, data.stems);
        }
      }
    } catch (e) {
      console.error('Error handling message:', e);
    }
  };

  ws.onclose = () => {
    statusDot.classList.add('disconnected');
    statusText.textContent = 'Disconnected';
    setTimeout(initWebSocket, 2000);
  };
}

// Initialize Web Audio Context
function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Enable Live Microphone / System Audio Input
btnMic.addEventListener('click', async () => {
  try {
    initAudioContext();
    stopSimulation();

    if (microphoneStream) {
      microphoneStream.getTracks().forEach(t => t.stop());
    }

    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioSourceNode = audioCtx.createMediaStreamSource(microphoneStream);
    audioSourceNode.connect(analyser);

    isAudioActive = true;
    activeSourceTag.textContent = 'Source: Live Microphone / Line-In';
    btnMic.style.background = 'linear-gradient(135deg, #00ff88, #00b359)';
    btnMic.textContent = 'Live Audio Active';

    renderLoop();
  } catch (err) {
    alert('Could not access audio input device: ' + err.message);
  }
});

// Handle Local Audio File Upload
audioFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  initAudioContext();
  stopSimulation();

  const url = URL.createObjectURL(file);
  const audioEl = new Audio(url);
  audioEl.controls = true;
  audioEl.play();

  if (audioFileNode) audioFileNode.disconnect();
  audioFileNode = audioCtx.createMediaElementSource(audioEl);
  audioFileNode.connect(analyser);
  analyser.connect(audioCtx.destination);

  isAudioActive = true;
  activeSourceTag.textContent = `Source: File (${file.name})`;
  renderLoop();
});

// Toggle Test Signal Simulation
btnSimulate.addEventListener('click', () => {
  if (isSimulating) {
    stopSimulation();
  } else {
    startSimulation();
  }
});

function startSimulation() {
  isSimulating = true;
  isAudioActive = false;
  activeSourceTag.textContent = 'Source: Test Simulation';
  btnSimulate.style.background = 'linear-gradient(135deg, #ffb700, #ff8800)';
  btnSimulate.textContent = 'Stop Test Signal';

  let step = 0;
  simulationInterval = setInterval(() => {
    step++;
    const t = step * 0.05;
    const isBeat = step % 10 === 0;

    const audio = {
      rms: Math.sin(t) * 0.3 + 0.5,
      peak: isBeat ? 0.95 : 0.3,
      subBass: isBeat ? 0.9 : 0.2,
      bass: isBeat ? 0.85 : 0.25,
      mid: Math.sin(t * 2) * 0.4 + 0.4,
      treble: Math.cos(t * 3) * 0.4 + 0.3,
      spectralFlux: isBeat ? 0.8 : 0.1,
      transientTrigger: isBeat
    };

    const stems = {
      drums: isBeat ? 0.9 : 0.2,
      bass: Math.cos(t * 2) * 0.4 + 0.5,
      vocals: Math.sin(t) * 0.4 + 0.4,
      synths: Math.sin(t * 3) * 0.4 + 0.3
    };

    sendAudioMetricsToServer(audio, stems, 124, true, step * 0.05);
    drawSimulatedFFT(audio);
  }, 50);
}

function stopSimulation() {
  isSimulating = false;
  if (simulationInterval) clearInterval(simulationInterval);
  btnSimulate.style.background = 'linear-gradient(135deg, #ff007f, #b000ff)';
  btnSimulate.textContent = 'Toggle Test Signal Generator';
}

// Real-time Audio Processing Loop & Spectrum Render
function renderLoop() {
  if (!isAudioActive || !analyser) return;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  // Calculate Frequency Bands
  let subBassSum = 0, bassSum = 0, midSum = 0, trebleSum = 0, totalSum = 0;

  for (let i = 0; i < bufferLength; i++) {
    const val = dataArray[i] / 255.0;
    totalSum += val;

    if (i < 4) subBassSum += val;
    else if (i < 16) bassSum += val;
    else if (i < 80) midSum += val;
    else trebleSum += val;
  }

  const subBass = Math.min(1.0, subBassSum / 4);
  const bass = Math.min(1.0, bassSum / 12);
  const mid = Math.min(1.0, midSum / 64);
  const treble = Math.min(1.0, trebleSum / (bufferLength - 80));
  const rms = Math.min(1.0, totalSum / bufferLength);
  const isTransient = bass > 0.75;

  const audioMetrics = {
    rms,
    peak: Math.max(subBass, bass, mid, treble),
    subBass,
    bass,
    mid,
    treble,
    spectralFlux: isTransient ? 0.8 : 0.1,
    transientTrigger: isTransient
  };

  const stems = {
    drums: bass * 0.9,
    bass: subBass * 0.85,
    vocals: mid * 0.8,
    synths: treble * 0.75
  };

  updateUIWithMetrics(audioMetrics, stems);
  sendAudioMetricsToServer(audioMetrics, stems, 120, true, 0);

  // Draw Spectrum Bars on Canvas
  const w = fftCanvas.width;
  const h = fftCanvas.height;
  ctx.clearRect(0, 0, w, h);

  const barWidth = (w / bufferLength) * 2;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * h;
    const gradient = ctx.createLinearGradient(0, h, 0, 0);
    gradient.addColorStop(0, '#00f0ff');
    gradient.addColorStop(0.6, '#ff007f');
    gradient.addColorStop(1, '#ffffff');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
    x += barWidth;
  }

  requestAnimationFrame(renderLoop);
}

function drawSimulatedFFT(audio) {
  const w = fftCanvas.width;
  const h = fftCanvas.height;
  ctx.clearRect(0, 0, w, h);

  const numBars = 32;
  const barWidth = w / numBars;

  for (let i = 0; i < numBars; i++) {
    const factor = i < 8 ? audio.bass : i < 20 ? audio.mid : audio.treble;
    const val = factor * Math.random();
    const barHeight = val * h;

    ctx.fillStyle = i < 8 ? '#00f0ff' : i < 20 ? '#ff007f' : '#ffb700';
    ctx.fillRect(i * barWidth, h - barHeight, barWidth - 2, barHeight);
  }
}

function updateUIWithMetrics(audio, stems) {
  valSubBass.textContent = audio.subBass.toFixed(2);
  barSubBass.style.width = `${audio.subBass * 100}%`;

  valBass.textContent = audio.bass.toFixed(2);
  barBass.style.width = `${audio.bass * 100}%`;

  valMid.textContent = audio.mid.toFixed(2);
  barMid.style.width = `${audio.mid * 100}%`;

  valTreble.textContent = audio.treble.toFixed(2);
  barTreble.style.width = `${audio.treble * 100}%`;

  if (stems) {
    valStemDrums.textContent = (stems.drums || 0).toFixed(2);
    barStemDrums.style.width = `${(stems.drums || 0) * 100}%`;

    valStemBass.textContent = (stems.bass || 0).toFixed(2);
    barStemBass.style.width = `${(stems.bass || 0) * 100}%`;

    valStemVocals.textContent = (stems.vocals || 0).toFixed(2);
    barStemVocals.style.width = `${(stems.vocals || 0) * 100}%`;

    valStemSynths.textContent = (stems.synths || 0).toFixed(2);
    barStemSynths.style.width = `${(stems.synths || 0) * 100}%`;
  }
}

function sendAudioMetricsToServer(audio, stems, bpm, isPlaying, pos) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'push_audio_metrics',
      source: isSimulating ? 'simulation' : 'webaudio-mic',
      audio,
      stems,
      bpm,
      isPlaying,
      positionSeconds: pos
    }));
  }
}

// Start WebSocket on Load
initWebSocket();
