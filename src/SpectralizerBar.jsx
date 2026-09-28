import React, { useEffect, useRef } from 'react';
import { audioStore } from './AudioStore';

export default function SpectralizerBar({ modMatrix, levels }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      // Subtle background grid
      ctx.fillStyle = 'rgba(10, 12, 18, 0.75)';
      ctx.fillRect(0, 0, width, height);

      const freq = audioStore.freqData;
      if (!freq || freq.length === 0) return;

      const numBars = 64;
      const barWidth = (width / numBars) - 2;
      const binHz = 48000 / audioStore.fftSize;

      // Draw frequency spectrum bars
      for (let i = 0; i < numBars; i++) {
        // Non-linear frequency distribution (logarithmic / perceptual)
        const freqRatio = Math.pow(i / numBars, 1.8);
        const binIndex = Math.min(freq.length - 1, Math.floor(freqRatio * (freq.length / 2)));
        const val = (freq[binIndex] || 0) / 255;
        const currentHz = Math.round(binIndex * binHz);

        // Determine band color
        let color = '#444';
        if (currentHz < 65) {
          color = '#ff0055'; // Sub
        } else if (currentHz < 250) {
          color = '#ff9900'; // Low
        } else if (currentHz < 2500) {
          color = '#00ffcc'; // Mid
        } else {
          color = '#a855f7'; // High
        }

        const barHeight = Math.max(2, val * (height - 18));
        const x = i * (barWidth + 2);
        const y = height - barHeight - 14;

        // Bar body
        ctx.fillStyle = color;
        ctx.globalAlpha = val > 0.05 ? 0.85 : 0.25;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Peak highlight
        if (val > 0.1) {
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.9;
          ctx.fillRect(x, y, barWidth, 2);
        }
      }

      ctx.globalAlpha = 1.0;

      // Bottom Frequency Range Overlay Bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, height - 14, width, 14);

      // Frequency Band Markers
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ff0055';
      ctx.fillText('SUB 20-65Hz', 6, height - 4);

      ctx.fillStyle = '#ff9900';
      ctx.fillText('LOW 65-250Hz', width * 0.22, height - 4);

      ctx.fillStyle = '#00ffcc';
      ctx.fillText('MIDS 250-2.5kHz', width * 0.52, height - 4);

      ctx.fillStyle = '#a855f7';
      ctx.fillText('HIGHS 2.5k-16kHz', width * 0.80, height - 4);

      // Live Audio Signal Status Indicator
      const isActive = audioStore.bands.isActive;
      ctx.fillStyle = isActive ? '#00ff66' : '#666666';
      ctx.beginPath();
      ctx.arc(width - 10, height - 7, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [modMatrix, levels]);

  return (
    <div 
      className="spectralizer-container" 
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '56px',
        zIndex: 5,
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        background: 'linear-gradient(180deg, rgba(5,7,12,0.6) 0%, rgba(3,4,8,0.95) 100%)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.5)'
      }}
    >
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={56} 
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
