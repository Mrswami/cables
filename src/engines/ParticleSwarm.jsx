import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { audioStore } from '../AudioStore';
import * as THREE from 'three';

const GEOMETRIES = {
  spheres: new THREE.SphereGeometry(0.8, 12, 12),
  cubes: new THREE.BoxGeometry(1.2, 1.2, 1.2),
  tetrahedrons: new THREE.TetrahedronGeometry(1.2, 0),
  rings: new THREE.TorusGeometry(0.9, 0.3, 8, 16),
  dodecahedrons: new THREE.DodecahedronGeometry(1.0, 0),
  icosahedrons: new THREE.IcosahedronGeometry(1.0, 0)
};

export default function ParticleSwarm({ layerState }) {
  const instancedRef = useRef();
  const coreRef = useRef();
  const particleCount = Math.min(2000, layerState?.params?.particleCount || 1000);

  const activeShapeKey = layerState?.params?.particleShape || 'spheres';

  const paletteColors = useMemo(() => {
    const p = layerState?.palette?.colors || ['#00ffcc', '#3b82f6', '#8b5cf6', '#ec4899'];
    return p.map(c => new THREE.Color(c));
  }, [layerState?.palette]);

  // Generate baseline particle positions, base rotations, velocities, and color assignments
  const particles = useMemo(() => {
    const data = [];
    const pColors = paletteColors;

    for (let i = 0; i < particleCount; i++) {
      // Logarithmic spiral galaxy distribution with height variation
      const theta = Math.random() * Math.PI * 4;
      const r = 4 + Math.pow(Math.random(), 0.7) * 45;
      const x = Math.cos(theta) * r + (Math.random() - 0.5) * 6;
      const y = Math.sin(theta) * r + (Math.random() - 0.5) * 6;
      const z = (Math.random() - 0.5) * 25;

      const rot = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      const rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 2.5
      );

      const color = pColors[i % pColors.length].clone();
      const baseScale = 0.6 + Math.random() * 1.2;

      data.push({
        basePos: new THREE.Vector3(x, y, z),
        currentPos: new THREE.Vector3(x, y, z),
        rot,
        rotSpeed,
        color,
        baseScale,
        dist: Math.sqrt(x * x + y * y),
        phase: Math.random() * Math.PI * 2
      });
    }
    return data;
  }, [paletteColors, particleCount]);

  // Re-geometry buffer assignment
  const activeGeometry = useMemo(() => {
    return GEOMETRIES[activeShapeKey] || GEOMETRIES.spheres;
  }, [activeShapeKey]);

  // Initialize colors on instanced mesh
  useEffect(() => {
    if (!instancedRef.current) return;
    const mesh = instancedRef.current;
    particles.forEach((p, i) => {
      mesh.setColorAt(i, p.color);
    });
    mesh.instanceColor.needsUpdate = true;
  }, [particles, activeGeometry]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame((state, delta) => {
    if (!instancedRef.current) return;

    const b = audioStore.bands;
    const mod = layerState?.modMatrix;

    // Mod Matrix evaluation for particle properties
    const massMod = audioStore.getModValue(mod, 'particle_mass') + b.kickOnset * 1.2;
    const shockMod = audioStore.getModValue(mod, 'shockwave');
    const shapeMorph = audioStore.getModValue(mod, 'particle_shape_morph');
    const sizeMod = audioStore.getModValue(mod, 'particle_size');
    const speedMod = audioStore.getModValue(mod, 'particle_speed');
    const turbMod = audioStore.getModValue(mod, 'particle_turbulence');

    const baseSwirl = layerState?.params?.particleSwirl ?? 1.0;
    const baseSize = layerState?.params?.particleSize ?? 2.0;
    const baseTurb = layerState?.params?.particleTurbulence ?? 0.5;

    const swirlSpeed = (baseSwirl * 0.4 + speedMod * 0.5 + b.mid * 0.3);

    // Galaxy spin
    instancedRef.current.rotation.z += swirlSpeed * delta;
    instancedRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6) * 0.25;

    const time = state.clock.elapsedTime * 2;
    const mesh = instancedRef.current;

    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      const bx = p.basePos.x;
      const by = p.basePos.y;
      const bz = p.basePos.z;

      // Audio reactive wave ripples outwards
      const wave = Math.sin(p.dist * 0.4 - time + p.phase) * (b.sub * 6 + shockMod * 8);

      // Noise turbulence jitter
      const turbX = Math.sin(time * 2 + p.dist) * (baseTurb + turbMod * 2);
      const turbY = Math.cos(time * 2.2 + p.dist) * (baseTurb + turbMod * 2);

      p.currentPos.x = bx * (1 + b.low * 0.25 + massMod * 0.35) + Math.cos(time + p.dist) * wave * 0.25 + turbX;
      p.currentPos.y = by * (1 + b.low * 0.25 + massMod * 0.35) + Math.sin(time + p.dist) * wave * 0.25 + turbY;
      p.currentPos.z = bz + wave * 1.5;

      // Rotate particle 3D geometry individually
      p.rot.x += p.rotSpeed.x * delta * (1 + speedMod);
      p.rot.y += p.rotSpeed.y * delta * (1 + speedMod);
      p.rot.z += p.rotSpeed.z * delta * (1 + speedMod);

      dummy.position.copy(p.currentPos);
      dummy.rotation.copy(p.rot);

      // Scale particle based on shape morphing & kick transients
      const shapeMorphFactor = 1.0 + Math.sin(time * 4 + shapeMorph * 5) * 0.3 * shapeMorph;
      const finalScale = p.baseScale * (baseSize / 2.0) * (1 + b.sub * 0.6 + sizeMod * 0.8) * shapeMorphFactor;
      dummy.scale.set(finalScale, finalScale, finalScale);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    // Pulsating Gravitational Core
    if (coreRef.current) {
      const coreScale = 3.5 + b.sub * 4.0 + massMod * 3.0;
      coreRef.current.scale.set(coreScale, coreScale, coreScale);
      coreRef.current.rotation.y += delta * 0.8;
      coreRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group>
      <instancedMesh
        ref={instancedRef}
        args={[activeGeometry, null, particleCount]}
      >
        <meshStandardMaterial
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* Center gravitational singularity core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          color={paletteColors[0] || '#00ffcc'}
          wireframe
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
