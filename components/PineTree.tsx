import React, { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeConfig } from '../types';

// Seeded random number generator for consistent snow placement
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface PineTreeProps {
  config: TreeConfig;
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
}

export const PineTree: React.FC<PineTreeProps> = ({
  config,
  onPointerMove,
  onClick,
  onPointerOut,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle sway animation
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.02;
    }
  });

  // Generate random snow clump positions based on seed
  const snowClumps = useMemo(() => {
    if (config.snowAmount < 0.05) return [];

    const clumps: Array<{
      position: [number, number, number];
      scale: number;
      rotation: [number, number, number];
    }> = [];

    const numClumps = Math.floor(15 + config.snowAmount * 40);
    const seed = config.seed || 12345;

    for (let i = 0; i < numClumps; i++) {
      const s = seed + i * 137.5;
      const angle = seededRandom(s) * Math.PI * 2;
      const tierIndex = Math.floor(seededRandom(s + 1) * 5);
      const tierProgress = tierIndex / 4;

      // Position on the cone surface
      const tierRadius = config.radius * (1.1 - tierProgress * 0.7);
      const yBase = 1.0 + tierIndex * (config.height * 0.18);
      const tierHeight = config.height * 0.28 * (1 - tierProgress * 0.15);

      // Random position along the tier
      const heightOnTier = seededRandom(s + 2) * 0.7;
      const radiusAtHeight = tierRadius * (1 - heightOnTier * 0.8);

      const x = Math.cos(angle) * radiusAtHeight * (0.7 + seededRandom(s + 3) * 0.5);
      const z = Math.sin(angle) * radiusAtHeight * (0.7 + seededRandom(s + 4) * 0.5);
      const y = yBase + heightOnTier * tierHeight * 0.5;

      clumps.push({
        position: [x, y, z],
        scale: 0.08 + seededRandom(s + 5) * 0.12 * (1 + config.snowAmount),
        rotation: [
          seededRandom(s + 6) * 0.5,
          seededRandom(s + 7) * Math.PI * 2,
          seededRandom(s + 8) * 0.5,
        ],
      });
    }

    return clumps;
  }, [config.seed, config.snowAmount, config.radius, config.height]);

  // Create a beautiful tiered pine tree
  const treeGeometry = useMemo(() => {
    const tiers = 5;
    const elements: JSX.Element[] = [];

    // Trunk
    elements.push(
      <mesh key="trunk" position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[config.radius * 0.1, config.radius * 0.15, 1.2, 16]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} metalness={0} />
      </mesh>
    );

    // Tree tiers (cones stacked)
    for (let i = 0; i < tiers; i++) {
      const tierProgress = i / (tiers - 1);
      const tierHeight = config.height * 0.28 * (1 - tierProgress * 0.15);
      const tierRadius = config.radius * (1.1 - tierProgress * 0.7);
      const yPos = 1.0 + i * (config.height * 0.18);

      // Main cone
      elements.push(
        <mesh
          key={`tier-${i}`}
          position={[0, yPos, 0]}
          castShadow
          receiveShadow
          name="tree-foliage"
          onPointerMove={onPointerMove}
          onClick={onClick}
          onPointerOut={onPointerOut}
        >
          <coneGeometry args={[tierRadius, tierHeight, 32]} />
          <meshStandardMaterial
            color={config.color}
            roughness={0.8}
            metalness={0.05}
          />
        </mesh>
      );

      // Snow cap on top of each tier (smooth transition)
      if (config.snowAmount > 0.1) {
        elements.push(
          <mesh
            key={`snow-cap-${i}`}
            position={[0, yPos + tierHeight * 0.38, 0]}
            castShadow
          >
            <coneGeometry args={[tierRadius * 0.65, tierHeight * 0.25, 32]} />
            <meshStandardMaterial
              color="#f8fcff"
              roughness={0.95}
              metalness={0}
              transparent
              opacity={Math.min(config.snowAmount * 1.2, 0.95)}
            />
          </mesh>
        );
      }
    }

    // Top spike
    const topY = 1.0 + (tiers - 1) * (config.height * 0.18) + config.height * 0.15;
    elements.push(
      <mesh
        key="top-spike"
        position={[0, topY, 0]}
        castShadow
        receiveShadow
        name="tree-foliage"
        onPointerMove={onPointerMove}
        onClick={onClick}
        onPointerOut={onPointerOut}
      >
        <coneGeometry args={[config.radius * 0.25, config.height * 0.25, 16]} />
        <meshStandardMaterial
          color={config.color}
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>
    );

    // Snow on top spike
    if (config.snowAmount > 0.15) {
      elements.push(
        <mesh
          key="top-snow"
          position={[0, topY + config.height * 0.1, 0]}
          castShadow
        >
          <coneGeometry args={[config.radius * 0.15, config.height * 0.08, 16]} />
          <meshStandardMaterial
            color="#f8fcff"
            roughness={0.95}
            metalness={0}
            transparent
            opacity={Math.min(config.snowAmount * 1.3, 1)}
          />
        </mesh>
      );
    }

    return elements;
  }, [config, onPointerMove, onClick, onPointerOut]);

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {treeGeometry}

      {/* Random snow clumps on branches */}
      {snowClumps.map((clump, i) => (
        <mesh
          key={`snow-clump-${i}`}
          position={clump.position}
          rotation={clump.rotation}
          scale={clump.scale}
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color="#f0f8ff"
            roughness={1}
            metalness={0}
            transparent
            opacity={0.85 + config.snowAmount * 0.15}
          />
        </mesh>
      ))}
    </group>
  );
};
