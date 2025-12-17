import React from 'react';
import * as THREE from 'three';
import { SceneTheme } from '../data/themes';
import { Snow, AmbientParticles } from './Snow';
import { SkyShader } from './SkyShader';

interface SceneEnvironmentProps {
  theme: SceneTheme;
}

export const SceneEnvironment: React.FC<SceneEnvironmentProps> = ({ theme }) => {
  return (
    <>
      {/* Fog - key forces remount on theme change */}
      <fog key={`fog-${theme.id}`} attach="fog" args={[theme.fogColor, 15, 60]} />

      {/* Ambient Light - increased for better visibility */}
      <ambientLight intensity={theme.ambientIntensity} color={theme.ambientColor} />

      {/* Hemisphere light for natural sky/ground lighting */}
      <hemisphereLight
        color={theme.mainLightColor}
        groundColor={theme.groundColor}
        intensity={0.4}
      />

      {/* Main directional light (sun/moon) */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={theme.mainLightIntensity}
        color={theme.mainLightColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
      />

      {/* Front fill light for better tree visibility */}
      <directionalLight
        position={[0, 5, 15]}
        intensity={theme.mainLightIntensity * 0.4}
        color={theme.mainLightColor}
      />

      {/* Accent light for color atmosphere */}
      <pointLight
        position={[-8, 6, -8]}
        intensity={theme.accentLightIntensity}
        color={theme.accentLightColor}
        distance={30}
      />

      {/* Secondary accent from opposite side */}
      <pointLight
        position={[8, 4, 8]}
        intensity={theme.accentLightIntensity * 0.6}
        color={theme.accentLightColor}
        distance={25}
      />

      {/* Front accent for ornament shine */}
      <pointLight
        position={[0, 3, 10]}
        intensity={theme.accentLightIntensity * 0.5}
        color="#ffffff"
        distance={20}
      />

      {/* Rim light for tree outline */}
      <spotLight
        position={[0, 15, -10]}
        angle={0.4}
        penumbra={1}
        intensity={0.5}
        color="#ffffff"
      />

      {/* Sky Shader with stars, moon, and aurora */}
      <SkyShader
        key={`sky-${theme.id}`}
        {...theme.skyShader}
      />

      {/* Snowfall - key forces remount on theme change */}
      {theme.snowfall && (
        <Snow
          key={`snow-${theme.id}-${theme.snowfallIntensity}`}
          count={1500}
          intensity={theme.snowfallIntensity}
          area={25}
          speed={1.2}
        />
      )}

      {/* Ambient particles (magic dust) - key forces remount on theme change */}
      <AmbientParticles
        key={`particles-${theme.id}`}
        count={80}
        color={theme.accentLightColor}
        area={12}
      />

      {/* Ground plane */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3.21, 0]}
      >
        <circleGeometry args={[20, 64]} />
        <meshStandardMaterial
          color={theme.groundColor}
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* Ground glow ring around tree base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.17, 0]}>
        <ringGeometry args={[2.5, 4, 64]} />
        <meshBasicMaterial
          color={theme.accentLightColor}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
};
