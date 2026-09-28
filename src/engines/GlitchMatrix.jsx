import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { audioStore } from '../AudioStore';
import * as THREE from 'three';

export default function GlitchMatrix({ layerState }) {
  const groupRef = useRef();
  const count = 48;

  const paletteColors = useMemo(() => {
    const p = layerState?.palette?.colors || ['#39ff14', '#00ff66', '#a6ff00', '#ffffff'];
    return p.map(c => new THREE.Color(c));
  }, [layerState?.palette]);

  // Cube columns array
  const columns = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: (i - count / 2) * 2.2,
      z: (Math.random() - 0.5) * 40,
      baseH: 2 + Math.random() * 8,
      speed: 0.5 + Math.random() * 1.5,
      offset: Math.random() * Math.PI * 2
    }));
  }, [count]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const b = audioStore.bands;
    const mod = layerState.modMatrix;
    const freq = audioStore.freqData;

    const shock = audioStore.getModValue(mod, 'shockwave') + b.kickOnset * 1.5;
    const strobe = audioStore.getModValue(mod, 'film_strobe') + b.snareOnset * 1.0;
    const speed = (layerState.params?.speed || 1.0) * 2;

    groupRef.current.rotation.y += (0.15 + b.mid * 0.2) * delta;

    groupRef.current.children.forEach((cube, i) => {
      if (cube.isMesh && columns[i]) {
        const col = columns[i];
        const freqIdx = Math.min(1023, Math.floor((i / count) * 400));
        const freqVal = freq ? (freq[freqIdx] || 0) / 255 : 0;

        const targetHeight = col.baseH + freqVal * (25 + b.sub * 20 + shock * 15);
        cube.scale.y = THREE.MathUtils.lerp(cube.scale.y, targetHeight, 0.25);

        // Glitch jitter on snare/hihat
        if (strobe > 0.3) {
          cube.position.x = col.x + (Math.random() - 0.5) * 0.8;
        } else {
          cube.position.x = col.x;
        }
      }
    });
  });

  const c1 = paletteColors[0] || new THREE.Color('#39ff14');
  const c2 = paletteColors[1] || new THREE.Color('#00ff66');

  return (
    <group ref={groupRef} position={[0, 0, -10]}>
      {columns.map((col, i) => (
        <mesh key={i} position={[col.x, 0, col.z]}>
          <boxGeometry args={[1.6, 1, 1.6]} />
          <meshBasicMaterial 
            color={i % 2 === 0 ? c1 : c2} 
            wireframe={i % 3 === 0} 
            transparent 
            opacity={0.85} 
          />
        </mesh>
      ))}
    </group>
  );
}
