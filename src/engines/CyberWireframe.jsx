import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { audioStore } from '../AudioStore';
import * as THREE from 'three';

export default function CyberWireframe({ layerState }) {
  const meshRef = useRef();
  const sunRef = useRef();

  const paletteColors = useMemo(() => {
    const p = layerState?.palette?.colors || ['#ff007f', '#00f0ff', '#7928ca', '#ffe600'];
    return p.map(c => new THREE.Color(c));
  }, [layerState?.palette]);

  // Create grid terrain plane
  const { geometry, cols, rows } = useMemo(() => {
    const c = 48;
    const r = 48;
    const geo = new THREE.PlaneGeometry(120, 120, c - 1, r - 1);
    return { geometry: geo, cols: c, rows: r };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const b = audioStore.bands;
    const mod = layerState.modMatrix;
    const freq = audioStore.freqData;

    const speed = (layerState.params?.speed || 1.0) * 1.5;
    const warpMod = audioStore.getModValue(mod, 'warp_tunnel') + b.kickOnset * 1.5;
    const shockMod = audioStore.getModValue(mod, 'shockwave');
    const waveMod = audioStore.getModValue(mod, 'wave_current');

    const pos = meshRef.current.geometry.attributes.position;
    const time = state.clock.elapsedTime * (1.5 + warpMod);

    for (let i = 0; i < pos.count; i++) {
      const colIdx = i % cols;
      const rowIdx = Math.floor(i / cols);

      // Distance from center line
      const normalizedCol = Math.abs(colIdx - (cols / 2)) / (cols / 2);
      
      // Map frequency data across columns
      const freqBin = Math.floor(normalizedCol * 120);
      const freqVal = freq ? (freq[freqBin] || 0) / 255 : 0;

      // Mountain elevation on edges, flat runway in center
      const mountainShape = Math.pow(normalizedCol, 1.8) * 18;
      const wave = Math.sin(rowIdx * 0.4 - time * 3) * (3 + waveMod * 6);
      const audioPulse = freqVal * (14 + b.sub * 16 + shockMod * 10);

      pos.setZ(i, (mountainShape + wave + audioPulse) * (b.isActive ? 1 : 0.2));
    }
    pos.needsUpdate = true;

    // Sun pulsation
    if (sunRef.current) {
      const sunScale = 1.0 + b.sub * 0.3 + shockMod * 0.4;
      sunRef.current.scale.set(sunScale, sunScale, 1);
    }
  });

  const c1 = paletteColors[0] || new THREE.Color('#ff007f');
  const c2 = paletteColors[1] || new THREE.Color('#00f0ff');
  const c3 = paletteColors[2] || new THREE.Color('#7928ca');

  return (
    <group position={[0, -12, -20]}>
      {/* 1. Neon Horizon Sun */}
      <mesh ref={sunRef} position={[0, 18, -60]}>
        <circleGeometry args={[14, 32]} />
        <meshBasicMaterial color={c1} wireframe={true} />
      </mesh>

      {/* 2. Cyber Terrain Grid */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2.3, 0, 0]}>
        <primitive object={geometry} />
        <meshBasicMaterial 
          color={c2} 
          wireframe={true} 
          transparent={true} 
          opacity={0.85} 
        />
      </mesh>
    </group>
  );
}
