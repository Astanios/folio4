import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import PortalLightning from "./PortalLightning.jsx";

const PARTICLE_COUNT = 64;

const surfaceVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const surfaceFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIdle;
  uniform float uFlash;
  uniform float uFlashAngle;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
  }
  float mist(vec2 p) {
    return noise(p) * 0.57 + noise(p * 2.03 + 7.2) * 0.28
      + noise(p * 4.07 + 19.1) * 0.15;
  }
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float radius = length(p);
    float angle = atan(p.y, p.x);
    // Rotating the noise in Cartesian space avoids a seam at atan's -PI/PI edge.
    float twist = angle - uTime * 0.23 + 3.7 * pow(1.0 - min(radius, 1.0), 1.15);
    vec2 flow = vec2(cos(twist), sin(twist)) * radius;
    float cloud = mist(flow * 5.3 + vec2(uTime * 0.045, -uTime * 0.035));
    float detail = noise(flow * 17.0 - uTime * 0.06);
    float spiral = sin(twist * 5.0 + radius * 10.0 + cloud * 3.8);
    float threads = pow(max(0.0, spiral * 0.5 + 0.5), 5.0);
    float well = smoothstep(0.12, 0.62, radius);
    float edgeFade = 1.0 - smoothstep(0.94, 1.02, radius);
    vec3 magenta = vec3(0.74, 0.014, 0.19);
    vec3 coral = vec3(1.3, 0.12, 0.025);
    vec3 gold = vec3(2.6, 1.05, 0.24);
    vec3 color = vec3(0.007, 0.0015, 0.014);
    color += mix(magenta, coral, cloud) * well * (0.07 + cloud * 0.17);
    color += mix(magenta, gold, smoothstep(0.48, 0.90, cloud))
      * threads * well * edgeFade * (0.22 + detail * 0.62);

    float rimRadius = 0.91 + (cloud - 0.5) * 0.045;
    float rim = exp(-pow((radius - rimRadius) * 43.0, 2.0));
    float halo = exp(-pow((radius - 0.87) * 10.0, 2.0));
    float knots = 0.55 + 0.45 * sin(angle * 3.0 - uTime * 0.65 + cloud * 4.0);
    color += mix(coral, gold, knots) * rim * (0.65 + cloud * 0.85);
    color += magenta * halo * 0.24;
    float flare = pow(max(0.0, cos(angle - uFlashAngle)), 32.0);
    color += vec3(3.5, 1.7, 0.7) * flare * halo * uFlash;
    color = mix(vec3(0.018, 0.024, 0.038), color, uIdle);
    gl_FragColor = vec4(color, 1.0);
    #include <encodings_fragment>
  }
`;

const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPointScale;
  uniform vec2 uRadii;
  uniform float uCenterY;
  attribute vec4 aSeed;
  varying float vAlpha;
  varying float vWarmth;
  void main() {
    float life = fract(aSeed.x + uTime / (5.5 + aSeed.z * 4.0));
    float radius = 0.95 * pow(1.0 - life, 0.68);
    float angle = aSeed.y * 6.283185 + uTime * 0.23 + life * life * 6.0;
    vec3 p = vec3(cos(angle) * radius * uRadii.x,
      sin(angle) * radius * uRadii.y + uCenterY,
      -0.022 + sin(life * 3.141593) * 0.10);
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float worldScale = length(modelMatrix[0].xyz);
    gl_PointSize = clamp((0.008 + aSeed.w * 0.014) * worldScale
      * uPointScale * projectionMatrix[1][1] / max(0.01, -mvPosition.z), 1.0, 24.0);
    vAlpha = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.72, 1.0, life));
    vWarmth = aSeed.z;
  }
`;

const particleFragment = /* glsl */ `
  varying float vAlpha;
  varying float vWarmth;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float glow = exp(-r * r * 5.0) * (1.0 - smoothstep(0.7, 1.0, r));
    float core = exp(-r * r * 32.0);
    vec3 color = mix(vec3(2.5, 0.40, 0.12), vec3(2.8, 1.9, 1.25), vWarmth);
    gl_FragColor = vec4(color + core, glow * vAlpha);
    #include <encodings_fragment>
  }
`;

export default function MirrorPortal({ geometry, idle, focused, width, height, centerY, onPortalReady }) {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uIdle: { value: 1 },
    uFlash: { value: 0 }, uFlashAngle: { value: 0 },
    uPointScale: { value: 1 },
    uRadii: { value: new THREE.Vector2(width * 0.5, height * 0.5) },
    uCenterY: { value: centerY },
  }), [width, height, centerY]);
  const particles = useMemo(() => {
    const seeds = new Float32Array(PARTICLE_COUNT * 4);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      seeds.set([(i * 0.618034) % 1, (i * 0.754878) % 1,
        (i * 0.56984) % 1, (i * 0.43858) % 1], i * 4);
    }
    return { positions: new Float32Array(PARTICLE_COUNT * 3), seeds };
  }, []);

  useFrame(({ size, gl }, delta) => {
    uniforms.uIdle.value = idle ? 1 : 0;
    if (!idle) return;
    // Keep a local clock so revisiting the island resumes without a sudden jump.
    uniforms.uTime.value += Math.min(delta, 0.05);
    uniforms.uPointScale.value = size.height * gl.getPixelRatio() * 0.5;
  });

  return (
    <group>
      <mesh ref={onPortalReady} geometry={geometry}>
        <shaderMaterial uniforms={uniforms} vertexShader={surfaceVertex}
          fragmentShader={surfaceFragment} toneMapped={false} />
      </mesh>
      <group visible={idle}>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
            <bufferAttribute attach="attributes-aSeed" args={[particles.seeds, 4]} />
          </bufferGeometry>
          <shaderMaterial uniforms={uniforms} vertexShader={particleVertex}
            fragmentShader={particleFragment} transparent depthWrite={false}
            blending={THREE.AdditiveBlending} toneMapped={false} />
        </points>
      </group>
      <PortalLightning idle={idle} focused={focused} width={width} height={height}
        centerY={centerY} portalUniforms={uniforms} />
    </group>
  );
}
