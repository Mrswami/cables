import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { audioStore } from '../AudioStore';
import * as THREE from 'three';

export default function VectorOscilloscope({ layerState }) {
  const lineRef = useRef();
  const ringRef = useRef();
  const pointCount = 256;

  const paletteColors = useMemo(() => {
    const p = layerState?.palette?.colors || ['#ff4d00', '#ff9900', '#ffcc00', '#ff0055'];
    return p.map(c => new THREE.Color(c));
  }, [layerState?.palette]);

  const { lineGeo, ringGeo } = useMemo(() => {
    const lPos = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i++) {
      lPos[i * 3] = (i - pointCount / 2) * 0.35;
      lPos[i * 3 + 1] = 0;
      lPos[i * 3 + 2] = 0;
    }
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));

    const rPos = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2;
      rPos[i * 3] = Math.cos(angle) * 16;
      rPos[i * 3 + 1] = Math.sin(angle) * 16;
      rPos[i * 3 + 2] = 0;
    }
    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));

    return { lineGeo: lGeo, ringGeo: rGeo };
  }, [pointCount]);

  useFrame((state, delta) => {
    const mod = layerState.modMatrix;
    const wave = audioStore.waveData;

    const waveMod = audioStore.getModValue(mod, 'wave_current');
    const shockMod = audioStore.getModValue(mod, 'shockwave');

    // Update horizontal oscilloscope line with raw waveform
    if (lineRef.current && wave && wave.length > 0) {
      const positions = lineRef.current.geometry.attributes.position.array;
      const step = Math.floor(wave.length / pointCount);
      for (let i = 0; i < pointCount; i++) {
        const byteVal = wave[i * step] || 128;
        const norm = (byteVal - 128) / 128; // -1 to 1
        // Only show waveform amplitude if waveMod is active
        positions[i * 3 + 1] = norm * (waveMod * 30.0);
      }
      lineRef.current.geometry.attributes.position.needsUpdate = true;
      lineRef.current.rotation.z += 0.2 * delta;
    }

    // Update circular oscilloscope ring
    if (ringRef.current && wave && wave.length > 0) {
      const positions = ringRef.current.geometry.attributes.position.array;
      const step = Math.floor(wave.length / pointCount);
      for (let i = 0; i < pointCount; i++) {
        const angle = (i / pointCount) * Math.PI * 2;
        const byteVal = wave[i * step] || 128;
        const norm = (byteVal - 128) / 128;
        // Ring distortion only on shockMod
        const radius = 16 + norm * (shockMod * 40.0);
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
        positions[i * 3 + 2] = Math.sin(angle * 4 + state.clock.elapsedTime * 3) * (shockMod * 5.0);
      }
      ringRef.current.geometry.attributes.position.needsUpdate = true;
      ringRef.current.rotation.z -= 0.4 * delta;
    }
  });

  const c1 = paletteColors[0] || new THREE.Color('#ff4d00');
  const c2 = paletteColors[1] || new THREE.Color('#ffcc00');

  return (
    <group>
      {/* 1. Horizontal Vector Waveform */}
      <line ref={lineRef} geometry={lineGeo}>
        <lineBasicMaterial color={c1} linewidth={2} />
      </line>

      {/* 2. Circular Lissajous Vector Ring */}
      <lineLoop ref={ringRef} geometry={ringGeo}>
        <lineBasicMaterial color={c2} linewidth={3} />
      </lineLoop>
    </group>
  );
}
