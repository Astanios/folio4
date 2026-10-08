import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { getContactFireflyPerches, getContactSignFireflyPerches } from "./contactFireflyPerches";
import { sampleContactFirefly, assignFireflyLights, advanceFireflyLight } from "./contactFireflyMotion";

// Coordinates are in the normalized floating_island_2 model space. Keep this
// component under the same position, rotation and scale as the island model.
const ISLAND_HABITATS = [
  { center: [0.13, 0.24, -0.32], spread: [0.145, 0.055, 0.125], weight: 0.45, perch: "far" },
  { center: [0.25, 0.224, -0.21], spread: [0.1, 0.024, 0.1], weight: 0.25, perch: "stump" },
  { center: [0.02, 0.225, -0.23], spread: [0.24, 0.035, 0.115], weight: 0.3, perch: "far" },
];
// Both views follow the lower trunk and the neighboring stump. The broad left
// paths continue beyond the viewport naturally, rather than turning at its edge.
const MOBILE_HABITATS = [
  { center: [0.16, 0.235, -0.285], spread: [0.17, 0.045, 0.16], weight: 0.5, perch: "far" },
  { center: [0.25, 0.224, -0.21], spread: [0.12, 0.024, 0.105], weight: 0.3, perch: "stump" },
  { center: [0.05, 0.23, -0.21], spread: [0.23, 0.035, 0.13], weight: 0.2, perch: "far" },
];
const GREEN = new THREE.Color("#71eb52").convertSRGBToLinear();
const YELLOW = new THREE.Color("#e7ed32").convertSRGBToLinear();
// Below both canopy crowns, including the small vertical dart and sprite halo.
const FLIGHT_CEILING = 0.36;
const FLIGHT_FLOOR = 0.188;

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const vertexShader = `
  uniform float uPixelHeight;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute vec3 aColor;
  attribute vec3 aGlow;
  varying vec3 vColor;
  varying float vPulse;
  varying float vSizeGlow;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    float modelScale = length(modelMatrix[0].xyz);
    float projectedSize = aSize * modelScale * uPixelHeight *
      projectionMatrix[1][1] * 0.5 / max(0.1, -viewPosition.z);
    gl_PointSize = clamp(projectedSize, 2.0 * uPixelRatio, 30.0 * uPixelRatio) * aGlow.y;
    vPulse = aGlow.x;
    vSizeGlow = aGlow.z;
    vColor = aColor;
  }
`;

const fragmentShader = `
  uniform float uIntensity;
  varying vec3 vColor;
  varying float vPulse;
  varying float vSizeGlow;
  void main() {
    float radius = length(gl_PointCoord - 0.5) * 2.0;
    if (radius > 1.0) discard;
    float core = exp(-radius * radius * 65.0);
    float halo = exp(-radius * radius * 6.5);
    float edge = 1.0 - smoothstep(0.7, 1.0, radius);
    // HDR cores feed the existing bloom; their dim halos remain small enough
    // to preserve the island's dark silhouette and the contact inscriptions.
    float energy = (core * 5.8 + halo * 0.45) * vPulse * vSizeGlow * uIntensity;
    gl_FragColor = vec4(vColor * energy, edge);
  }
`;

