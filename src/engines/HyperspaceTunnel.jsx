import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { audioStore } from '../AudioStore';
import * as THREE from 'three';

export default function HyperspaceTunnel({ layerState }) {
  const groupRef = useRef();
  const ringCount = 32;

  const paletteColors = useMemo(() => {
    const p = layerState?.palette?.colors || ['#8b5cf6', '#06b6d4', '#ec4899', '#3b82f6'];
    return p.map(c => new THREE.Color(c));
  }, [layerState?.palette]);

  // Rings array along Z axis
  const rings = useMemo(() => {
    return Array.from({ length: ringCount }, (_, i) => ({
      z: -i * 12,
      rotationOffset: (i * Math.PI) / 8,
      sides: 6 + (i % 3) * 2
    }));
  }, [ringCount]);

  // Warp lines rushing towards camera
  const speedLines = useMemo(() => {
    const lineCount = 120;
    const pos = new Float32Array(lineCount * 6);
    for (let i = 0; i < lineCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 18;
      const zStart = -Math.random() * 300;
      const zLen = 20 + Math.random() * 40;
      const idx = i * 6;
      pos[idx] = Math.cos(angle) * r;
      pos[idx + 1] = Math.sin(angle) * r;
      pos[idx + 2] = zStart;
      pos[idx + 3] = Math.cos(angle) * r;
      pos[idx + 4] = Math.sin(angle) * r;
      pos[idx + 5] = zStart + zLen;
    }
    return { pos, lineCount };
  }, []);

  const linesRef = useRef();

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const b = audioStore.bands;
    const mod = layerState.modMatrix;

    const warpMod = audioStore.getModValue(mod, 'warp_tunnel');
    const shockMod = audioStore.getModValue(mod, 'shockwave');
    const spinMod = audioStore.getModValue(mod, 'vortex_spin') - audioStore.getModValue(mod, 'reverse_spin');

    const baseSpeed = (layerState.params?.tunnelSpeed || 1.0) * 40;
    const currentSpeed = baseSpeed + (warpMod * 250); // huge speed jump when warped

    // Group twist rotation
    groupRef.current.rotation.z += (0.1 + spinMod * 2.0) * delta;

    // Move children rings
    groupRef.current.children.forEach((child, i) => {
      if (child.isMesh) {
        child.position.z += currentSpeed * delta;
        if (child.position.z > 30) {
          child.position.z -= ringCount * 12;
        }

        // Expansion strictly on shockMod
        const scale = 1.0 + (shockMod * 3.5) + (Math.sin(state.clock.elapsedTime * 4 + i) * 0.05);
        child.scale.lerp(new THREE.Vector3(scale, scale, 1), 0.2);
      }
    });

    // Animate speed lines
    if (linesRef.current) {
      const positions = linesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < speedLines.lineCount; i++) {
        const idx = i * 6;
        positions[idx + 2] += currentSpeed * 1.5 * delta;
        positions[idx + 5] += currentSpeed * 1.5 * delta;
        if (positions[idx + 2] > 30) {
          positions[idx + 2] -= 320;
          positions[idx + 5] -= 320;
        }
      }
      linesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const c1 = paletteColors[0] || new THREE.Color('#8b5cf6');
  const c2 = paletteColors[1] || new THREE.Color('#06b6d4');
  const c3 = paletteColors[2] || new THREE.Color('#ec4899');

  return (
    <group ref={groupRef}>
      {/* 1. Nested Hexagonal / Octagonal Tunnel Rings */}
      {rings.map((ring, i) => (
        <mesh 
          key={i} 
          position={[0, 0, ring.z]} 
          rotation={[0, 0, ring.rotationOffset]}
        >
          <ringGeometry args={[12 + (i % 2) * 2, 12.6 + (i % 2) * 2, ring.sides]} />
          <meshBasicMaterial 
            color={i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3} 
            transparent 
            opacity={0.85} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      ))}

      {/* 2. Outer Wireframe Tunnel Cylinder */}
      <mesh position={[0, 0, -100]}>
        <cylinderGeometry args={[18, 18, 300, 16, 30, true]} />
        <meshBasicMaterial 
          color={c1} 
          wireframe={true} 
          transparent 
          opacity={0.3} 
          side={THREE.BackSide} 
        />
      </mesh>

      {/* 3. Hyperspace Warp Speed Lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute 
            attach="attributes-position"
            count={speedLines.lineCount * 2}
            array={speedLines.pos}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={c2} transparent opacity={0.7} />
      </lineSegments>
    </group>
  );
}
