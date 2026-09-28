import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { audioStore } from '../AudioStore';
import * as THREE from 'three';

export default function SacredFractals({ layerState }) {
  const groupRef = useRef();
  const innerRingRef = useRef();
  const centerCoreRef = useRef();
  const outerPetalsRef = useRef();
  const particlesRef = useRef();

  const paletteColors = useMemo(() => {
    const p = layerState?.palette?.colors || ['#00f0ff', '#ff007f', '#7928ca', '#ffe600'];
    return p.map(c => new THREE.Color(c));
  }, [layerState?.palette]);

  // Particle explosion ring
  const particleData = useMemo(() => {
    const count = 400;
    const pos = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 5 + Math.random() * 25;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.sin(angle) * r;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      velocities[i * 3] = Math.cos(angle) * (1 + Math.random() * 2);
      velocities[i * 3 + 1] = Math.sin(angle) * (1 + Math.random() * 2);
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return { pos, velocities, count };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const b = audioStore.bands;
    const mod = layerState.modMatrix;

    // Modulations
    const revSpin = audioStore.getModValue(mod, 'reverse_spin');
    const fwdSpin = audioStore.getModValue(mod, 'vortex_spin');
    const spinSpeed = (fwdSpin - revSpin) * 0.2 + (b.isActive ? 0.35 : 0.05);

    const shock = audioStore.getModValue(mod, 'shockwave') + b.kickOnset * 0.8;
    const wave = audioStore.getModValue(mod, 'wave_current');
    const colorCycle = audioStore.getModValue(mod, 'color_cycle');
    const strobe = audioStore.getModValue(mod, 'film_strobe');

    const subP = b.sub;
    const lowP = b.low;
    const midP = b.mid;
    const highP = b.high;

    // Outer group rotation and wave tilt
    groupRef.current.rotation.z += spinSpeed * delta;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.5) * (0.15 + wave * 0.4);
    groupRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 1.2) * (0.15 + wave * 0.4);

    // Dynamic Pulsing Scale (Kick & Sub punch)
    const baseScale = layerState.params?.sacredScale || 1.0;
    const pulseScale = baseScale * (1.0 + subP * 0.4 + shock * 0.5 + lowP * 0.2);
    groupRef.current.scale.lerp(new THREE.Vector3(pulseScale, pulseScale, pulseScale), 0.2);

    // Inner Ring counter-rotation
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= (spinSpeed * 1.4 + midP * 0.5) * delta;
      const innerScale = 1.0 + midP * 0.5 + wave * 0.3;
      innerRingRef.current.scale.set(innerScale, innerScale, innerScale);
    }

    // Center Core sphere pulse
    if (centerCoreRef.current) {
      const coreScale = 1.0 + subP * 1.2 + shock * 0.8;
      centerCoreRef.current.scale.lerp(new THREE.Vector3(coreScale, coreScale, coreScale), 0.25);
    }

    // Outer Petals expansion
    if (outerPetalsRef.current) {
      outerPetalsRef.current.rotation.z += (spinSpeed * 0.7 + highP * 0.3) * delta;
    }

    // Particle burst dynamics on kick drum
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleData.count; i++) {
        const idx = i * 3;
        positions[idx] += particleData.velocities[idx] * (0.1 + shock * 0.6);
        positions[idx + 1] += particleData.velocities[idx + 1] * (0.1 + shock * 0.6);
        positions[idx + 2] += particleData.velocities[idx + 2] * 0.1;

        const dist = Math.sqrt(positions[idx] * positions[idx] + positions[idx + 1] * positions[idx + 1]);
        if (dist > 45) {
          positions[idx] = (Math.random() - 0.5) * 6;
          positions[idx + 1] = (Math.random() - 0.5) * 6;
          positions[idx + 2] = (Math.random() - 0.5) * 4;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const c1 = paletteColors[0] || new THREE.Color('#00f0ff');
  const c2 = paletteColors[1] || new THREE.Color('#ff007f');
  const c3 = paletteColors[2] || new THREE.Color('#7928ca');
  const c4 = paletteColors[3] || new THREE.Color('#ffe600');

  return (
    <group ref={groupRef}>
      {/* 1. Center Pulsating Sacred Core */}
      <mesh ref={centerCoreRef}>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial 
          color={c2} 
          wireframe={true} 
          transparent={true} 
          opacity={0.85} 
        />
      </mesh>

      {/* 2. Concentric Flower of Life Torus Rings */}
      <group ref={outerPetalsRef}>
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const r = 9;
          return (
            <mesh 
              key={i} 
              position={[Math.cos(rad) * r, Math.sin(rad) * r, 0]}
              rotation={[0, 0, rad]}
            >
              <torusGeometry args={[9, 0.25, 16, 64]} />
              <meshBasicMaterial 
                color={i % 2 === 0 ? c1 : c3} 
                transparent={true} 
                opacity={0.75} 
              />
            </mesh>
          );
        })}
      </group>

      {/* 3. Middle Harmonic Metatron Ring */}
      <group ref={innerRingRef}>
        <mesh>
          <torusGeometry args={[16, 0.35, 16, 80]} />
          <meshBasicMaterial 
            color={c1} 
            transparent={true} 
            opacity={0.9} 
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <ringGeometry args={[18, 18.4, 8]} />
          <meshBasicMaterial 
            color={c4} 
            wireframe={true}
            transparent={true} 
            opacity={0.8} 
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 4. Outer Torus Knot Frame */}
      <mesh>
        <torusKnotGeometry args={[22, 0.4, 128, 32, 3, 4]} />
        <meshBasicMaterial 
          color={c3} 
          wireframe={true} 
          transparent={true} 
          opacity={0.65} 
        />
      </mesh>

      {/* 5. Stardust Particle Burst */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute 
            attach="attributes-position"
            count={particleData.count}
            array={particleData.pos}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial 
          size={1.2} 
          color={c1} 
          transparent 
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