export default function ContactFireflies({
  mobile = false,
  reducedMotion = false,
  count = mobile ? 43 : 57,
  speed = 1,
  intensity = 1,
  habitats = mobile ? MOBILE_HABITATS : ISLAND_HABITATS,
  signLayout,
  islandScale = 32,
  lightCount = mobile ? 2 : 4,
  lightIntensity = 3,
  lightDistance = 2.2,
  ...props
}) {
  const time = useRef(0);
  const root = useRef();
  const geometry = useRef();
  const lights = useRef([]);
  const nextSelection = useRef(0);
  const { scene } = useGLTF("/models/floating_island_2.glb");
  const { nodes: plankNodes } = useGLTF("/models/plank.glb");
  const perches = useMemo(() => getContactFireflyPerches(scene), [scene]);
  const signPerches = useMemo(() => getContactSignFireflyPerches(
    plankNodes.Plank_Broken_HP_plank_broken_0.geometry, signLayout, islandScale,
  ), [plankNodes, signLayout, islandScale]);
  const particles = useMemo(() => {
    const random = seededRandom(70421);
    const restRandom = seededRandom(10297);
    const signRandom = seededRandom(66291);
    const position = new Float32Array(count * 3);
    const spread = new Float32Array(count * 3);
    const seed = new Float32Array(count * 4);
    const size = new Float32Array(count);
    const color = new Float32Array(count * 3);
    const perch = new Float32Array(count * 3);
    const restCycle = new Float32Array(count * 4);
    const totalWeight = habitats.reduce((sum, habitat) => sum + habitat.weight, 0);

    for (let index = 0; index < count; index += 1) {
      let choice = random() * totalWeight;
      const habitat = habitats.find((candidate) => {
        choice -= candidate.weight;
        return choice <= 0;
      }) ?? habitats[habitats.length - 1];
      const radius = 0.5 + random() * 0.5;
      position.set(habitat.center, index * 3);
      // A different altitude for every insect prevents flat rings in the air.
      position[index * 3 + 1] += (random() - 0.5) * habitat.spread[1];
      spread.set(habitat.spread.map((value) => value * radius), index * 3);
      position[index * 3 + 1] = THREE.MathUtils.clamp(
        position[index * 3 + 1], FLIGHT_FLOOR + 0.008, FLIGHT_CEILING - 0.008);
      // Bound the full wave, rather than clipping its peaks into a flat ceiling:
      // vertical sines reach 1.24 * spread, and the dart adds at most 0.004.
      spread[index * 3 + 1] = Math.min(spread[index * 3 + 1],
        Math.max(0, (FLIGHT_CEILING - position[index * 3 + 1] - 0.008) / 1.24),
        Math.max(0, (position[index * 3 + 1] - FLIGHT_FLOOR - 0.004) / 1.24));
      seed.set([
        random() * Math.PI * 2,
        random() * Math.PI * 2,
        0.65 + random() * 0.8,
        0.65 + random() * 1.2,
      ], index * 4);
      size[index] = 0.014 + random() * 0.017;
      GREEN.clone().lerp(YELLOW, random()).toArray(color, index * 3);
      const surfaceName = habitat.perch ?? (habitat.center[2] > 0.15 ? "near" : "far");
      // A minority visit the signs; independent randomness preserves the
      // existing flight paths, colors and staggered pauses around the trees.
      const surfaces = signPerches.length && signRandom() < 0.24
        ? signPerches : perches[surfaceName] ?? [];
      perch.set(surfaces[Math.floor(restRandom() * surfaces.length)] ?? habitat.center, index * 3);
      const period = 22 + restRandom() * 12;
      restCycle.set([period, restRandom() * period, 3 + restRandom() * 3, surfaces.length ? 1 : 0], index * 4);
    }
    return { position, spread, seed, size, color, perch, restCycle };
  }, [count, habitats, perches, signPerches]);
  const motion = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const glow = new Float32Array(count * 3);
    const landing = new Float32Array(count);
    for (let index = 0; index < count; index += 1) {
      sampleContactFirefly(particles, index, time.current, speed, positions, glow, landing);
    }
    return { positions, glow, landing, scores: new Float32Array(count),
      order: Array.from({ length: count }, (_, index) => index) };
  }, [particles, count]);
  const lightSlots = useMemo(() => Array.from(
    { length: Math.min(count, Math.max(0, Math.floor(lightCount))) },
    () => ({ index: -1, target: -1, weight: 0 }),
  ), [particles, count, lightCount]);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const uniforms = useMemo(() => ({
    uIntensity: { value: intensity },
    uPixelHeight: { value: 720 },
    uPixelRatio: { value: 1 },
  }), []);

  useFrame(({ gl, size: viewportSize, camera }, delta) => {
    const dt = Math.min(delta, 0.06);
    // Preserve the original clock even while the coast is outside the camera.
    if (!reducedMotion) time.current += dt;
    for (let parent = root.current; parent; parent = parent.parent) {
      if (!parent.visible) return;
    }
    uniforms.uIntensity.value = intensity;
    uniforms.uPixelRatio.value = gl.getPixelRatio();
    uniforms.uPixelHeight.value = viewportSize.height * gl.getPixelRatio();
    const { positions, glow, landing, scores, order } = motion;
    for (let index = 0; index < count; index += 1) {
      sampleContactFirefly(particles, index, time.current, speed, positions, glow, landing);
    }
    geometry.current.attributes.position.needsUpdate = true;
    geometry.current.attributes.aGlow.needsUpdate = true;

    // Favor visible, bright insects close to bark, signs, or the floor. The
    // short-range light pool is reassigned slowly, never one light per sprite.
    nextSelection.current -= dt;
    if (nextSelection.current <= 0) {
      nextSelection.current = 0.45;
      root.current.updateWorldMatrix(true, false);
      for (let index = 0; index < count; index += 1) {
        const p = index * 3;
        projected.fromArray(positions, p).applyMatrix4(root.current.matrixWorld).project(camera);
        if (Math.abs(projected.x) > 1.12 || Math.abs(projected.y) > 1.12 || Math.abs(projected.z) > 1) {
          scores[index] = 0;
          continue;
        }
        const perchDistance = Math.hypot(positions[p] - particles.perch[p],
          positions[p + 1] - particles.perch[p + 1], positions[p + 2] - particles.perch[p + 2]);
        const surfaceDistance = Math.min(perchDistance, Math.abs(positions[p + 1] - FLIGHT_FLOOR)) * islandScale;
        const proximity = 1 - THREE.MathUtils.smoothstep(surfaceDistance, 0.1, lightDistance);
        scores[index] = glow[p] * glow[p + 2] * (0.15 + proximity + landing[index] * 0.5);
      }
      assignFireflyLights(lightSlots, scores, order);
    }
    lightSlots.forEach((slot, slotIndex) => {
      const light = lights.current[slotIndex];
      if (!light) return;
      advanceFireflyLight(slot, dt);
      if (slot.index < 0) { light.intensity = 0; return; }
      const p = slot.index * 3;
      light.position.fromArray(positions, p);
      light.color.fromArray(particles.color, p);
      light.intensity = lightIntensity * intensity * glow[p] * glow[p + 2] * slot.weight;
      // Three's cutoff is in world units, even inside the scaled island group.
      light.distance = lightDistance * (0.85 + 0.15 * glow[p + 1]);
    });
  });

  return (
    <group ref={root} {...props}>
      <points frustumCulled={false} raycast={() => null}>
        <bufferGeometry ref={geometry}>
          <bufferAttribute attach="attributes-position" args={[motion.positions, 3]} usage={THREE.DynamicDrawUsage} />
          <bufferAttribute attach="attributes-aGlow" args={[motion.glow, 3]} usage={THREE.DynamicDrawUsage} />
          <bufferAttribute attach="attributes-aSize" args={[particles.size, 1]} />
          <bufferAttribute attach="attributes-aColor" args={[particles.color, 3]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
          depthTest
          toneMapped={false}
        />
      </points>
      {lightSlots.map((_, index) => (
        <pointLight key={index} ref={(light) => { lights.current[index] = light; }}
          intensity={0} distance={lightDistance} decay={2} castShadow={false} />
      ))}
    </group>
  );
}
