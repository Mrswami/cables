import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import { audioStore } from './AudioStore';
import * as THREE from 'three';
import SacredFractals from './engines/SacredFractals';
import HyperspaceTunnel from './engines/HyperspaceTunnel';
import ParticleSwarm from './engines/ParticleSwarm';
import CyberWireframe from './engines/CyberWireframe';
import VectorOscilloscope from './engines/VectorOscilloscope';
import GlitchMatrix from './engines/GlitchMatrix';

// Audio updater runs every frame to sync the AudioStore
function AudioUpdater() {
  useFrame(() => {
    audioStore.updateBands();
  });
  return null;
}

// Global FX Rig: Applies routed Matrix effects to camera, lighting, laser beams, geo bursts, and digital grid
function GlobalFXRig({ layers }) {
  const { camera } = useThree();
  const lightRef = useRef();
  const ambientRef = useRef();
  const lasersRef = useRef();
  const geoRef = useRef();
  const gridRef = useRef();

  const activeLayer = layers[0] || {};
  const modMatrix = activeLayer.modMatrix;
  const palette = activeLayer.palette;
  const params = activeLayer.params || {};

  const laserCount = params.laserCount || 24;
  const geoShapeKey = params.geoBurstShape || 'icosahedron';
  const gridStyleKey = params.gridStyle || 'floor_ceiling';

  const laserBeams = useMemo(() => {
    const count = laserCount;
    const pos = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const idx = i * 6;
      pos[idx] = 0;
      pos[idx + 1] = 0;
      pos[idx + 2] = 0;
      pos[idx + 3] = Math.cos(angle) * 60;
      pos[idx + 4] = Math.sin(angle) * 60;
      pos[idx + 5] = (Math.random() - 0.5) * 20;
    }
    return { pos, count };
  }, [laserCount]);

  const baseColors = useMemo(() => {
    const p = palette?.colors || ['#00f0ff', '#ff007f', '#7928ca', '#ffe600'];
    return p.map(c => new THREE.Color(c));
  }, [palette]);

  useFrame((state, delta) => {
    if (!modMatrix) return;

    const shock = audioStore.getModValue(modMatrix, 'shockwave');
    const warp = audioStore.getModValue(modMatrix, 'warp_tunnel');
    const strobe = audioStore.getModValue(modMatrix, 'film_strobe');
    const lasers = audioStore.getModValue(modMatrix, 'laser_beams');
    const colorCycle = audioStore.getModValue(modMatrix, 'color_cycle');
    const geoBurst = audioStore.getModValue(modMatrix, 'geo_burst');
    const digitalGrid = audioStore.getModValue(modMatrix, 'digital_grid');

    // 1. Camera Shockwave & Warp Dynamics
    const targetZ = 50 + shock * 12 - warp * 15;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.2);
    if (shock > 0.1) {
      camera.position.x = (Math.random() - 0.5) * shock * 1.5;
      camera.position.y = (Math.random() - 0.5) * shock * 1.5;
    } else {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.1);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 0.1);
    }

    // 2. Film Strobe & Dynamic Lighting Flash
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.5 + strobe * 3.5;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1.0 + strobe * 5.0;
      if (colorCycle > 0.05) {
        const hue = (state.clock.elapsedTime * 0.5 * colorCycle) % 1;
        lightRef.current.color.setHSL(hue, 1.0, 0.6);
      } else {
        lightRef.current.color.set(baseColors[0] || '#ffffff');
      }
    }

    // 3. Starburst Laser Beams
    if (lasersRef.current) {
      const isLasersActive = lasers > 0.02;
      lasersRef.current.visible = isLasersActive;
      if (isLasersActive) {
        lasersRef.current.rotation.z += (1.5 + lasers * 2.0) * delta;
        const s = 1.0 + lasers * 0.8;
        lasersRef.current.scale.set(s, s, s);
      }
    }

    // 4. Geo Burst (Generative Geometry)
    if (geoRef.current) {
      const isGeo = geoBurst > 0.05;
      geoRef.current.visible = isGeo;
      if (isGeo) {
        geoRef.current.rotation.x += delta * (1.0 + geoBurst * 2.0);
        geoRef.current.rotation.y += delta * (1.5 + geoBurst * 3.0);
        const gs = 1.0 + geoBurst * 3.5;
        geoRef.current.scale.set(gs, gs, gs);
      }
    }

    // 5. Digital Grid Overlay (Holographic Floor/Ceiling/Cube)
    if (gridRef.current) {
      const isGrid = digitalGrid > 0.05;
      gridRef.current.visible = isGrid;
      if (isGrid) {
        gridRef.current.position.z = (state.clock.elapsedTime * 30 * (1 + digitalGrid)) % 20;
        
        if (digitalGrid > 0.6) {
          gridRef.current.position.y = -15 + (Math.random() - 0.5) * digitalGrid * 3;
        } else {
          gridRef.current.position.y = THREE.MathUtils.lerp(gridRef.current.position.y, -15, 0.2);
        }
      }
    }
  });

  const c1 = baseColors[0] || new THREE.Color('#00f0ff');
  const c2 = baseColors[1] || new THREE.Color('#ff007f');
  const c3 = baseColors[2] || new THREE.Color('#7928ca');
  const c4 = baseColors[3] || new THREE.Color('#ffe600');

  // Dynamic Geo Burst Mesh renderer
  const renderGeoMesh = (pos, size, color) => {
    switch (geoShapeKey) {
      case 'octahedron':
        return (
          <mesh position={pos}>
            <octahedronGeometry args={[size, 0]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      case 'dodecahedron':
        return (
          <mesh position={pos}>
            <dodecahedronGeometry args={[size, 0]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      case 'torusKnot':
        return (
          <mesh position={pos}>
            <torusKnotGeometry args={[size * 0.7, 0.3, 64, 16]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      case 'tetrahedron':
        return (
          <mesh position={pos}>
            <tetrahedronGeometry args={[size, 0]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      case 'icosahedron':
      default:
        return (
          <mesh position={pos}>
            <icosahedronGeometry args={[size, 0]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </mesh>
        );
    }
  };

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.5} />
      <pointLight ref={lightRef} position={[10, 10, 20]} intensity={1} />

      {/* Starburst Laser Rays (Triggered when laser_beams is routed) */}
      <lineSegments ref={lasersRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute 
            attach="attributes-position"
            count={laserBeams.count * 2}
            array={laserBeams.pos}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color={c2} 
          linewidth={2} 
          transparent 
          opacity={0.85} 
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Generative Geo Burst */}
      <group ref={geoRef} visible={false}>
        {renderGeoMesh([12, 8, -15], 4, c1)}
        {renderGeoMesh([-12, -8, -10], 5, c3)}
        {renderGeoMesh([0, 0, -5], 3, c4)}
      </group>

      {/* Digital Grid Overlay */}
      <group ref={gridRef} visible={false} position={[0, -15, 0]}>
        <gridHelper args={[300, 40, c2, c2]} />
        {(gridStyleKey === 'floor_ceiling' || gridStyleKey === 'grid_cube') && (
          <gridHelper args={[300, 40, c2, c2]} position={[0, 30, 0]} />
        )}
      </group>
    </>
  );
}

function LayerRenderer({ layer, index }) {
  const kaleido = audioStore.getModValue(layer.modMatrix, 'kaleido_facets');
  const isKaleido = kaleido > 0.05;

  const renderEngine = (rotZ = 0) => {
    switch (layer.engine) {
      case 'sacred': return <SacredFractals layerState={layer} index={index} />;
      case 'tunnel': return <HyperspaceTunnel layerState={layer} index={index} />;
      case 'particles': return <ParticleSwarm layerState={layer} index={index} />;
      case 'wireframe': return <CyberWireframe layerState={layer} index={index} />;
      case 'bars': return <VectorOscilloscope layerState={layer} index={index} />;
      case 'cyber': return <GlitchMatrix layerState={layer} index={index} />;
      default: return null;
    }
  };

  if (isKaleido) {
    return (
      <group>
        <group rotation={[0, 0, 0]}>{renderEngine(0)}</group>
        <group rotation={[0, 0, (Math.PI * 2) / 3]}>{renderEngine((Math.PI * 2) / 3)}</group>
        <group rotation={[0, 0, (Math.PI * 4) / 3]}>{renderEngine((Math.PI * 4) / 3)}</group>
      </group>
    );
  }

  return renderEngine(0);
}

export default function VisualizerCanvas({ layers, masterParams }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 50], fov: 75 }}
      style={{ width: '100%', height: '100%', background: '#050508' }}
    >
      <AudioUpdater />
      <GlobalFXRig layers={layers} />
      
      {layers.map((layer, i) => (
        <LayerRenderer key={layer.id || i} layer={layer} index={i} />
      ))}

      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.2} 
          luminanceSmoothing={0.9} 
          intensity={masterParams?.bloom ? masterParams.bloom / 100 : 0.6} 
        />
        {masterParams?.grain > 0 && (
          <Noise opacity={masterParams.grain / 100} />
        )}
      </EffectComposer>
    </Canvas>
  );
}
