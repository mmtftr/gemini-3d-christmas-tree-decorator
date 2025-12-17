import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { OrnamentData, OrnamentType } from '../types';

// ============================================
// SHARED GEOMETRY COMPONENTS
// ============================================

const SphereOrnament: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 1 }) => (
  <>
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[0.15, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        metalness={0.8}
        roughness={0.2}
        envMapIntensity={1.5}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
    {/* Glow effect */}
    <pointLight color={color} intensity={0.4} distance={0.8} />
  </>
);

const CubeOrnament: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 1 }) => (
  <>
    <mesh castShadow receiveShadow rotation={[0.5, 0.5, 0]}>
      <boxGeometry args={[0.18, 0.18, 0.18]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        metalness={0.8}
        roughness={0.2}
        envMapIntensity={1.5}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
    <pointLight color={color} intensity={0.4} distance={0.8} />
  </>
);

const DiamondOrnament: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 1 }) => (
  <>
    <mesh castShadow receiveShadow>
      <octahedronGeometry args={[0.15, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={2}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
    <pointLight color={color} intensity={0.5} distance={1} />
  </>
);

const GiftBoxOrnament: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 1 }) => {
  const ribbonColor = useMemo(() => {
    const c = new THREE.Color(color);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    return new THREE.Color().setHSL((hsl.h + 0.5) % 1, Math.min(hsl.s + 0.2, 1), hsl.l);
  }, [color]);

  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.18, 0.18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          roughness={0.4}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 0.04, 0.04]} />
        <meshStandardMaterial
          color={ribbonColor}
          emissive={ribbonColor}
          emissiveIntensity={0.3}
          roughness={0.3}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.04, 0.2, 0.04]} />
        <meshStandardMaterial
          color={ribbonColor}
          emissive={ribbonColor}
          emissiveIntensity={0.3}
          roughness={0.3}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.2]} />
        <meshStandardMaterial
          color={ribbonColor}
          emissive={ribbonColor}
          emissiveIntensity={0.3}
          roughness={0.3}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <pointLight color={color} intensity={0.3} distance={0.7} />
    </group>
  );
};

const SnowflakeOrnament: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 1 }) => {
  const arms = 6;
  return (
    <group>
      {Array.from({ length: arms }).map((_, i) => (
        <group key={i} rotation={[0, 0, (i / arms) * Math.PI * 2]}>
          <mesh castShadow>
            <boxGeometry args={[0.015, 0.18, 0.008]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
              transparent={opacity < 1}
              opacity={opacity}
            />
          </mesh>
          <mesh position={[0.025, 0.055, 0]} rotation={[0, 0, 0.5]} castShadow>
            <boxGeometry args={[0.008, 0.05, 0.008]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent={opacity < 1} opacity={opacity} />
          </mesh>
          <mesh position={[-0.025, 0.055, 0]} rotation={[0, 0, -0.5]} castShadow>
            <boxGeometry args={[0.008, 0.05, 0.008]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent={opacity < 1} opacity={opacity} />
          </mesh>
        </group>
      ))}
      <mesh castShadow>
        <octahedronGeometry args={[0.03, 0]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <pointLight color={color} intensity={0.5} distance={1} />
    </group>
  );
};

const HeartOrnament: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 1 }) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const x = 0, y = 0;
    s.moveTo(x, y);
    s.bezierCurveTo(x, y - 0.035, x - 0.035, y - 0.07, x - 0.07, y - 0.07);
    s.bezierCurveTo(x - 0.14, y - 0.07, x - 0.14, y + 0.035, x - 0.14, y + 0.035);
    s.bezierCurveTo(x - 0.14, y + 0.07, x - 0.105, y + 0.105, x, y + 0.14);
    s.bezierCurveTo(x + 0.105, y + 0.105, x + 0.14, y + 0.07, x + 0.14, y + 0.035);
    s.bezierCurveTo(x + 0.14, y + 0.035, x + 0.14, y - 0.07, x + 0.07, y - 0.07);
    s.bezierCurveTo(x + 0.035, y - 0.07, x, y - 0.035, x, y);
    return s;
  }, []);

  return (
    <>
      <mesh castShadow receiveShadow rotation={[0, 0, Math.PI]}>
        <extrudeGeometry args={[shape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 }]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          metalness={0.6}
          roughness={0.3}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <pointLight color={color} intensity={0.4} distance={0.8} />
    </>
  );
};

// ============================================
// GLB-BASED GIFT ORNAMENTS
// ============================================

const Gift1Ornament: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 1 }) => {
  const { scene } = useGLTF('/models/gift1.glb');
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const material = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.2,
          metalness: 0.3,
          roughness: 0.6,
          transparent: opacity < 1,
          opacity: opacity,
        });
        mesh.material = material;
      }
    });
    return clone;
  }, [scene, color, opacity]);

  return (
    <group scale={0.4}>
      <primitive object={clonedScene} />
      <pointLight color={color} intensity={0.4} distance={0.8} />
    </group>
  );
};

const Gift2Ornament: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 1 }) => {
  const { scene } = useGLTF('/models/gift2.glb');
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const material = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.2,
          metalness: 0.3,
          roughness: 0.6,
          transparent: opacity < 1,
          opacity: opacity,
        });
        mesh.material = material;
      }
    });
    return clone;
  }, [scene, color, opacity]);

  return (
    <group scale={0.4}>
      <primitive object={clonedScene} position={[0.4, -0.18, 0]} />
      <pointLight color={color} intensity={0.4} distance={0.8} />
    </group>
  );
};

