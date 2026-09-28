import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { audioStore } from '../AudioStore';
import * as THREE from 'three';

export default function HyperspaceTunnel({ layerState }) {
  const meshRef = useRef();
  const matRef = useRef();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Evaluate modulations
    const warpMod = audioStore.getModValue(layerState.modMatrix, 'warp_tunnel');
    const speed = layerState.params?.tunnelSpeed || 0;
    const isActivelyDriven = warpMod > 0.02 || (audioStore.bands.isActive && speed > 0);
    
    // Motion
    meshRef.current.rotation.z += audioStore.bands.isActive ? speed * delta + warpMod * 0.1 : 0;
    meshRef.current.position.z = (meshRef.current.position.z + (warpMod * 10) + speed) % 50;

    // Visibility & Scale
    const targetScale = isActivelyDriven ? 1.0 : 0.001;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    
    if (matRef.current) {
      matRef.current.opacity = isActivelyDriven ? Math.min(1.0, 0.2 + warpMod * 0.4) : 0.0;
    }
  });

  return (
    <mesh ref={meshRef} scale={[0.001, 0.001, 0.001]}>
      <cylinderGeometry args={[10, 10, 100, 32, 1, true]} />
      <meshStandardMaterial 
        ref={matRef}
        color="#8b5cf6" 
        wireframe={true} 
        transparent={true}
        opacity={0.0}
        side={THREE.BackSide} 
      />
    </mesh>
  );
}
