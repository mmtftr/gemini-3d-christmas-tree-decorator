import React, { useMemo, useRef, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeConfig } from '../types';
import { NoiseChunk } from './TreeShaders';

interface TreeProps {
  config: TreeConfig;
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  position?: [number, number, number];
}

export const Tree: React.FC<TreeProps> = ({ config, onPointerMove, onClick, onPointerOut, position }) => {
  const shaderRef = useRef<THREE.Shader>(null);
  
  // Update Uniforms
  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      shaderRef.current.uniforms.uSnowAmount.value = config.snowAmount;
      shaderRef.current.uniforms.uColor.value.set(config.color);
    }
  });

  const treeGeometry = useMemo(() => {
    // High-res cone for displacement
    // Use slightly larger base to cover trunk
    const geometry = new THREE.ConeGeometry(config.radius, config.height, 128, 64, true);
    geometry.translate(0, config.height / 2, 0); // Move base to 0
    // Compute tangents if needed, but standard material handles most
    return geometry;
  }, [config.height, config.radius]);

  const onBeforeCompile = useCallback((shader: THREE.Shader) => {
    shaderRef.current = shader;
    
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uSeed = { value: config.seed };
    shader.uniforms.uColor = { value: new THREE.Color(config.color) };
    shader.uniforms.uSnowAmount = { value: config.snowAmount };

    // Inject Common Vertex
    // We add the noise function here
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      uniform float uTime;
      uniform float uSeed;
      varying float vDisplacement;
      varying vec3 vCustomNormal;
      varying vec3 vCustomPos;
      
      ${NoiseChunk}
      `
    );

    // Inject Main Vertex
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      
      float noiseVal = snoise(vec3(position.x * 1.5, position.y * 1.2, position.z * 1.5 + uSeed));
      vDisplacement = noiseVal;
      
      // Displace
      vec3 displacementDir = normalize(objectNormal);
      vec3 newPos = position + displacementDir * (noiseVal * 0.25);
      
      transformed = newPos;
      
      // Calc world vars for fragment
      vCustomNormal = normalize(mat3(modelMatrix) * objectNormal);
      vCustomPos = (modelMatrix * vec4(newPos, 1.0)).xyz;
      `
    );

    // Inject Common Fragment
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      uniform vec3 uColor;
      uniform float uSnowAmount;
      varying float vDisplacement;
      varying vec3 vCustomNormal;
      varying vec3 vCustomPos;
      `
    );

    // Inject Color Fragment - Overwrite diffuse color safely
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      
      // Start with base color
      vec3 tColor = uColor;
      
      // Noise variation
      tColor = mix(tColor * 0.5, tColor * 1.2, smoothstep(-0.5, 0.5, vDisplacement));
      
      // Height Gradient
      float hFactor = smoothstep(0.0, 8.0, vCustomPos.y + 2.0);
      tColor *= (0.5 + 0.5 * hFactor);

      // Apply to diffuse
      diffuseColor.rgb = tColor;
      
      // Snow Logic
      vec3 up = vec3(0.0, 1.0, 0.0);
      float upDot = dot(normalize(vCustomNormal), up);
      
      // Noisy snow threshold
      float sNoise = vDisplacement * 0.2;
      float sThreshold = 1.0 - (uSnowAmount * 0.9);
      
      float sMask = smoothstep(sThreshold - 0.1, sThreshold + 0.1, upDot + sNoise);
      
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.98, 1.0), sMask);
      `
    );
  }, [config.seed, config.color, config.snowAmount]);

  return (
    // Internal group shift to ensure tree base aligns generally with floor if needed, 
    // but treeGeometry is translated to have base at 0.
    // We shift down by 1.0 to account for the trunk extending below? 
    // Trunk is at 0.2, height 0.8 -> range -0.2 to 0.6.
    // If we want trunk base at -1 relative to this group?
    // Let's stick to the previous layout: Tree internal group at [0, -1, 0]
    <group position={[0, -1, 0]}>
      {/* Trunk */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[config.radius * 0.15, config.radius * 0.2, 0.8, 12]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
      
      {/* Foliage */}
      <mesh 
        geometry={treeGeometry} 
        castShadow 
        receiveShadow
        name="tree-foliage"
        onPointerMove={onPointerMove}
        onClick={onClick}
        onPointerOut={onPointerOut}
      >
        <meshStandardMaterial
          color={config.color}
          roughness={0.8}
          metalness={0.1}
          onBeforeCompile={onBeforeCompile}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
