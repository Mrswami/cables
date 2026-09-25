const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Enable GPU Acceleration Flags for High FPS WebGL2 / WebGPU Rendering
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-features', 'Vulkan,UseSkiaRenderer,TouchscreenInDisplay');

let mainWindow;

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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
