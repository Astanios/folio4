import { useFrame, useLoader } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const WATER_FRAGMENT_SHADER = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  uniform sampler2D uNormals;
  uniform float uTime;
  uniform float uRipples;
  uniform float uOpacity;
  uniform vec3 uWaterColor;
  uniform vec3 uHorizonColor;

  void main() {
    vec2 p = vWorldPosition.xz;
    // Reuse the ocean's normal texture, sampled in world space so the
    // ripples naturally become finer as the surface recedes in perspective.
    vec3 a = texture2D(uNormals, p * 0.018 + vec2(uTime * 0.023, 0.0)).rgb;
    vec3 b = texture2D(uNormals, p * 0.031 + vec2(-uTime * 0.015, uTime * 0.01)).rgb;
    float normal = (a.g + b.r) * 0.5;
    float glints = smoothstep(0.42, 0.65, normal);
    float farFade = smoothstep(0.45, 1.0, vUv.y);
    float bands = pow(0.5 + 0.5 * sin(p.y * 0.85 + (a.r - 0.5) * 3.0 + uTime * 0.4), 6.0);
    vec3 color = mix(uWaterColor, uHorizonColor * 0.45, farFade);
    color += uHorizonColor * (0.3 + glints * 0.7) * bands * uRipples * (1.0 - farFade);
    // Dissolve the finite far edge into the atmospheric band.
    float alpha = (1.0 - smoothstep(0.97, 1.0, vUv.y)) * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

const HAZE_FRAGMENT_SHADER = `
  varying vec2 vUv;
  uniform vec3 uHorizonColor;
  uniform float uOpacity;
  void main() {
    float y = (vUv.y - 0.5) * 2.0;
    float core = exp(-abs(y) * 22.0);
    float atmosphere = exp(-y * y * (y > 0.0 ? 9.0 : 22.0));
    float edge = smoothstep(0.0, 0.08, vUv.x)
      * (1.0 - smoothstep(0.92, 1.0, vUv.x));
    float alpha = (core * 0.35 + atmosphere * 0.65) * edge * uOpacity;
    gl_FragColor = vec4(uHorizonColor, alpha);
  }
`;

export default function ThoughtFieldHorizon({ section, settings }) {
  const normals = useLoader(THREE.TextureLoader, "/waternormals.jpeg");
  const waterMaterial = useRef();
  const hazeMaterial = useRef();
  const waterUniforms = useRef({
    uNormals: { value: normals },
    uTime: { value: 0 },
    uRipples: { value: settings.ripples },
    uOpacity: { value: settings.waterOpacity },
    uWaterColor: { value: new THREE.Color(settings.waterColor) },
    uHorizonColor: { value: new THREE.Color(settings.color) },
  });
  const hazeUniforms = useRef({
    uHorizonColor: { value: new THREE.Color(settings.color) },
    uOpacity: { value: settings.hazeOpacity },
  });

  useFrame((_, delta) => {
    if (section !== 1 || !settings.visible || !waterMaterial.current || !hazeMaterial.current) return;
    const water = waterMaterial.current.uniforms;
    const haze = hazeMaterial.current.uniforms;
    water.uTime.value += delta * settings.flowSpeed;
    water.uRipples.value = settings.ripples;
    water.uOpacity.value = settings.waterOpacity;
    water.uWaterColor.value.set(settings.waterColor);
    water.uHorizonColor.value.set(settings.color);
    haze.uHorizonColor.value.set(settings.color);
    haze.uOpacity.value = settings.hazeOpacity;
  });

  return (
    <group visible={section === 1 && settings.visible}>
      <mesh
        position={[0, settings.height, -settings.distance + settings.waterDepth / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[settings.width, settings.waterDepth, 1]}
      >
        <planeGeometry />
        <shaderMaterial
          ref={waterMaterial}
          uniforms={waterUniforms.current}
          vertexShader={VERTEX_SHADER}
          fragmentShader={WATER_FRAGMENT_SHADER}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh
        position={[0, settings.height, -settings.distance - 1]}
        scale={[settings.width, settings.hazeHeight, 1]}
      >
        <planeGeometry />
        <shaderMaterial
          ref={hazeMaterial}
          uniforms={hazeUniforms.current}
          vertexShader={VERTEX_SHADER}
          fragmentShader={HAZE_FRAGMENT_SHADER}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
