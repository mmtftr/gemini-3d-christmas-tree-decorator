import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

// ============================================
// SKY SHADER MATERIAL
// ============================================

const SkyShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uTopColor: new THREE.Color('#0a0a20'),
    uMidColor: new THREE.Color('#1a1a40'),
    uHorizonColor: new THREE.Color('#2d1a3d'),
    uStarDensity: 0.5,
    uAuroraIntensity: 0.0,
    uAuroraColor1: new THREE.Color('#00ff88'),
    uAuroraColor2: new THREE.Color('#ff00ff'),
    uMoonPosition: new THREE.Vector3(0.6, 0.4, -0.5),
    uMoonSize: 0.08,
    uMoonGlow: 0.3,
  },
  // Vertex Shader
  /*glsl*/ `
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  /*glsl*/ `
    uniform float uTime;
    uniform vec3 uTopColor;
    uniform vec3 uMidColor;
    uniform vec3 uHorizonColor;
    uniform float uStarDensity;
    uniform float uAuroraIntensity;
    uniform vec3 uAuroraColor1;
    uniform vec3 uAuroraColor2;
    uniform vec3 uMoonPosition;
    uniform float uMoonSize;
    uniform float uMoonGlow;

    varying vec3 vWorldPosition;
    varying vec2 vUv;

    // Noise functions for procedural effects
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float hash3(vec3 p) {
      return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float f = 0.0;
      float w = 0.5;
      for (int i = 0; i < 5; i++) {
        f += w * noise(p);
        p *= 2.0;
        w *= 0.5;
      }
      return f;
    }

    // Improved stars - small points with subtle glow
    float stars(vec3 dir, float density) {
      // Convert to spherical coordinates for better distribution
      float theta = atan(dir.z, dir.x);
      float phi = acos(dir.y);

      float stars = 0.0;

      // Layer 1 - bright stars (small core + glow)
      vec2 starUv1 = vec2(theta * 18.0, phi * 12.0);
      float n1 = hash(floor(starUv1));
      vec2 starPos1 = fract(starUv1);
      float d1 = length(starPos1 - vec2(n1, fract(n1 * 43.17)));
      float twinkle1 = sin(uTime * (1.5 + n1 * 2.0) + n1 * 50.0) * 0.3 + 0.7;
      if (n1 > 1.0 - density * 0.25) {
        float core1 = smoothstep(0.025, 0.0, d1); // tiny bright core
        float glow1 = smoothstep(0.06, 0.0, d1) * 0.3; // subtle glow
        stars += (core1 + glow1) * twinkle1 * 0.9;
      }

      // Layer 2 - medium stars
      vec2 starUv2 = vec2(theta * 30.0 + 1.5, phi * 22.0 + 2.3);
      float n2 = hash(floor(starUv2));
      vec2 starPos2 = fract(starUv2);
      float d2 = length(starPos2 - vec2(fract(n2 * 17.3), fract(n2 * 31.7)));
      float twinkle2 = sin(uTime * (2.0 + n2 * 3.0) + n2 * 80.0) * 0.25 + 0.75;
      if (n2 > 1.0 - density * 0.35) {
        float core2 = smoothstep(0.018, 0.0, d2);
        float glow2 = smoothstep(0.04, 0.0, d2) * 0.25;
        stars += (core2 + glow2) * twinkle2 * 0.7;
      }

      // Layer 3 - small background stars (just points)
      vec2 starUv3 = vec2(theta * 55.0 + 3.7, phi * 40.0 + 1.2);
      float n3 = hash(floor(starUv3));
      vec2 starPos3 = fract(starUv3);
      float d3 = length(starPos3 - vec2(fract(n3 * 23.1), fract(n3 * 47.3)));
      float twinkle3 = sin(uTime * (3.0 + n3 * 2.0) + n3 * 120.0) * 0.15 + 0.85;
      if (n3 > 1.0 - density * 0.45) {
        stars += smoothstep(0.012, 0.0, d3) * twinkle3 * 0.5;
      }

      // Layer 4 - tiny dim stars
      vec2 starUv4 = vec2(theta * 80.0 + 5.2, phi * 60.0 + 3.8);
      float n4 = hash(floor(starUv4));
      vec2 starPos4 = fract(starUv4);
      float d4 = length(starPos4 - vec2(fract(n4 * 29.3), fract(n4 * 53.7)));
      if (n4 > 1.0 - density * 0.5) {
        stars += smoothstep(0.008, 0.0, d4) * 0.35;
      }

      // Rare bright accent stars (small with noticeable glow)
      vec2 starUv5 = vec2(theta * 10.0, phi * 7.0);
      float n5 = hash(floor(starUv5));
      vec2 starPos5 = fract(starUv5);
      float d5 = length(starPos5 - vec2(0.5 + (n5 - 0.5) * 0.4, 0.5 + (fract(n5 * 7.3) - 0.5) * 0.4));
      float twinkle5 = sin(uTime * 1.2 + n5 * 30.0) * 0.2 + 0.8;
      if (n5 > 0.94) {
        float core5 = smoothstep(0.02, 0.0, d5) * 1.2; // bright core
        float glow5 = smoothstep(0.05, 0.01, d5) * 0.4; // soft glow
        stars += (core5 + glow5) * twinkle5;
      }

      return stars;
    }

    // Aurora borealis effect
    vec3 aurora(vec2 uv, float time) {
      if (uAuroraIntensity < 0.01) return vec3(0.0);

      float aurora = 0.0;

      // Multiple wave layers
      for (float i = 0.0; i < 3.0; i++) {
        float offset = i * 0.3;
        float speed = 0.1 + i * 0.05;
        float freq = 2.0 + i * 0.5;

        float wave = sin(uv.x * freq + time * speed + offset) * 0.5 + 0.5;
        wave *= sin(uv.x * freq * 2.3 + time * speed * 1.3) * 0.5 + 0.5;

        // Vertical position with noise
        float y = 0.6 + wave * 0.15 + fbm(vec2(uv.x * 3.0 + time * 0.1, i)) * 0.1;
        float dist = abs(uv.y - y);

        // Aurora band
        float band = smoothstep(0.15, 0.0, dist);
        band *= smoothstep(0.3, 0.5, uv.y); // Fade at bottom
        band *= smoothstep(0.95, 0.8, uv.y); // Fade at top

        aurora += band * (1.0 - i * 0.3);
      }

      // Color gradient
      float colorMix = sin(uv.x * 3.0 + time * 0.2) * 0.5 + 0.5;
      colorMix += fbm(vec2(uv.x * 2.0, time * 0.1)) * 0.3;
      vec3 auroraColor = mix(uAuroraColor1, uAuroraColor2, colorMix);

      // Add shimmer
      float shimmer = noise(uv * 50.0 + time) * 0.3 + 0.7;

      return auroraColor * aurora * shimmer * uAuroraIntensity;
    }

    // Half moon with glow
    vec3 moon(vec3 dir) {
      vec3 moonDir = normalize(uMoonPosition);
      float moonDist = length(dir - moonDir);

      // Create half moon by offsetting a shadow circle
      vec3 shadowOffset = normalize(cross(moonDir, vec3(0.0, 1.0, 0.0))) * uMoonSize * 0.65;
      float shadowDist = length(dir - (moonDir + shadowOffset));

      // Moon disc minus shadow for crescent
      float disc = smoothstep(uMoonSize, uMoonSize * 0.92, moonDist);
      float shadow = smoothstep(uMoonSize * 0.9, uMoonSize * 0.8, shadowDist);
      float crescent = disc * (1.0 - shadow);

      // Moon surface with slight variation
      vec3 moonColor = vec3(1.0, 0.98, 0.92) * crescent;

      // Subtle surface detail
      float detail = noise(dir.xy * 80.0) * 0.08;
      moonColor *= (1.0 - detail * crescent);

      // Glow: compute distance to the lit edge of crescent only
      // Offset the glow center away from shadow to align with crescent
      vec3 glowCenter = moonDir - shadowOffset * 0.5;
      float glowDist = length(dir - glowCenter);
      float glow = smoothstep(uMoonSize * 5.0, uMoonSize * 0.5, glowDist);
      moonColor += vec3(1.0, 0.97, 0.9) * glow * uMoonGlow * 0.2;

      return moonColor;
    }

    // Shooting star
    float shootingStar(vec3 dir, float time) {
      float cycle = mod(time * 0.1, 1.0);
      if (cycle > 0.1) return 0.0;

      float progress = cycle / 0.1;
      vec3 startPos = vec3(0.3, 0.8, -0.5);
      vec3 endPos = vec3(-0.2, 0.5, -0.5);
      vec3 currentPos = mix(startPos, endPos, progress);

      float dist = length(dir - normalize(currentPos));
      float trail = smoothstep(0.02, 0.0, dist);

      // Trail fade
      trail *= (1.0 - progress);

      return trail;
    }

    void main() {
      vec3 dir = normalize(vWorldPosition);

      // Sky gradient based on vertical position
      float heightFactor = dir.y * 0.5 + 0.5;
      heightFactor = clamp(heightFactor, 0.0, 1.0);

      vec3 skyColor;
      if (heightFactor < 0.3) {
        skyColor = mix(uHorizonColor, uMidColor, heightFactor / 0.3);
      } else {
        skyColor = mix(uMidColor, uTopColor, (heightFactor - 0.3) / 0.7);
      }

      // Add atmospheric scattering near horizon
      float horizonGlow = smoothstep(0.0, 0.3, heightFactor) * smoothstep(0.5, 0.2, heightFactor);
      skyColor += uHorizonColor * horizonGlow * 0.3;

      // Stars - only above horizon
      if (dir.y > 0.0) {
        float starBrightness = stars(dir, 1.0 - uStarDensity);

        // Star color variation based on position
        float theta = atan(dir.z, dir.x);
        float phi = acos(dir.y);
        float colorHash = hash(vec2(theta * 10.0, phi * 8.0));
        vec3 starColor = vec3(1.0);
        if (colorHash < 0.15) starColor = vec3(1.0, 0.85, 0.75); // Warm yellow
        else if (colorHash < 0.3) starColor = vec3(0.85, 0.92, 1.0); // Cool blue

        skyColor += starColor * starBrightness * 0.9;

        // Shooting star (rare)
        skyColor += vec3(1.0, 0.95, 0.8) * shootingStar(dir, uTime);
      }

      // Aurora borealis
      if (uAuroraIntensity > 0.0 && dir.y > 0.0) {
        vec2 auroraUv = vec2(atan(dir.x, dir.z) / 3.14159 * 0.5 + 0.5, dir.y);
        skyColor += aurora(auroraUv, uTime);
      }

      // Moon
      if (uMoonGlow > 0.0) {
        skyColor += moon(dir);
      }

      // Subtle nebula/cloud effect
      float nebulaStrength = fbm(dir.xz * 2.0 + uTime * 0.01) * 0.1;
      nebulaStrength *= smoothstep(0.2, 0.6, dir.y);
      skyColor += uMidColor * nebulaStrength;

      gl_FragColor = vec4(skyColor, 1.0);
    }
  `
);

// Extend for JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      skyShaderMaterial: any;
    }
  }
}

// Register the material
import { extend } from '@react-three/fiber';
extend({ SkyShaderMaterial });

// ============================================
// SKY DOME COMPONENT
// ============================================

interface SkyShaderProps {
  topColor?: string;
  midColor?: string;
  horizonColor?: string;
  starDensity?: number;
  auroraIntensity?: number;
  auroraColor1?: string;
  auroraColor2?: string;
  moonPosition?: [number, number, number];
  moonSize?: number;
  moonGlow?: number;
}

export const SkyShader: React.FC<SkyShaderProps> = ({
  topColor = '#0a0a20',
  midColor = '#1a1a40',
  horizonColor = '#2d1a3d',
  starDensity = 0.5,
  auroraIntensity = 0.0,
  auroraColor1 = '#00ff88',
  auroraColor2 = '#ff00ff',
  moonPosition = [0.6, 0.4, -0.5],
  moonSize = 0.08,
  moonGlow = 0.3,
}) => {
  const materialRef = useRef<any>(null);

  // Memoize colors
  const colors = useMemo(() => ({
    top: new THREE.Color(topColor),
    mid: new THREE.Color(midColor),
    horizon: new THREE.Color(horizonColor),
    aurora1: new THREE.Color(auroraColor1),
    aurora2: new THREE.Color(auroraColor2),
  }), [topColor, midColor, horizonColor, auroraColor1, auroraColor2]);

  const moonPos = useMemo(() =>
    new THREE.Vector3(...moonPosition).normalize(),
    [moonPosition]
  );

  // Animate time uniform
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
    }
  });

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[100, 64, 64]} />
      <skyShaderMaterial
        ref={materialRef}
        side={THREE.BackSide}
        uTopColor={colors.top}
        uMidColor={colors.mid}
        uHorizonColor={colors.horizon}
        uStarDensity={starDensity}
        uAuroraIntensity={auroraIntensity}
        uAuroraColor1={colors.aurora1}
        uAuroraColor2={colors.aurora2}
        uMoonPosition={moonPos}
        uMoonSize={moonSize}
        uMoonGlow={moonGlow}
        depthWrite={false}
      />
    </mesh>
  );
};

// ============================================
// PRESET CONFIGURATIONS
// ============================================

export const SKY_PRESETS = {
  winterNight: {
    topColor: '#050510',
    midColor: '#0f1a2a',
    horizonColor: '#1a2535',
    starDensity: 0.4,
    auroraIntensity: 0.0,
    moonGlow: 0.4,
  },
  auroraBoreal: {
    topColor: '#050510',
    midColor: '#0a1520',
    horizonColor: '#0f2030',
    starDensity: 0.5,
    auroraIntensity: 0.6,
    auroraColor1: '#00ff88',
    auroraColor2: '#4488ff',
    moonGlow: 0.2,
  },
  midnightMagic: {
    topColor: '#0a0515',
    midColor: '#150a25',
    horizonColor: '#251535',
    starDensity: 0.6,
    auroraIntensity: 0.3,
    auroraColor1: '#ff66ff',
    auroraColor2: '#6644ff',
    moonGlow: 0.5,
  },
  warmEvening: {
    topColor: '#0a0808',
    midColor: '#1a1210',
    horizonColor: '#2d1a15',
    starDensity: 0.3,
    auroraIntensity: 0.0,
    moonGlow: 0.6,
  },
  frozenArctic: {
    topColor: '#050a10',
    midColor: '#0a1520',
    horizonColor: '#102030',
    starDensity: 0.5,
    auroraIntensity: 0.8,
    auroraColor1: '#00ffaa',
    auroraColor2: '#00aaff',
    moonGlow: 0.3,
  },
} as const;

export type SkyPreset = keyof typeof SKY_PRESETS;
