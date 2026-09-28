import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Glitch, Noise } from '@react-three/postprocessing';
import { audioStore } from './AudioStore';
import SacredFractals from './engines/SacredFractals';
import HyperspaceTunnel from './engines/HyperspaceTunnel';
import ParticleSwarm from './engines/ParticleSwarm';
import CyberWireframe from './engines/CyberWireframe';
import VectorOscilloscope from './engines/VectorOscilloscope';

// The Audio updater runs every frame to sync the AudioStore
function AudioUpdater() {
  useFrame(() => {
    audioStore.updateBands();
  });
  return null;
}

function LayerRenderer({ layer, index }) {
  // Select engine based on layer.engine
  switch (layer.engine) {
    case 'sacred': return <SacredFractals layerState={layer} index={index} />;
    case 'tunnel': return <HyperspaceTunnel layerState={layer} index={index} />;
    case 'particles': return <ParticleSwarm layerState={layer} index={index} />;
    case 'wireframe': return <CyberWireframe layerState={layer} index={index} />;
    case 'bars': return <VectorOscilloscope layerState={layer} index={index} />;
    case 'cyber': return null; // Pending GlitchMatrix
    default: return null;
  }
}

export default function VisualizerCanvas({ layers, masterParams }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 50], fov: 75 }}
      style={{ width: '100%', height: '100%', background: '#050508' }}
    >
      <AudioUpdater />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {layers.map((layer, i) => (
        <LayerRenderer key={layer.id || i} layer={layer} index={i} />
      ))}

      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.2} 
          luminanceSmoothing={0.9} 
          intensity={masterParams?.bloom ? masterParams.bloom / 100 : 0} 
        />
        {masterParams?.grain > 0 && (
          <Noise opacity={masterParams.grain / 100} />
        )}
      </EffectComposer>
    </Canvas>
  );
}