const Gift3Ornament: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 1 }) => {
  const { scene } = useGLTF('/models/gift3.glb');
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const material = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.2,
          metalness: 0.3,
          roughness: 0.6,
          transparent: opacity < 1,
          opacity: opacity,
        });
        mesh.material = material;
      }
    });
    return clone;
  }, [scene, color, opacity]);

  return (
    <group scale={0.4}>
      <primitive object={clonedScene} position={[-0.4, -0.2, 0]} />
      <pointLight color={color} intensity={0.4} distance={0.8} />
    </group>
  );
};

const BallOrnament: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 1 }) => {
  const { scene } = useGLTF('/models/ball.glb');
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const material = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.3,
          metalness: 0.8,
          roughness: 0.2,
          transparent: opacity < 1,
          opacity: opacity,
        });
        mesh.material = material;
      }
    });
    return clone;
  }, [scene, color, opacity]);

  return (
    <group scale={0.3}>
      <primitive object={clonedScene} />
      <pointLight color={color} intensity={0.4} distance={0.8} />
    </group>
  );
};

const BellOrnament: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 1 }) => {
  const { scene } = useGLTF('/models/bell.glb');
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const material = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.25,
          metalness: 0.9,
          roughness: 0.1,
          transparent: opacity < 1,
          opacity: opacity,
        });
        mesh.material = material;
      }
    });
    return clone;
  }, [scene, color, opacity]);

  return (
    <group scale={1.35}>
      <primitive object={clonedScene} />
      <pointLight color={color} intensity={0.5} distance={1} />
    </group>
  );
};

const RedballOrnament: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 1 }) => {
  const { scene } = useGLTF('/models/redball.glb');
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const material = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.3,
          metalness: 0.8,
          roughness: 0.2,
          transparent: opacity < 1,
          opacity: opacity,
        });
        mesh.material = material;
      }
    });
    return clone;
  }, [scene, color, opacity]);

  return (
    <group scale={0.08} rotation={[0, 0, Math.PI / 2]}>
      <primitive object={clonedScene} position={[-7.67, -0.4, 0]} />
      <pointLight color={color} intensity={0.4} distance={0.8} />
    </group>
  );
};

// Preload GLB models
useGLTF.preload('/models/gift1.glb');
useGLTF.preload('/models/gift2.glb');
useGLTF.preload('/models/gift3.glb');
useGLTF.preload('/models/ball.glb');
useGLTF.preload('/models/bell.glb');
useGLTF.preload('/models/redball.glb');

// ============================================
// RENDER ORNAMENT BY TYPE
// ============================================

const renderOrnamentByType = (type: OrnamentType, color: string, opacity: number = 1) => {
  switch (type) {
    case 'sphere':
      return <SphereOrnament color={color} opacity={opacity} />;
    case 'cube':
      return <CubeOrnament color={color} opacity={opacity} />;
    case 'diamond':
      return <DiamondOrnament color={color} opacity={opacity} />;
    case 'giftBox':
      return <GiftBoxOrnament color={color} opacity={opacity} />;
    case 'snowflake':
      return <SnowflakeOrnament color={color} opacity={opacity} />;
    case 'heart':
      return <HeartOrnament color={color} opacity={opacity} />;
    case 'gift1':
      return <Gift1Ornament color={color} opacity={opacity} />;
    case 'gift2':
      return <Gift2Ornament color={color} opacity={opacity} />;
    case 'gift3':
      return <Gift3Ornament color={color} opacity={opacity} />;
    case 'ball':
      return <BallOrnament color={color} opacity={opacity} />;
    case 'bell':
      return <BellOrnament color={color} opacity={opacity} />;
    case 'redball':
      return <RedballOrnament color={color} opacity={opacity} />;
    default:
      return <SphereOrnament color={color} opacity={opacity} />;
  }
};

// ============================================
// ORNAMENT MESH COMPONENT
// ============================================

interface OrnamentProps {
  data: OrnamentData;
  onClick?: (e: any) => void;
  isSelected?: boolean;
}

export const OrnamentMesh: React.FC<OrnamentProps> = ({ data, onClick, isSelected }) => {
  const [hovered, setHovered] = React.useState(false);
  const groupRef = useRef<THREE.Group>(null);
  useCursor(hovered);

  return (
    <group
      ref={groupRef}
      position={data.position}
      scale={data.scale * (hovered ? 1.15 : 1)}
      rotation={data.rotation || [0, 0, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      {renderOrnamentByType(data.type, data.color)}

      {isSelected && (
        <mesh>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.2} wireframe />
        </mesh>
      )}

      {hovered && (
        <pointLight color={data.color} intensity={1} distance={0.5} />
      )}
    </group>
  );
};

// ============================================
// GHOST ORNAMENT (Placement Preview)
// ============================================

interface GhostOrnamentProps {
  type: OrnamentType;
  color: string;
  position: [number, number, number];
}

export const GhostOrnament: React.FC<GhostOrnamentProps> = ({ type, color, position }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Billboard: face the camera during placement
      const cameraPos = state.camera.position;
      groupRef.current.lookAt(cameraPos.x, groupRef.current.position.y, cameraPos.z);

      // Pulsing scale effect
      const time = state.clock.getElapsedTime();
      groupRef.current.scale.setScalar(0.95 + Math.sin(time * 3) * 0.05);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {renderOrnamentByType(type, color, 0.6)}

      <pointLight color={color} intensity={1.5} distance={0.8} />

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.24, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// ============================================
// ORNAMENT PREVIEW (for UI panels)
// ============================================

interface OrnamentPreviewProps {
  type: OrnamentType;
  color: string;
  size?: number;
}

export const OrnamentPreview: React.FC<OrnamentPreviewProps> = ({ type, color, size = 1 }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime();
    }
  });

  return (
    <group ref={groupRef} scale={size}>
      {renderOrnamentByType(type, color)}
    </group>
  );
};
