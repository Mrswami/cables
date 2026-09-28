import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { audioStore } from '../AudioStore';

export default function VectorOscilloscope({ layerState }) {
  const lineRef = useRef();
  const matRef = useRef();

  useFrame((state) => {
    if (!lineRef.current) return;
    
    const isActivelyDriven = audioStore.bands.peak > 0.02 || audioStore.bands.high > 0.02;
    const targetScaleY = isActivelyDriven ? (1 + audioStore.bands.peak * 2) : 0.001;
    const targetScaleX = isActivelyDriven ? 1.0 : 0.001;
    lineRef.current.scale.set(targetScaleX, targetScaleY, targetScaleX);

    if (matRef.current) {
      matRef.current.opacity = isActivelyDriven ? 0.8 : 0.0;
    }
  });

  return (
    <mesh ref={lineRef} scale={[0.001, 0.001, 0.001]}>
      <boxGeometry args={[40, 0.5, 0.5]} />
      <meshBasicMaterial 
        ref={matRef} 
        color="#ffffff" 
        transparent={true} 
        opacity={0.0} 
      />
    </mesh>
  );
}
