import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const skyVertex = `
  uniform mat4 uCameraWorld;
  uniform mat4 uProjectionInverse;
  varying vec3 vDirection;
  void main() {
    vec4 ray = uProjectionInverse * vec4(position.xy, 1.0, 1.0);
    vDirection = mat3(uCameraWorld) * ray.xyz;
    // Far depth: the sky never paints over an island, scroll or mirror.
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

const skyFragment = `
  uniform float uTime;
  uniform float uReveal;
  uniform float uDetail;
  varying vec3 vDirection;

  float hash(vec3 p) {
    p = fract(p * vec3(0.1031, 0.11369, 0.13787));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float sum = 0.0;
    float amplitude = 0.52;
    for (int i = 0; i < 5; i++) {
      if (float(i) >= uDetail) break;
      sum += noise(p) * amplitude;
      p = p.yzx * 2.07 + vec3(4.1, 7.3, 2.8);
      amplitude *= 0.48;
    }
    return sum;
  }
  void main() {
    vec3 ray = normalize(vDirection);
    vec3 p = ray * 3.4 + vec3(2.1, 0.6, uTime * 0.0015);
    vec3 warp = vec3(noise(p + 4.7), noise(p.yzx + 9.2), noise(p.zxy + 1.8));
    float cloud = fbm(p * 2.3 + warp * 2.4);
    float folds = noise(p * 7.0 + warp * 4.0);
    float band = dot(ray, normalize(vec3(0.48, 0.84, -0.24)));
    float envelope = exp(-pow((band + (warp.x - 0.5) * 0.35) * 2.5, 2.0));
    float vapor = smoothstep(0.27, 0.78, cloud) * envelope;
    float rifts = smoothstep(0.3, 0.68, folds) * vapor;
    vec3 ink = mix(vec3(0.004, 0.006, 0.019), vec3(0.018, 0.008, 0.047),
      0.5 + 0.5 * ray.y);
    vec3 cloudColor = mix(vec3(0.045, 0.085, 0.19), vec3(0.19, 0.038, 0.115),
      smoothstep(0.25, 0.75, warp.y));
    vec3 color = ink + cloudColor * vapor * 0.8;
    color += vec3(0.095, 0.07, 0.16) * rifts * 0.24;
    color *= 1.0 - smoothstep(0.54, 0.82, folds) * envelope * 0.38;
    gl_FragColor = vec4(color, uReveal);
  }
`;

const starVertex = `
  attribute float aSize;
  attribute float aLight;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vFlare;
  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * view;
    gl_Position.z = gl_Position.w * 0.99999;
    float perspective = sqrt(360.0 / max(60.0, -view.z));
    gl_PointSize = clamp(aSize * uPixelRatio * perspective, 1.0, 14.0 * uPixelRatio);
    float shimmer = 0.94 + 0.06 * sin(uTime * 0.47 + aPhase)
      + 0.025 * sin(uTime * 0.19 + aPhase * 3.0);
    vColor = aColor * aLight * shimmer;
    vFlare = step(4.6, aSize);
  }
`;

const starFragment = `
  uniform float uReveal;
  varying vec3 vColor;
  varying float vFlare;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float r = length(p);
    float core = exp(-r * r * 110.0);
    float halo = exp(-r * r * 17.0) * 0.17;
    float rays = (exp(-abs(p.x) * 95.0 - abs(p.y) * 8.0)
      + exp(-abs(p.y) * 95.0 - abs(p.x) * 8.0)) * 0.12 * vFlare;
    float alpha = (core + halo + rays) * (1.0 - smoothstep(0.34, 0.5, r)) * uReveal;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

function starData(count, seed, near, far) {
  let state = seed;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const lights = new Float32Array(count);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const y = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const ring = Math.sqrt(1 - y * y);
    const radius = THREE.MathUtils.lerp(near, far, random());
    positions.set([Math.cos(angle) * ring * radius, y * radius, Math.sin(angle) * ring * radius], i * 3);
    const prominent = random() > 0.972;
    sizes[i] = prominent ? 4.7 + random() * 2.4 : 1.2 + Math.pow(random(), 2) * 2.4;
    lights[i] = prominent ? 1.6 + random() * 1.2 : 0.3 + Math.pow(random(), 2) * 1.05;
    phases[i] = random() * Math.PI * 2;
    const temperature = random();
    colors.set(temperature < 0.2 ? [1, 0.8, 0.62]
      : temperature > 0.65 ? [0.62, 0.78, 1] : [0.9, 0.94, 1], i * 3);
  }
  return { positions, colors, sizes, lights, phases };
}

function StarLayer({ count, seed, near, far, reveal, motion, order }) {
  const data = useMemo(() => starData(count, seed, near, far), [count, seed, near, far]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uReveal: { value: 0 }, uPixelRatio: { value: 1 },
  }), []);
  useFrame((state) => {
    uniforms.uTime.value = motion ? state.clock.elapsedTime : 0;
    uniforms.uReveal.value = reveal.current;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });
  return (
    <points frustumCulled={false} renderOrder={order} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[data.colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[data.sizes, 1]} />
        <bufferAttribute attach="attributes-aLight" args={[data.lights, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[data.phases, 1]} />
      </bufferGeometry>
      <shaderMaterial uniforms={uniforms} vertexShader={starVertex} fragmentShader={starFragment}
        transparent depthWrite={false} depthTest blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

export default function SpaceBackground({ openingTransition, section }) {
  const scene = useThree((state) => state.scene);
  const isMobile = useThree((state) => state.size.width < 768);
  const scroll = useScroll();
  const root = useRef();
  const reveal = useRef(0);
  const motion = useMemo(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const uniforms = useMemo(() => ({
    uCameraWorld: { value: new THREE.Matrix4() },
    uProjectionInverse: { value: new THREE.Matrix4() },
    uTime: { value: 0 }, uReveal: { value: 0 }, uDetail: { value: 5 },
  }), []);

  useFrame((state) => {
    // Zero contribution throughout the sunset. On return, the space layer is
    // gone before the sun/halo re-enters. Contact's sunset is protected too.
    reveal.current = section === 3 ? 0
      : THREE.MathUtils.smoothstep(openingTransition.current.progress, 0.78, 0.99)
        * (1 - THREE.MathUtils.smoothstep(scroll.offset, 0.69, 0.75));
    root.current.visible = reveal.current > 0;
    uniforms.uReveal.value = reveal.current;
    uniforms.uTime.value = motion ? state.clock.elapsedTime : 0;
    uniforms.uDetail.value = isMobile ? 3 : 5;
  });

  // Keep the sky and both star shells outside the translated page group.
  // Their real world depths give different parallax during the island flight.
  return createPortal(
    <group ref={root} visible={false}>
      <mesh frustumCulled={false} renderOrder={-2000} raycast={() => null}
        onBeforeRender={(_, __, camera) => {
          uniforms.uCameraWorld.value.copy(camera.matrixWorld);
          uniforms.uProjectionInverse.value.copy(camera.projectionMatrixInverse);
        }}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial uniforms={uniforms} vertexShader={skyVertex} fragmentShader={skyFragment}
          transparent depthWrite={false} depthTest toneMapped={false} />
      </mesh>
      <StarLayer count={isMobile ? 3200 : 5000} seed={4718} near={420} far={780}
        reveal={reveal} motion={motion} order={-1990} />
      <StarLayer count={isMobile ? 420 : 700} seed={9137} near={180} far={300}
        reveal={reveal} motion={motion} order={-1980} />
    </group>, scene,
  );
}
