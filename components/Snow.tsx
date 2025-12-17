import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================
// SIMPLE STARFIELD (visible from all angles)
// ============================================

interface StarFieldProps {
  count?: number;
  radius?: number;
}

export const StarField: React.FC<StarFieldProps> = ({
  count = 2000,
  radius = 100,
}) => {
  const meshRef = useRef<THREE.Points>(null);

  // Generate star positions on a full sphere above horizon
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Full sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.8 + Math.random() * 0.2);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = Math.abs(r * Math.cos(phi)) + 5; // Keep above horizon
      const z = r * Math.sin(phi) * Math.sin(theta);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }

    return pos;
  }, [count, radius]);

  // Gentle twinkle animation
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.75 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        color="#ffffff"
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// ============================================
// MOON (billboard - always faces camera)
// ============================================

interface MoonProps {
  position?: [number, number, number];
  size?: number;
}

export const Moon: React.FC<MoonProps> = ({
  position = [40, 35, -60],
  size = 8,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Make moon always face the camera
  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* Main moon disc */}
        <mesh>
          <circleGeometry args={[size, 64]} />
          <meshBasicMaterial
            color="#fffde8"
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Moon glow */}
        <mesh position={[0, 0, -0.1]}>
          <circleGeometry args={[size * 1.4, 64]} />
          <meshBasicMaterial
            color="#fffde8"
            transparent
            opacity={0.2}
          />
        </mesh>

        {/* Outer glow */}
        <mesh position={[0, 0, -0.2]}>
          <circleGeometry args={[size * 2, 64]} />
          <meshBasicMaterial
            color="#ffeedd"
            transparent
            opacity={0.1}
          />
        </mesh>
      </group>

      {/* Moon light source */}
      <pointLight
        color="#fff8e0"
        intensity={0.6}
        distance={200}
      />
    </group>
  );
};

// ============================================
// SNOW PARTICLES
// ============================================

interface SnowProps {
  count?: number;
  intensity?: number; // 0-1
  area?: number;
  speed?: number;
}

export const Snow: React.FC<SnowProps> = ({
  count = 1000,
  intensity = 0.5,
  area = 20,
  speed = 1,
}) => {
  const meshRef = useRef<THREE.Points>(null);

  // Adjust count based on intensity
  const particleCount = Math.floor(count * intensity);

  // Create particle positions
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Random position in a box
      positions[i * 3] = (Math.random() - 0.5) * area;
      positions[i * 3 + 1] = Math.random() * 15; // Height
      positions[i * 3 + 2] = (Math.random() - 0.5) * area;

      // Random fall speed
      velocities[i] = 0.5 + Math.random() * 1.5;

      // Random size
      sizes[i] = 0.02 + Math.random() * 0.04;
    }

    return { positions, velocities, sizes };
  }, [particleCount, area]);

  // Animate snow falling
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      // Fall down
      positions[i * 3 + 1] -= particles.velocities[i] * delta * speed;

      // Slight horizontal drift
      const time = state.clock.elapsedTime;
      positions[i * 3] += Math.sin(time + i) * 0.002;
      positions[i * 3 + 2] += Math.cos(time + i * 0.5) * 0.002;

      // Reset when below ground
      if (positions[i * 3 + 1] < -2) {
        positions[i * 3 + 1] = 12 + Math.random() * 3;
        positions[i * 3] = (Math.random() - 0.5) * area;
        positions[i * 3 + 2] = (Math.random() - 0.5) * area;
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (particleCount === 0) return null;

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Ambient floating particles (dust/magic)
interface AmbientParticlesProps {
  count?: number;
  color?: string;
  area?: number;
}

export const AmbientParticles: React.FC<AmbientParticlesProps> = ({
  count = 100,
  color = '#ffffff',
  area = 15,
}) => {
  const meshRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * area;
      positions[i * 3 + 1] = Math.random() * 8 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * area;
      speeds[i] = 0.2 + Math.random() * 0.3;
    }

    return { positions, speeds };
  }, [count, area]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const speed = particles.speeds[i];
      positions[i * 3] += Math.sin(time * speed + i) * 0.003;
      positions[i * 3 + 1] += Math.cos(time * speed * 0.5 + i) * 0.002;
      positions[i * 3 + 2] += Math.sin(time * speed * 0.7 + i * 0.5) * 0.003;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color={color}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
