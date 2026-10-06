import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createPortalLightning } from "./portalLightningPaths";

const MAX_SEGMENTS = 768;
const VERTICES_PER_SEGMENT = 6;

const boltVertex = /* glsl */ `
  uniform vec2 uResolution;
  uniform float uBoltWidth;
  attribute vec3 aOther;
  attribute vec2 aSide;
  attribute float aStrength;
  varying float vSide;
  varying float vStrength;
  void main() {
    vec4 current = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec4 other = projectionMatrix * modelViewMatrix * vec4(aOther, 1.0);
    vec2 direction = (other.xy / other.w - current.xy / current.w) * uResolution;
    direction /= max(length(direction), 0.001);
    vec2 normal = vec2(-direction.y, direction.x) * (1.0 - 2.0 * aSide.y);
    current.xy += normal * aSide.x * uBoltWidth * aStrength * 2.0 / uResolution * current.w;
    gl_Position = current;
    vSide = aSide.x;
    vStrength = aStrength;
  }
`;
const boltFragment = /* glsl */ `
  uniform float uFlash;
  varying float vSide;
  varying float vStrength;
  void main() {
    float halo = pow(max(0.0, 1.0 - abs(vSide)), 1.8);
    float core = exp(-vSide * vSide * 40.0);
    vec3 color = vec3(2.6, 0.70, 0.20) + vec3(3.2, 3.0, 2.7) * core;
    gl_FragColor = vec4(color, halo * uFlash * vStrength);
    #include <encodings_fragment>
  }
`;

function writeGeometry(buffers, segments) {
  const count = Math.min(segments.length, MAX_SEGMENTS);
  // Two triangles per segment, widened in screen space by the vertex shader.
  const endpointOrder = [0, 0, 1, 0, 1, 1];
  for (let segment = 0; segment < count; segment++) {
    const { start, end, startStrength, endStrength } = segments[segment];
    for (let vertex = 0; vertex < VERTICES_PER_SEGMENT; vertex++) {
      const index = segment * VERTICES_PER_SEGMENT + vertex;
      const endpoint = endpointOrder[vertex];
      (endpoint ? end : start).toArray(buffers.positions, index * 3);
      (endpoint ? start : end).toArray(buffers.other, index * 3);
      buffers.strength[index] = endpoint ? endStrength : startStrength;
    }
  }
  return count * VERTICES_PER_SEGMENT;
}

export default function PortalLightning({ idle, focused, width, height, centerY, portalUniforms }) {
  const group = useRef();
  const bolts = useRef();
  const light = useRef();
  const burst = useRef({ next: 0, start: -10, pulses: [], pulse: -1, energy: 1 });
  const worldScale = useMemo(() => new THREE.Vector3(), []);
  const uniforms = useMemo(() => ({
    uResolution: { value: new THREE.Vector2(1, 1) },
    uBoltWidth: { value: 3.5 }, uFlash: { value: 0 },
  }), []);
  const buffers = useMemo(() => {
    const count = MAX_SEGMENTS * VERTICES_PER_SEGMENT;
    const side = new Float32Array(count * 2);
    const pattern = [-1, 0, 1, 0, 1, 1, -1, 0, 1, 1, -1, 1];
    for (let segment = 0; segment < MAX_SEGMENTS; segment++) side.set(pattern, segment * 12);
    return { positions: new Float32Array(count * 3), other: new Float32Array(count * 3),
      strength: new Float32Array(count), side };
  }, []);

  useEffect(() => {
    burst.current.start = -10;
    burst.current.next = portalUniforms.uTime.value + 2 + Math.random() * 3;
  }, [idle, focused, portalUniforms]);

  useFrame(({ camera, size }) => {
    const time = portalUniforms.uTime.value;
    const strike = burst.current;
    if (idle && time >= strike.next) {
      strike.start = time;
      strike.next = time + 2 + Math.random() * 3;
      strike.energy = 0.75 + Math.random() * 0.65;
      strike.pulse = -1;
      strike.pulses = [{ time: 0, strength: 1, decay: 24 + Math.random() * 12 }];
      const restrikes = 1 + Math.floor(Math.random() * 3);
      for (let index = 1; index <= restrikes; index++) {
        strike.pulses.push({ time: index * (0.055 + Math.random() * 0.055),
          strength: 0.4 + Math.random() * 0.5, decay: 20 + Math.random() * 20 });
      }
      strike.pulses.sort((a, b) => a.time - b.time);
    }
    const age = time - strike.start;
    let flash = 0;
    let pulse = -1;
    if (idle && age < 0.65) {
      strike.pulses.forEach((part, index) => {
        const elapsed = age - part.time;
        if (elapsed >= 0) {
          pulse = index;
          flash += part.strength * Math.exp(-elapsed * part.decay)
            * Math.min(elapsed / 0.008, 1);
        }
      });
    }
    if (pulse > strike.pulse) {
      strike.pulse = pulse;
      group.current.updateWorldMatrix(true, false);
      camera.updateMatrixWorld();
      const discharge = createPortalLightning({ camera, matrixWorld: group.current.matrixWorld,
        width, height, centerY, viewport: size, focused });
      portalUniforms.uFlashAngle.value = discharge.flashAngle;
      const geometry = bolts.current.geometry;
      geometry.setDrawRange(0, writeGeometry(buffers, discharge.segments));
      ["position", "aOther", "aStrength"].forEach((name) => {
        geometry.attributes[name].needsUpdate = true;
      });
      light.current.position.copy(discharge.lightPosition);
      light.current.position.z += 0.22;
      group.current.getWorldScale(worldScale);
      light.current.distance = Math.max(worldScale.x, worldScale.y, worldScale.z) * 7;
      uniforms.uBoltWidth.value = 2.8 + Math.random() * 2.0;
    }
    flash = Math.min(flash * strike.energy, 1.25);
    uniforms.uResolution.value.set(size.width, size.height);
    uniforms.uFlash.value = flash;
    portalUniforms.uFlash.value = flash;
    bolts.current.visible = idle && flash > 0.008;
    light.current.intensity = flash * (focused ? 2.2 : 0.45);
  });

  return (
    <group ref={group}>
      <mesh ref={bolts} frustumCulled={false} visible={false} raycast={() => null}>
        <bufferGeometry drawRange={{ start: 0, count: 0 }}>
          <bufferAttribute attach="attributes-position" args={[buffers.positions, 3]} usage={THREE.DynamicDrawUsage} />
          <bufferAttribute attach="attributes-aOther" args={[buffers.other, 3]} usage={THREE.DynamicDrawUsage} />
          <bufferAttribute attach="attributes-aSide" args={[buffers.side, 2]} />
          <bufferAttribute attach="attributes-aStrength" args={[buffers.strength, 1]} usage={THREE.DynamicDrawUsage} />
        </bufferGeometry>
        <shaderMaterial uniforms={uniforms} vertexShader={boltVertex} fragmentShader={boltFragment}
          transparent depthWrite={false} side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <pointLight ref={light} color="#fff0cf" intensity={0} decay={2} />
    </group>
  );
}
