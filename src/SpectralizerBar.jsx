import React, { useEffect, useRef } from 'react';
import { audioStore } from './AudioStore';

export default function SpectralizerBar({ modMatrix, levels }) {
  const canvasRef = useRef(null);
  const peakHoldRef = useRef({});

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const BANDS = [
      { name: 'SUB BASS', range: '20-65Hz', minHz: 20, maxHz: 65, color: '#ff0055', glow: 'rgba(255, 0, 85, 0.4)', key: 'sub' },
      { name: 'LOW / KICK', range: '65-250Hz', minHz: 65, maxHz: 250, color: '#ff9900', glow: 'rgba(255, 153, 0, 0.4)', key: 'low' },
      { name: 'MIDS / LEAD', range: '250-2.5kHz', minHz: 250, maxHz: 2500, color: '#00ffcc', glow: 'rgba(0, 255, 204, 0.4)', key: 'mid' },
      { name: 'HIGHS / HI-HAT', range: '2.5k-16kHz', minHz: 2500, maxHz: 16000, color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', key: 'high' }
    ];

    const peakHold = peakHoldRef.current;

    const render = () => {
      animId = requestAnimationFrame(render);

      // Handle dynamic pixel ratio & resize
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const targetWidth = Math.floor(rect.width * dpr);
      const targetHeight = Math.floor(rect.height * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) return;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Deep dark sleek backdrop with gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, 'rgba(6, 8, 14, 0.95)');
      bgGrad.addColorStop(1, 'rgba(3, 4, 8, 0.98)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const freq = audioStore.freqData;
      const binHz = 48000 / audioStore.fftSize;
      const maxBin = freq ? freq.length - 1 : 1023;

      const bandWidth = width / BANDS.length;
      const barsPerBand = 16;
      const barPadding = 2 * dpr;

      BANDS.forEach((band, bIdx) => {
        const startX = bIdx * bandWidth;
        const subBarWidth = (bandWidth - (barsPerBand * barPadding)) / barsPerBand;

        // Band boundary separator
        if (bIdx > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1 * dpr;
          ctx.beginPath();
          ctx.moveTo(startX, 0);
          ctx.lineTo(startX, height);
          ctx.stroke();
        }

        // Render each bar in this band's frequency slice
        for (let i = 0; i < barsPerBand; i++) {
          const barKey = `${bIdx}_${i}`;
          // Logarithmic distribution within this band's minHz -> maxHz
          const ratio = i / (barsPerBand - 1);
          const nextRatio = (i + 1) / (barsPerBand - 1);
          
          const currentHz = band.minHz * Math.pow(band.maxHz / band.minHz, ratio);
          const nextHz = i === barsPerBand - 1 
            ? band.maxHz 
            : band.minHz * Math.pow(band.maxHz / band.minHz, nextRatio);
            
          const exactStartBin = currentHz / binHz;
          const exactEndBin = nextHz / binHz;

          let val = 0;
          if (freq && freq.length > 0) {
            let maxVal = 0;
            
            // Sub and Low bands: smooth fractional interpolation for individual bass note bars
            if (exactEndBin - exactStartBin < 1.0) {
              const centerBin = (exactStartBin + exactEndBin) / 2;
              const idx = Math.floor(centerBin);
              const frac = centerBin - idx;
              const v1 = freq[idx] || 0;
              const v2 = freq[idx + 1] || v1;
              maxVal = v1 * (1 - frac) + v2 * frac;
            } else {
              // Mids and Highs: peak energy within the slice
              const startBin = Math.max(0, Math.floor(exactStartBin));
              const endBin = Math.min(maxBin, Math.ceil(exactEndBin));
              for (let bin = startBin; bin <= endBin; bin++) {
                if (freq[bin] > maxVal) maxVal = freq[bin];
              }
            }

            const bandGain = (audioStore.config[`${band.key}Gain`] ?? 100) / 100;
            const globalSens = audioStore.config.sensitivity || 1.0;
            
            val = Math.min(1.0, (maxVal / 255) * 1.25 * bandGain * globalSens);
          }

          const barX = startX + (i * (subBarWidth + barPadding)) + (barPadding / 2);
          const maxBarHeight = height - (24 * dpr);
          const barHeight = Math.max(2 * dpr, Math.pow(val, 0.9) * maxBarHeight);
          const barY = height - barHeight - (20 * dpr);

          // Peak-Hold Physics (Gravity Decay)
          let currentPeak = peakHold[barKey] || { y: barY, holdTimer: 0 };
          if (barY <= currentPeak.y) {
            currentPeak.y = barY;
            currentPeak.holdTimer = 8; // hold for 8 frames
          } else {
            if (currentPeak.holdTimer > 0) {
              currentPeak.holdTimer--;
            } else {
              currentPeak.y = Math.min(height - (22 * dpr), currentPeak.y + (1.8 * dpr)); // gravity drop
            }
          }
          peakHold[barKey] = currentPeak;

          // Bar Gradient (Vibrant base to punchy crest)
          const barGrad = ctx.createLinearGradient(0, barY, 0, height - (20 * dpr));
          barGrad.addColorStop(0, '#ffffff');
          barGrad.addColorStop(0.15, band.color);
          barGrad.addColorStop(1, band.glow);

          ctx.fillStyle = barGrad;
          ctx.globalAlpha = val > 0.02 ? 0.95 : 0.25;
          ctx.fillRect(barX, barY, subBarWidth, barHeight);

          // Pro Audio Peak Cap (Floating white peak cap with smooth fall)
          if (currentPeak.y < height - (24 * dpr)) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.95;
            ctx.fillRect(barX, currentPeak.y, subBarWidth, 2 * dpr);
          }
        }

        // Bottom label background bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.globalAlpha = 1.0;
        ctx.fillRect(startX, height - (20 * dpr), bandWidth, 20 * dpr);

        // Section Title & Range
        ctx.font = `bold ${Math.max(9, 10 * dpr)}px "JetBrains Mono", monospace`;
        ctx.fillStyle = band.color;
        ctx.fillText(
          `${band.name} (${band.range})`, 
          startX + (8 * dpr), 
          height - (6 * dpr)
        );
      });

      // Global Ingestion Status Dot
      const isActive = audioStore.bands.isActive;
      ctx.fillStyle = isActive ? '#00ff66' : '#555555';
      ctx.beginPath();
      ctx.arc(width - (14 * dpr), 12 * dpr, 4 * dpr, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
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
        height: '100px',
        zIndex: 10,
        borderTop: '1px solid rgba(255, 255, 255, 0.15)',
        background: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        boxShadow: '0 -6px 20px rgba(0,0,0,0.6)'
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
