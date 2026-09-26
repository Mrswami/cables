const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Enable GPU Acceleration Flags for High FPS WebGL2 / WebGPU Rendering
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-features', 'Vulkan,UseSkiaRenderer,TouchscreenInDisplay');

let mainWindow;
let serverProcess = null;
let pythonProcess = null;

function startServer() {
  try {
    serverProcess = spawn('node', [path.join(__dirname, 'server/index.js')], {
      stdio: 'inherit'
    });
    console.log('[Main] Express & WebSocket Server process launched.');
  } catch (err) {
    console.error('[Main] Could not start server process:', err);
  }
}

function startPythonBridge() {
  try {
    pythonProcess = spawn('python', ['-u', path.join(__dirname, 'server/audio_sidecar.py')], {
      stdio: 'inherit'
    });
    console.log('[Main] Python WASAPI Loopback Sidecar launched.');

    pythonProcess.on('exit', (code) => {
      console.log(`[Main] Python audio sidecar exited with code ${code}`);
    });
  } catch (err) {
    console.error('[Main] Could not start Python sidecar process:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: 'TouchArt Studio - Code Art & Audio Ingest Engine',
    backgroundColor: '#0b0d14',
    darkTheme: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webgl: true,
      experimentalFeatures: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'desktop/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC listener for restarting python bridge on demand from Studio UI
ipcMain.on('restart-python-bridge', () => {
  console.log('[Main] Restarting Python WASAPI Loopback Bridge requested by UI...');
  if (pythonProcess) {
    try { pythonProcess.kill(); } catch (e) {}
  }
  setTimeout(startPythonBridge, 500);
});

app.whenReady().then(() => {
  startServer();
  // Brief delay to ensure WebSocket port 8080 is listening before Python connects
  setTimeout(startPythonBridge, 1200);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (pythonProcess) {
    try { pythonProcess.kill(); } catch (e) {}
  }
  if (serverProcess) {
    try { serverProcess.kill(); } catch (e) {}
  }
});
