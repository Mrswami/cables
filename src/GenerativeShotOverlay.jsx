import React, { useRef, useEffect } from 'react';

// Shape renderers - each draws one large centered generative shape
const SHAPE_RENDERERS = {
  geo_burst: (ctx, w, h, t, color) => {
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.35 * (1 + t * 0.4);
    const sides = 6;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 6;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 + (1 - t) * 5;
    ctx.shadowBlur = 30;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  },

  kaleido_facets: (ctx, w, h, t, color) => {
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.4 * (1 + t * 0.3);
    const petals = 8;
    ctx.shadowBlur = 25;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let p = 0; p < petals; p++) {
      const angle = (p / petals) * Math.PI * 2;
      const x2 = cx + Math.cos(angle) * r;
      const y2 = cy + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc((cx + x2) / 2, (cy + y2) / 2, r / 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  },

  laser_beams: (ctx, w, h, t, color) => {
    const cx = w / 2, cy = h / 2;
    const rays = 12;
    const outerR = Math.min(w, h) * 0.45 * (1 + t * 0.5);
    const innerR = outerR * 0.08;
    ctx.shadowBlur = 40;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2;
      const len = outerR * (i % 2 === 0 ? 1.0 : 0.55);
      ctx.beginPath();
      ctx.lineWidth = i % 2 === 0 ? 2 : 1;
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.stroke();
    }
  },

  digital_grid: (ctx, w, h, t, color) => {
    const cx = w / 2, cy = h / 2;
    const size = Math.min(w, h) * 0.45 * (1 + t * 0.25);
    const cols = 7, rows = 7;
    const cellW = size * 2 / cols;
    const cellH = size * 2 / rows;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(cx - size, cy - size + r * cellH);
      ctx.lineTo(cx + size, cy - size + r * cellH);
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(cx - size + c * cellW, cy - size);
      ctx.lineTo(cx - size + c * cellW, cy + size);
      ctx.stroke();
    }
  },

  film_strobe: (ctx, w, h, t, color) => {
    const cx = w / 2, cy = h / 2;
    const rings = 5;
    ctx.shadowBlur = 50;
    ctx.shadowColor = color;
    for (let i = 0; i < rings; i++) {
      const r = Math.min(w, h) * (0.08 + i * 0.08) * (1 + t * 0.5);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 - i * 0.4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  color_cycle: (ctx, w, h, t, color) => {
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.4 * (1 + t * 0.3);
    const sides = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  },

  particle_shape_morph: (ctx, w, h, t, color) => {
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.38 * (1 + t * 0.4);
    const sides = 5;
    ctx.shadowBlur = 30;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= sides * 2; i++) {
      const angle = (i / (sides * 2)) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.45;
      const px = cx + Math.cos(angle) * rad;
      const py = cy + Math.sin(angle) * rad;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  },

  ink_splash: (ctx, w, h, t, color) => {
    const cx = w / 2, cy = h / 2;
    const arms = 16;
    const baseR = Math.min(w, h) * 0.35 * (1 + t * 0.6);
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < arms; i++) {
      const angle = (i / arms) * Math.PI * 2;
      const jitter = (Math.sin(i * 7.3) * 0.3 + 0.7);
      const r = baseR * jitter;
      const cp1x = cx + Math.cos(angle + 0.4) * r * 0.5;
      const cp1y = cy + Math.sin(angle + 0.4) * r * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cp1x, cp1y, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }
  }
};

const GENERATIVE_FX_IDS = new Set(Object.keys(SHAPE_RENDERERS));

let activeShotPool = [];
let gateState = { sub: false, low: false, mid: false, high: false };

export function fireGenerativeShot(targetId, bandKey, energy, gate, color) {
  if (!GENERATIVE_FX_IDS.has(targetId)) return;
  const wasOpen = gateState[bandKey];
  const isOpen = energy >= gate;
  if (isOpen && !wasOpen) {
    activeShotPool.push({
      id: Date.now() + Math.random(),
      targetId,
      color,
      startTime: performance.now(),
      duration: 1200
    });
  }
  gateState[bandKey] = isOpen;
}

export { GENERATIVE_FX_IDS };

export default function GenerativeShotOverlay({ isRunning }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isRunning) {
      activeShotPool = [];
      gateState = { sub: false, low: false, mid: false, high: false };
    }
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    let animId;

    const render = () => {
      animId = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const now = performance.now();
      activeShotPool = activeShotPool.filter(s => now - s.startTime < s.duration);
      for (const shot of activeShotPool) {
        const t = (now - shot.startTime) / shot.duration;
        const alpha = Math.pow(1 - t, 1.5);
        const renderer = SHAPE_RENDERERS[shot.targetId];
        if (!renderer) continue;
        ctx.save();
        ctx.globalAlpha = alpha;
        renderer(ctx, W, H, t, shot.color);
        ctx.restore();
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isRunning]);

  if (!isRunning) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 20
      }}
    />
  );
}
