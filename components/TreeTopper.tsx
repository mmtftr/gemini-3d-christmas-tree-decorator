import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { TreeTopperData, TopperType } from '../types';

interface TreeTopperProps {
  data: TreeTopperData | null;
  position: [number, number, number];
  onClick?: () => void;
  isPlacementMode?: boolean;
}

// ============================================
// STAR TOPPER
// ============================================

const StarTopper: React.FC<{ color: string; glow: boolean }> = ({ color, glow }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create a 5-pointed star shape
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 0.4;
    const innerRadius = 0.18;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();
    return shape;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.rotation.y = time * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main star */}
      <mesh castShadow>
        <extrudeGeometry
          args={[
            starShape,
            {
              depth: 0.08,
              bevelEnabled: true,
              bevelThickness: 0.02,
              bevelSize: 0.02,
              bevelSegments: 2,
            },
          ]}
        />
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.1}
          emissive={color}
          emissiveIntensity={glow ? 0.8 : 0.2}
        />
      </mesh>

      {/* Center gem */}
      <mesh position={[0, 0, 0.06]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.5}
          roughness={0.1}
          emissive="#ffffff"
          emissiveIntensity={glow ? 1 : 0.3}
        />
      </mesh>

      {/* Glow effect */}
      {glow && (
        <>
          <pointLight color={color} intensity={3} distance={2} />
          <pointLight color="#ffffff" intensity={2} distance={1.5} />
        </>
      )}
    </group>
  );
};

// ============================================
// SNOWFLAKE TOPPER
// ============================================

const SnowflakeTopper: React.FC<{ color: string; glow: boolean }> = ({ color, glow }) => {
  const groupRef = useRef<THREE.Group>(null);
  const arms = 6;

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.rotation.y = time * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main arms */}
      {Array.from({ length: arms }).map((_, i) => (
        <group key={i} rotation={[0, 0, (i / arms) * Math.PI * 2]}>
          {/* Main arm */}
          <mesh castShadow>
            <boxGeometry args={[0.04, 0.4, 0.02]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={glow ? 0.5 : 0.1}
              transparent
              opacity={0.95}
            />
          </mesh>

          {/* Branches */}
          <mesh position={[0.05, 0.12, 0]} rotation={[0, 0, 0.6]} castShadow>
            <boxGeometry args={[0.02, 0.12, 0.02]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={glow ? 0.5 : 0.1}
            />
          </mesh>
          <mesh position={[-0.05, 0.12, 0]} rotation={[0, 0, -0.6]} castShadow>
            <boxGeometry args={[0.02, 0.12, 0.02]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={glow ? 0.5 : 0.1}
            />
          </mesh>

          {/* Outer decorations */}
          <mesh position={[0, 0.18, 0]} castShadow>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={glow ? 0.8 : 0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Center crystal */}
      <mesh castShadow>
        <octahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
          metalness={0.5}
          roughness={0.1}
          emissive="#ffffff"
          emissiveIntensity={glow ? 1 : 0.3}
        />
      </mesh>

      {glow && (
        <>
          <pointLight color={color} intensity={2} distance={1.5} />
          <pointLight color="#ffffff" intensity={1} distance={1} />
        </>
      )}
    </group>
  );
};

// ============================================
// MAIN TREE TOPPER COMPONENT
// ============================================

export const TreeTopper: React.FC<TreeTopperProps> = ({
  data,
  position,
  onClick,
  isPlacementMode,
}) => {
  const [hovered, setHovered] = React.useState(false);
  useCursor(hovered && isPlacementMode);

  const renderTopper = (type: TopperType, color: string, glow: boolean) => {
    switch (type) {
      case 'star':
        return <StarTopper color={color} glow={glow} />;
      case 'snowflake':
        return <SnowflakeTopper color={color} glow={glow} />;
      default:
        return <StarTopper color={color} glow={glow} />;
    }
  };

  if (!data && !isPlacementMode) {
    return null;
  }

  return (
    <group
      position={position}
      scale={data?.scale || 1}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      {data ? (
        renderTopper(data.type, data.color, data.glow)
      ) : (
        // Placeholder when no topper is set
        <group>
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial
              color="#ffd700"
              transparent
              opacity={hovered ? 0.6 : 0.3}
              wireframe
            />
          </mesh>
          {hovered && <pointLight color="#ffd700" intensity={1} distance={0.5} />}
        </group>
      )}

      {/* Hover highlight in placement mode */}
      {isPlacementMode && hovered && !data && (
        <mesh scale={1.2}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
};

// ============================================
// TOPPER PREVIEW (for UI selection)
// ============================================

interface TopperPreviewProps {
  type: TopperType;
  color: string;
  glow?: boolean;
}

export const TopperPreview: React.FC<TopperPreviewProps> = ({ type, color, glow = true }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.rotation.y = time;
    }
  });

  return (
    <group ref={groupRef} scale={0.6}>
      {type === 'star' && <StarTopper color={color} glow={glow} />}
      {type === 'snowflake' && <SnowflakeTopper color={color} glow={glow} />}
    </group>
  );
};
