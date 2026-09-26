import React, { useRef, useEffect, useState } from 'react';
import './index.css';

function App() {
  const canvasRef = useRef(null);
  const [isAudioRunning, setIsAudioRunning] = useState(false);
  
  // Mappings for parameters
  const [lowMap, setLowMap] = useState(100);
  const [midMap, setMidMap] = useState(100);
  const [highMap, setHighMap] = useState(100);

  // Audio references
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const requestRef = useRef(null);

  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      
      analyser.fftSize = 512;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      sourceRef.current = source;

      setIsAudioRunning(true);
      requestRef.current = requestAnimationFrame(draw);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access is required for live audio visualizer.');
    }
  };

  const getAverages = (dataArray) => {
    // 256 bins total based on fftSize 512
    let lowSum = 0, midSum = 0, highSum = 0;
    
    // Lows (0 - 10 bins)
    for (let i = 0; i < 10; i++) lowSum += dataArray[i];
    // Mids (10 - 100 bins)
    for (let i = 10; i < 100; i++) midSum += dataArray[i];
    // Highs (100 - 256 bins)
    for (let i = 100; i < 256; i++) highSum += dataArray[i];

    return {
      low: lowSum / 10,
      mid: midSum / 90,
      high: highSum / 156
    };
  };

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const { low, mid, high } = getAverages(dataArrayRef.current);

    // Apply mappings to visual parameters
    const bassScale = 1 + (low / 255) * (lowMap / 100) * 1.5;
    const midHue = (mid / 255) * (midMap / 100) * 360;
    const highIntensity = (high / 255) * (highMap / 100);

    // Fade effect for trails
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = 150;
    
    // Draw Center Circle (Reacts to Bass/Lows)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(bassScale, bassScale);
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius, 0, 2 * Math.PI);
    ctx.fillStyle = `hsla(${200 + midHue}, 100%, 50%, 0.8)`;
    ctx.shadowBlur = 40;
    ctx.shadowColor = `hsla(${200 + midHue}, 100%, 50%, 1)`;
    ctx.fill();
    ctx.restore();

    // Draw Particles (Reacts to Highs/Hi-hats)
    if (highIntensity > 0.1) {
      const numParticles = Math.floor(highIntensity * 50);
      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = baseRadius * bassScale + Math.random() * 300 * highIntensity;
        const px = cx + Math.cos(angle) * distance;
        const py = cy + Math.sin(angle) * distance;
        
        ctx.beginPath();
        ctx.arc(px, py, Math.random() * 4 * highIntensity + 1, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    }

    // Draw Frequency Ring (Reacts to Mids)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * bassScale + 20, 0, 2 * Math.PI);
    ctx.strokeStyle = `hsla(${midHue}, 100%, 70%, 0.5)`;
    ctx.lineWidth = 10 * (mid / 255) * (midMap / 100) + 1;
    ctx.stroke();
    ctx.restore();

    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div className="app-container">
      <canvas ref={canvasRef} />
      
      <div className={`ui-overlay ${isAudioRunning ? '' : 'active'}`}>
        <h1>Cables Visualizer</h1>
        {!isAudioRunning ? (
          <button className="start-btn" onClick={initAudio}>
            Start Microphone
          </button>
        ) : (
          <div className="controls-row">
            <div className="control-group">
              <label>Low (Bass Scale)</label>
              <input 
                type="range" min="0" max="200" 
                value={lowMap} onChange={(e) => setLowMap(e.target.value)} 
              />
            </div>
            <div className="control-group">
              <label>Mid (Color Hue)</label>
              <input 
                type="range" min="0" max="200" 
                value={midMap} onChange={(e) => setMidMap(e.target.value)} 
              />
            </div>
            <div className="control-group">
              <label>High (Particles)</label>
              <input 
                type="range" min="0" max="200" 
                value={highMap} onChange={(e) => setHighMap(e.target.value)} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
