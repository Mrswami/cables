import React, { useEffect, useRef, useState, useCallback } from 'react';
import { audioStore } from './AudioStore';

const MIN_HZ = 20;
const MAX_HZ = 16000;

function hzToX(hz, width) {
  const minLog = Math.log10(MIN_HZ);
  const maxLog = Math.log10(MAX_HZ);
  const hzLog = Math.log10(hz);
  return ((hzLog - minLog) / (maxLog - minLog)) * width;
}

function xToHz(x, width) {
  const minLog = Math.log10(MIN_HZ);
  const maxLog = Math.log10(MAX_HZ);
  const valLog = minLog + (x / width) * (maxLog - minLog);
  return Math.pow(10, valLog);
}

export default function SpectralizerBar({ modMatrix, levels, freqRanges, setFreqRanges }) {
  const canvasRef = useRef(null);
  const [draggingIdx, setDraggingIdx] = useState(null);

  // Derive boundaries from freqRanges
  const boundaries = [
    freqRanges.sub[1],
    freqRanges.low[1],
    freqRanges.mid[1]
  ];

  const BANDS_DEF = [
    { name: 'SUB', key: 'sub', color: '#ff0055', glow: 'rgba(255, 0, 85, 0.4)' },
    { name: 'LOW', key: 'low', color: '#ff9900', glow: 'rgba(255, 153, 0, 0.4)' },
    { name: 'MID', key: 'mid', color: '#00ffcc', glow: 'rgba(0, 255, 204, 0.4)' },
    { name: 'HIGH', key: 'high', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' }
  ];

  const handlePointerDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Find closest boundary
    let closestIdx = -1;
    let minDist = Infinity;
    boundaries.forEach((bHz, idx) => {
      const bx = hzToX(bHz, rect.width);
      const dist = Math.abs(x - bx);
      if (dist < 20) { // 20px hit area
        if (dist < minDist) {
          minDist = dist;
          closestIdx = idx;
        }
      }
    });

    if (closestIdx !== -1) {
      setDraggingIdx(closestIdx);
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(10, Math.min(e.clientX - rect.left, rect.width - 10));
    
    if (draggingIdx === null) {
      // Hover effect update
      let hover = false;
      boundaries.forEach(bHz => {
        const bx = hzToX(bHz, rect.width);
        if (Math.abs(x - bx) < 15) hover = true;
      });
      canvasRef.current.style.cursor = hover ? 'col-resize' : 'default';
      return;
    }

    const newHz = xToHz(x, rect.width);
    
    // Constrain by neighbors
    const minH = draggingIdx > 0 ? boundaries[draggingIdx - 1] * 1.1 : MIN_HZ * 1.1;
    const maxH = draggingIdx < 2 ? boundaries[draggingIdx + 1] * 0.9 : MAX_HZ * 0.9;
    
    const finalHz = Math.min(Math.max(newHz, minH), maxH);
    
    const newBoundaries = [...boundaries];
    newBoundaries[draggingIdx] = finalHz;

    setFreqRanges({
      sub: [MIN_HZ, newBoundaries[0]],
      low: [newBoundaries[0], newBoundaries[1]],
      mid: [newBoundaries[1], newBoundaries[2]],
      high: [newBoundaries[2], MAX_HZ]
    });
  };

  const handlePointerUp = (e) => {
    setDraggingIdx(null);
    if (e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      animId = requestAnimationFrame(render);

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

      // Draw background bands
      BANDS_DEF.forEach((band, bIdx) => {
        const minH = freqRanges[band.key][0];
        const maxH = freqRanges[band.key][1];
        const x1 = hzToX(minH, width);
        const x2 = hzToX(maxH, width);
        const bandW = x2 - x1;

        // Band boundary line
        if (bIdx > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = (draggingIdx === bIdx - 1 ? 3 : 1) * dpr;
          ctx.beginPath();
          ctx.moveTo(x1, 0);
          ctx.lineTo(x1, height);
          ctx.stroke();

          // Draggable Handle Indicator
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(x1, height / 2, 4 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Bottom label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(x1, height - (20 * dpr), bandW, 20 * dpr);

        ctx.font = `bold ${Math.max(9, 10 * dpr)}px "JetBrains Mono", monospace`;
        ctx.fillStyle = band.color;
        const hzText = `${Math.round(maxH)}Hz`;
        ctx.fillText(band.name, x1 + (8 * dpr), height - (6 * dpr));
        
        // Draw vertical energy meter
        const rawEnergy = audioStore.bands[`raw${band.key.charAt(0).toUpperCase() + band.key.slice(1)}`] || 0;
        const modRoute = modMatrix?.[band.key];
        const gate = modRoute ? (modRoute.gate || 0) / 100 : 0;
        
        const meterW = 6 * dpr;
        const meterH = height - (30 * dpr);
        const meterX = x1 + bandW - meterW - (8 * dpr);
        const meterY = 10 * dpr;
        
        // Meter background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(meterX, meterY, meterW, meterH);
        
        // Meter fill
        const fillH = rawEnergy * meterH;
        ctx.fillStyle = rawEnergy >= gate ? band.color : 'rgba(255,255,255,0.3)';
        ctx.fillRect(meterX, meterY + meterH - fillH, meterW, fillH);
        
        // Gate threshold line
        const gateY = meterY + meterH - (gate * meterH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(meterX - 2, gateY);
        ctx.lineTo(meterX + meterW + 2, gateY);
        ctx.stroke();
      });

      // Render Continuous Spectral Line
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const currentHz = xToHz(x, width);
        const exactBin = currentHz / binHz;
        
        const idx = Math.floor(exactBin);
        const frac = exactBin - idx;
        const v1 = freq && freq[idx] ? freq[idx] : 0;
        const v2 = freq && freq[idx + 1] ? freq[idx + 1] : v1;
        const val = v1 * (1 - frac) + v2 * frac;
        
        const globalSens = audioStore.config.sensitivity || 1.0;
        const normVal = Math.min(1.0, (val / 255) * 1.25 * globalSens);
        
        const maxLineHeight = height - (24 * dpr);
        const pointY = height - (Math.pow(normVal, 0.9) * maxLineHeight) - (20 * dpr);
        
        if (x === 0) {
          ctx.moveTo(x, pointY);
        } else {
          ctx.lineTo(x, pointY);
        }
      }

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 * dpr;
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.restore();
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [modMatrix, levels, freqRanges, draggingIdx]);

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
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
