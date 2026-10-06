import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// Interleave near and far wisps. Mobile keeps the first three depth layers.
const WISPS = [
  { depth: -1, lane: 0.65, seed: 1.7, speed: 0.83 },
  { depth: 0, lane: -0.55, seed: 6.2, speed: 1.0 },
  { depth: 0.8, lane: 0.1, seed: 12.4, speed: 1.14 },
  { depth: -0.45, lane: -0.95, seed: 19.1, speed: 0.92 },
  { depth: 0.45, lane: 0.9, seed: 25.8, speed: 1.07 },
];

const VERTEX_SHADER = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSeed;
  uniform float uDepth;
  uniform float uLane;
  uniform float uSeparation;
  uniform float uSpread;
  uniform float uIrregularity;
  uniform vec2 uPointer;

  void main() {
    vUv = uv;
    vec3 p = position;
    // The source stays together; the ribbons peel apart downstream.
    float fan = clamp(uSpread, 0.0, 1.0);
    float spread = mix(smoothstep(0.04, 0.85, uv.x),
      smoothstep(0.02, 0.95, uv.x), fan);
    float curl = sin(uv.x * 7.0 - uTime * 0.32 + uSeed);
    float eddy = sin(uv.x * 13.0 + uTime * 0.19 + uSeed * 2.0);
    p.y += spread * (uLane * uSeparation * mix(0.18, 0.35 * uSpread, fan)
      + (curl * mix(0.035, 0.065, fan) + eddy * 0.035 * fan) * uIrregularity);
    p.z += uDepth * spread
      + sin(uv.x * 9.0 - uTime * 0.42 + uSeed) * spread * 0.22;
    p.xy += uPointer * uDepth * spread;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSeed;
  uniform float uOpacity;
  uniform float uIrregularity;
  uniform float uSpread;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 s = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), s.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), s.x), s.y);
  }

  float fbm(vec2 p) {
    float result = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      result += noise(p) * amplitude;
      p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03 + 7.1;
      amplitude *= 0.5;
    }
    return result;
  }

  void main() {
    vec2 uv = vUv;
    float time = uTime * 0.21;
    vec2 flow = vec2(uv.x * 5.5 - time, uv.y * 5.0) + uSeed;
    float swirl = fbm(flow);
    float detail = fbm(flow * vec2(2.1, 1.6)
      + vec2(swirl * 2.4, -time * 0.3));
    float irregularity = min(uIrregularity, 4.0);
    float center = 0.5 + (swirl - 0.47) * (0.16 + irregularity * 0.13);
    // Only the mobile profile opens into a broad cloud; larger widths keep
    // the original taper and wisp movement.
    float width = mix(
      mix(0.145, 0.025, smoothstep(0.05, 0.95, uv.x)),
      mix(0.065, 0.32, smoothstep(0.02, 0.85, uv.x)),
      clamp(uSpread, 0.0, 1.0));
    width *= 0.65 + swirl * 0.9;
    float distanceToCenter = abs(uv.y - center);
    float body = 1.0 - smoothstep(width * 0.12, width, distanceToCenter);
    // No constant opacity floor: pockets can dissolve completely.
    float pockets = smoothstep(0.27, 0.66, detail * 0.65 + swirl * 0.35);
    float filament = pow(max(0.0, 1.0 - abs(detail - 0.51) * 7.0), 3.0);
    float density = body * (pockets * 0.8 + filament * 0.1);
    float ends = smoothstep(0.0, 0.12, uv.x)
      * (1.0 - smoothstep(0.68, 1.0, uv.x));
    // Fade before the mesh boundary, even at extreme irregularity settings.
    float edge = smoothstep(0.0, 0.12, uv.y)
      * (1.0 - smoothstep(0.88, 1.0, uv.y));
    float alpha = density * ends * edge * uOpacity;
    if (alpha < 0.003) discard;
    vec3 shadow = vec3(0.32, 0.24, 0.43);
    vec3 lit = vec3(1.0, 0.79, 0.46);
    float light = clamp(0.78 - uv.x * 0.4 + filament * 0.3, 0.0, 1.0);
    gl_FragColor = vec4(mix(shadow, lit, light), alpha);
  }
`;

function Wisp({ descriptor, settings, section, layerCount, reveal }) {
  const materialRef = useRef();
  const uniforms = useRef({
    uTime: { value: 0 },
    uSeed: { value: descriptor.seed },
    uDepth: { value: 0 },
    uLane: { value: descriptor.lane },
    uSeparation: { value: settings.separation },
    uSpread: { value: settings.spread },
    uIrregularity: { value: settings.irregularity },
    uOpacity: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
  });

  useFrame((state) => {
    if (section !== 1 || !materialRef.current) return;
    const u = materialRef.current.uniforms;
    u.uTime.value = state.clock.elapsedTime * settings.flowSpeed * descriptor.speed;
    u.uDepth.value = descriptor.depth * settings.depth;
    u.uSeparation.value = settings.separation;
    u.uSpread.value = settings.spread;
    u.uIrregularity.value = settings.irregularity;
    u.uOpacity.value = settings.density * (reveal?.current ?? 1) * (5 / layerCount)
      * (descriptor.depth < 0 ? 0.8 : 1);
    u.uPointer.value.set(state.mouse.x * 0.014, state.mouse.y * 0.012);
  });

  return (
    // Vertex displacement extends beyond the undeformed plane's bounds.
    <mesh frustumCulled={false}>
      <planeGeometry args={[1, 1, 40, 12]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms.current}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function ThoughtFieldPlume({ settings, section, isMobile, reveal }) {
  const layers = isMobile ? WISPS.slice(0, 3) : WISPS;
  return layers.map((descriptor) => (
    <Wisp
      key={descriptor.seed}
      descriptor={descriptor}
      settings={settings}
      section={section}
      layerCount={layers.length}
      reveal={reveal}
    />
  ));
}
