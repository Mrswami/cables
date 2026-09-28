import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { audioStore } from '../AudioStore';
import * as THREE from 'three';

export default function SacredFractals({ layerState, index }) {
  const groupRef = useRef();
  
  // Default values should be completely STILL and MINIMAL per the user's request.
  // Mod matrix adds life to it.
  
  const outerMatRef = useRef();
  const innerMatRef = useRef();
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Evaluate modulations
    const revSpin = audioStore.getModValue(layerState.modMatrix, 'reverse_spin');
    const fwdSpin = audioStore.getModValue(layerState.modMatrix, 'vortex_spin');
    const spinDelta = (fwdSpin - revSpin) * 0.15;
    
    const shockMod = audioStore.getModValue(layerState.modMatrix, 'shockwave');
    const waveMod = audioStore.getModValue(layerState.modMatrix, 'wave_current');
    
    const speed = layerState.params?.speed || 0; 
    
    // Total visual activity driven strictly by assigned FX and EQ gain
    const activity = shockMod + Math.abs(spinDelta) * 5 + waveMod + audioStore.bands.sub + audioStore.bands.low + audioStore.bands.mid + audioStore.bands.high;
    const isActivelyDriven = activity > 0.02;
    
    // Rotation
    groupRef.current.rotation.z += spinDelta + (audioStore.bands.isActive ? speed * delta : 0);
    if (waveMod > 0) {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * waveMod * 0.2;
    }
    
    // Scale: dormant (0.001) if untouched, scales up smoothly as user turns gain/FX up
    const baseScale = layerState.params?.sacredScale || 1.0;
    const targetScale = isActivelyDriven ? (baseScale + shockMod * 0.6 + audioStore.bands.sub * 0.3) : 0.001;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);

    // Opacity
    if (outerMatRef.current) {
      outerMatRef.current.opacity = isActivelyDriven ? Math.min(0.9, 0.2 + activity * 0.5) : 0.0;
    }
    if (innerMatRef.current) {
      innerMatRef.current.opacity = isActivelyDriven ? Math.min(1.0, 0.3 + activity * 0.6) : 0.0;
    }
  });

  return (
    <group ref={groupRef} scale={[0.001, 0.001, 0.001]}>
      {/* 3D Representation of Sacred Fractals */}
      <mesh>
        <torusKnotGeometry args={[15, 0.5, 128, 32, 2, 3]} />
        <meshBasicMaterial 
          ref={outerMatRef}
          color="#00ffff" 
          wireframe={true} 
          transparent={true} 
          opacity={0.0} 
        />
      </mesh>
      
      {/* Inner Ring */}
      <mesh>
        <torusGeometry args={[8, 0.2, 16, 64]} />
        <meshBasicMaterial 
          ref={innerMatRef}
          color="#ff00ff" 
          transparent={true}
          opacity={0.0}
        />
      </mesh>
    </group>
  );
}
