import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { audioStore } from '../AudioStore';
import * as THREE from 'three';

export default function ParticleSwarm({ layerState }) {
  const pointsRef = useRef();
  
  const particleCount = 800; // Minimal default
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 100;
    }
    return pos;
  }, []);

  const matRef = useRef();

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const massMod = audioStore.getModValue(layerState.modMatrix, 'particle_mass');
    const vortexSpeed = layerState.params?.particleSwirl || 0;
    const isActivelyDriven = massMod > 0.02 || audioStore.bands.low > 0.02 || (audioStore.bands.isActive && vortexSpeed > 0);
    
    // Rotation stays completely still unless there is audio
    pointsRef.current.rotation.y += audioStore.bands.isActive ? vortexSpeed * delta + massMod * 0.05 : 0;
    
    // Pulse on kick (low bands)
    const targetScale = isActivelyDriven ? (1 + audioStore.bands.low * 0.5 + massMod * 0.3) : 0.001;
    pointsRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);

    if (matRef.current) {
      matRef.current.opacity = isActivelyDriven ? Math.min(0.9, 0.2 + massMod * 0.4 + audioStore.bands.low * 0.4) : 0.0;
    }
  });

  return (
    <points ref={pointsRef} scale={[0.001, 0.001, 0.001]}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        ref={matRef}
        size={0.5} 
        color="#00ffcc" 
        transparent 
        opacity={0.0}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
