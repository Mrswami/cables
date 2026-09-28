import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { audioStore } from '../AudioStore';

export default function CyberWireframe({ layerState }) {
  const meshRef = useRef();
  const matRef = useRef();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    // Strictly STILL by default
    const warpMod = audioStore.getModValue(layerState.modMatrix, 'warp_tunnel');
    const shockMod = audioStore.getModValue(layerState.modMatrix, 'shockwave');
    const speed = layerState.params?.speed || 0;
    
    const isActivelyDriven = warpMod > 0.02 || shockMod > 0.02 || audioStore.bands.low > 0.02 || (audioStore.bands.isActive && speed > 0);
    
    meshRef.current.rotation.x = -Math.PI / 2.5; // isometric angle
    meshRef.current.rotation.z += audioStore.bands.isActive ? speed * delta : 0;
    
    // Scale & deform
    const targetScale = isActivelyDriven ? (1 + shockMod * 0.4 + audioStore.bands.low * 0.2) : 0.001;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);

    if (matRef.current) {
      matRef.current.opacity = isActivelyDriven ? Math.min(1.0, 0.2 + shockMod * 0.4 + audioStore.bands.low * 0.4) : 0.0;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -10, 0]} scale={[0.001, 0.001, 0.001]}>
      <planeGeometry args={[100, 100, 32, 32]} />
      <meshStandardMaterial 
        ref={matRef}
        color="#ff0055" 
        wireframe={true} 
        transparent={true}
        opacity={0.0}
      />
    </mesh>
  );
}
