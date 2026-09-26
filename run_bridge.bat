@echo off
title TouchArt Studio - Digital Audio & Python WASAPI Loopback Bridge
color 0b
echo ======================================================================
echo    TOUCHART STUDIO - AUDIO BRIDGE & PYTHON WASAPI LOOPBACK
echo ======================================================================
echo.
echo [1/2] Starting WebSocket Sync Server on port 8080...
start "TouchArt WebSocket Server" cmd /k "node server/index.js"
timeout /t 2 /nobreak >nul

echo [2/2] Starting Python WASAPI Loopback DSP Sidecar...
start "TouchArt Python WASAPI Sidecar" cmd /k "python -u server/audio_sidecar.py"

echo.
echo ======================================================================
echo  Bridge is now ONLINE!
echo  WebSocket: ws://localhost:8080
echo.
echo  You can now open:
echo  - Live Web App: https://cables.web.app
echo  - Or local Electron: npm start
echo ======================================================================
echo.
pause
