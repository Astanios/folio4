import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";

// A thin, translucent ground haze softens the shore without scene-wide fog.
const vertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragment = `
  varying vec2 vUv;
  uniform float time;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
  }
  void main() {
    vec2 p = vUv * vec2(10.0, 3.0) + vec2(time * 0.018, 0.0);
    float cloud = noise(p) * 0.65 + noise(p * 2.1 - time * 0.009) * 0.35;
    float rim = smoothstep(0.0, 0.26, vUv.y) * (1.0 - smoothstep(0.6, 1.0, vUv.y));
    float alpha = rim * smoothstep(0.2, 0.8, cloud) * 0.2;
    gl_FragColor = vec4(0.33, 0.13, 0.25, alpha);
  }
`;

export default function ContactMist({ reducedMotion, ...props }) {
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  useFrame(({ clock }) => { uniforms.time.value = reducedMotion ? 0 : clock.elapsedTime; });
  return (
    <mesh {...props} raycast={() => null}>
      <planeGeometry args={[70, 3.8]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment}
        transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
