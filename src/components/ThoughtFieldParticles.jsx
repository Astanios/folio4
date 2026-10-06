import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import BubbleShellMaterial from "./BubbleShellMaterial";
import { horizontalRange } from "./thoughtFieldPhraseBounds";
import ThoughtFieldBubblePhrases, {
  THOUGHT_PHRASES,
} from "./ThoughtFieldBubblePhrases";

const DROPLETS_PER_BUBBLE = 8;
const PARTICLE_COLORS = ["#fff9dd", "#ffe27d", "#ffd198", "#fff2c3", "#fffdf4"];
const PARTICLE_BLOOM_COLOR = new THREE.Color(2.4, 1.95, 1.35);

// Use the full visible lifetime for depth travel, rather than a fraction of
// the recycling cycle. Both the moving core and captured pop use this path.
function samplePosition(
  target,
  particle,
  cycle,
  time,
  layout,
  pointer,
  popStart,
  isMobile,
) {
  const drift = 1 - Math.pow(1 - cycle, 2);
  const p = layout.particles;
  const [flowX, flowY] = p.flowDirection;
  const progress = THREE.MathUtils.clamp(cycle / popStart, 0, 1);
  const envelope = Math.sin(Math.PI * progress);
  const hero = particle.index < THOUGHT_PHRASES.length;
  const depthScale = isMobile ? 0.75 : 1;
  const startZ = layout.orb.position[2] + p.emissionOffsetZ;
  const nearZ = p.depthNearZ - p.positionZ;
  const endZ =
    particle.depthLane === 0
      ? nearZ - particle.depthVariation * 1.5
      : startZ -
        p.depthTravel *
          depthScale *
          (particle.depthLane === 1
            ? 0.3 + particle.depthVariation * 0.2
            : 0.7 + particle.depthVariation * 0.3);
  const depthSpread = hero ? 1 : 1 + Math.max(0, startZ - endZ) * 0.045;
  const bend = p.depthCurve * depthScale;
  // The control points stay behind the foreground limit: no camera crossing.
  const control1 = Math.min(
    nearZ,
    startZ + (particle.index % 2 ? bend : -bend),
  );
  const control2 = Math.min(
    nearZ,
    endZ - bend * (0.4 + particle.depthVariation),
  );
  const inverse = 1 - progress;
  const depth =
    inverse ** 3 * startZ +
    3 * inverse ** 2 * progress * control1 +
    3 * inverse * progress ** 2 * control2 +
    progress ** 3 * endZ;
  const forward =
    drift * particle.travel * depthSpread +
    pointer.x * 0.45 * 0.12 * drift;
  const lateral =
    particle.spreadY * 1.25 * drift * depthSpread +
    envelope * Math.sin(progress * Math.PI * 2 + particle.index) * 0.35 +
    Math.sin(time * (particle.wobble + 0.3) + particle.index * 0.4) *
      0.11 *
      drift *
      p.wobbleScale +
    pointer.y * 0.24 * 0.12 * drift;
  target.set(
    layout.orb.position[0] + p.emissionOffsetX + forward * flowX - lateral * flowY,
    layout.orb.position[1] + p.emissionOffsetY + forward * flowY + lateral * flowX,
    hero
      ? startZ +
          particle.spreadZ * 1.3 * drift +
          envelope * bend * (particle.index % 2 ? -1 : 0.55) +
          Math.cos(time * (particle.wobble + 0.15) + particle.index * 0.5) *
            0.16 *
            drift *
            p.wobbleScale
      : depth,
  );
}

export default function ThoughtFieldParticles({
  section,
  thoughtFieldLayout,
  mouse,
  isMobile,
  emission,
}) {
  const groupRef = useRef();
  const meshRef = useRef();
  const coresRef = useRef();
  const dropletsRef = useRef();
  const materialRef = useRef();
  const elapsed = useRef(0);
  const wasActive = useRef(false);
  const previousInterval = useRef(null);
  const previousFlight = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const rootClip = useMemo(() => new THREE.Matrix4(), []);
  const safeRange = useMemo(() => new THREE.Vector2(), []);
  const count = isMobile ? 42 : 66;
  const heroCount = THOUGHT_PHRASES.length;
  const bursts = useRef(
    THOUGHT_PHRASES.map(() => ({
      time: -Infinity,
      position: new THREE.Vector3(),
    })),
  );
  const burstValues = useMemo(() => new Float32Array(count).fill(1), [count]);
  const seedValues = useMemo(
    () =>
      Float32Array.from(
        { length: count },
        (_, index) => (index * 0.61803398875) % 1,
      ),
    [count],
  );

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        size: index < 3 ? 0.11 - index * 0.018 : 0.018 + Math.random() * 0.04,
        speed: 0.16 + Math.random() * 0.34,
        offset: Math.random(),
        travel:
          (isMobile
            ? Math.max(
                thoughtFieldLayout.particles.spreadMobile,
                thoughtFieldLayout.phrases.spreadMobile * 0.92,
              )
            : Math.max(
                thoughtFieldLayout.particles.spreadDesktop,
                thoughtFieldLayout.phrases.spreadDesktop * 0.95,
              )) *
          (0.88 + Math.random() * 0.18),
        spreadY: THREE.MathUtils.randFloatSpread(isMobile ? 4.4 : 7.2),
        spreadZ:
          index < 2
            ? THREE.MathUtils.randFloat(0.6, 5.2)
            : THREE.MathUtils.randFloatSpread(10.4),
        depthLane: index % 4 === 0 ? 0 : index % 4 === 1 ? 1 : 2,
        depthVariation: Math.random(),
        wobble: THREE.MathUtils.randFloat(0.2, 1),
        brightness: 0.22 + Math.random() * 0.6,
        color:
          PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        popStart: THREE.MathUtils.clamp(
          thoughtFieldLayout.particles.bubblePopStart +
            THREE.MathUtils.randFloatSpread(
              thoughtFieldLayout.particles.bubblePopStartSpread,
            ),
          0.22,
          0.58,
        ),
        lastCycle: null,
        burstAt: -Infinity,
        burstPosition: new THREE.Vector3(),
        burstRadius: 0,
      })),
    [count, isMobile],
  );

  useFrame((state, delta) => {
    if (
      !meshRef.current ||
      !coresRef.current ||
      !dropletsRef.current ||
      !materialRef.current
    )
      return;
    if (section !== 1) {
      wasActive.current = false;
      return;
    }
    const layout = thoughtFieldLayout;
    const p = layout.particles;
    const phrase = layout.phrases;
    const interval = isMobile
      ? phrase.bubbleIntervalMobile
      : phrase.bubbleInterval;
    // Restart when timing changes, including a responsive breakpoint crossing,
    // so a carrier cannot skip its pop point without a matching phrase event.
    if (!wasActive.current || previousInterval.current !== interval
      || previousFlight.current !== p.bubbleCarrierFlight) {
      elapsed.current = 0;
      particles.forEach((particle) => {
        particle.lastCycle = null;
        particle.burstAt = -Infinity;
      });
      bursts.current.forEach((event) => {
        event.time = -Infinity;
      });
      wasActive.current = true;
      previousInterval.current = interval;
      previousFlight.current = p.bubbleCarrierFlight;
    }
    // Avoid missed bursts after a background tab resumes.
    elapsed.current += Math.min(delta, 0.05);
    const time = elapsed.current;
    const reveal = emission?.current ?? 1;
    const loopSeconds = heroCount * interval;
    const flightSeconds = p.bubbleCarrierFlight;
    groupRef.current.position.set(p.positionX, p.positionY, p.positionZ);
    if (phrase.bubbleHorizontalLanes) {
      groupRef.current.parent.updateWorldMatrix(true, false);
      rootClip.multiplyMatrices(state.camera.projectionMatrix, state.camera.matrixWorldInverse)
        .multiply(groupRef.current.parent.matrixWorld);
    }
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uOpacity.value = p.opacityScale * reveal;

    particles.forEach((particle, index) => {
      const hero = index < heroCount;
      const rate = hero ? 1 / loopSeconds : particle.speed * p.speedMultiplier;
      const popStart = hero ? flightSeconds / loopSeconds : particle.popStart;
      const offset = hero
        ? (flightSeconds - phrase.bubbleFirstDelay - index * interval) /
          loopSeconds
        : particle.offset;
      const cycle = THREE.MathUtils.euclideanModulo(time * rate + offset, 1);
      if (hero) {
        // Carrier destinations are root-local; subtract the wrapper once.
        const target = (
          isMobile ? phrase.bubbleTargetsMobile : phrase.bubbleTargets
        )[index];
        const [flowX, flowY] = p.flowDirection;
        let popX = target[0];
        if (phrase.bubbleHorizontalLanes) {
          const edge = 1 - 2 * phrase.bubbleViewportPadding / state.size.width;
          if (horizontalRange(safeRange, rootClip, target[1], target[2], edge)) {
            // Reserve room for the fully revealed text before choosing a lane.
            const halfWidth = phrase.bubbleMaxWidthMobile * phrase.baseScale * 0.5 + 0.15;
            const left = safeRange.x + halfWidth;
            const right = safeRange.y - halfWidth;
            popX = left <= right
              ? THREE.MathUtils.lerp(left, right, phrase.bubbleHorizontalLanes[index])
              : (safeRange.x + safeRange.y) * 0.5;
          }
        }
        const targetX = popX - p.positionX - layout.orb.position[0] - p.emissionOffsetX;
        const targetY = target[1] - p.positionY - layout.orb.position[1] - p.emissionOffsetY;
        const driftAtPop = 1 - Math.pow(1 - popStart, 2);
        // Resolve destinations in the flow's basis; mobile rises along Y.
        particle.travel = (targetX * flowX + targetY * flowY) / driftAtPop;
        particle.spreadY = (-targetX * flowY + targetY * flowX) / (1.25 * driftAtPop);
        particle.spreadZ =
          (target[2] -
            p.positionZ -
            layout.orb.position[2] -
            p.emissionOffsetZ) /
          (1.3 * driftAtPop);
      }
      const pulse =
        1 +
        Math.cos(time * p.bloomParticlePulseSpeed + index) *
          p.bloomParticlePulseAmount;
      const coreRadius =
        particle.size *
        p.bloomParticleSizeScale *
        4.8 *
        (1 + (1 - cycle) * p.bloomParticleCycleScale) *
        pulse;
      const radius = hero
        ? p.bubbleCarrierRadius * (0.94 + index * 0.025)
        : coreRadius;

      if (
        particle.lastCycle !== null &&
        rate > 0 &&
        cycle >= popStart &&
        (particle.lastCycle < popStart || cycle < particle.lastCycle)
      ) {
        particle.burstAt = time - (cycle - popStart) / rate;
        samplePosition(
          particle.burstPosition,
          particle,
          popStart,
          particle.burstAt,
          layout,
          mouse,
          popStart,
          isMobile,
        );
        particle.burstRadius = radius;
        if (hero) {
          bursts.current[index].time = particle.burstAt;
          bursts.current[index].position.copy(particle.burstPosition);
        }
      }
      particle.lastCycle = cycle;
      const age = time - particle.burstAt;
      const rupturing = age >= 0 && age < p.bubbleRuptureSeconds;
      const alive = cycle < popStart;
      if (rupturing) {
        position.copy(particle.burstPosition);
        burstValues[index] = age / p.bubbleRuptureSeconds;
      } else if (alive) {
        samplePosition(
          position,
          particle,
          cycle,
          time,
          layout,
          mouse,
          popStart,
          isMobile,
        );
        burstValues[index] = -1;
      } else {
        burstValues[index] = 1;
      }
      dummy.position.copy(position);
      dummy.rotation.set(0, 0, 0);
      // Keep the approved shell rupture, but only show its film during a pop.
      dummy.scale.setScalar(rupturing ? particle.burstRadius * reveal : 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(index, dummy.matrix);

      // Travelling particles retain their original faceted, additive glow.
      dummy.rotation.set(pulse * 5, pulse * 5, pulse * 5);
      dummy.scale.setScalar(alive && !rupturing ? coreRadius * reveal : 0);
      dummy.updateMatrix();
      coresRef.current.setMatrixAt(index, dummy.matrix);
      const colorBoost = 0.5 + particle.brightness * (0.35 + (1 - cycle) * 0.6);
      color.set(particle.color).multiplyScalar(colorBoost);
      coresRef.current.setColorAt(index, color);

      const dropping = age >= 0 && age < p.bubbleDropletSeconds;
      for (let drop = 0; drop < DROPLETS_PER_BUBBLE; drop++) {
        const dropIndex = index * DROPLETS_PER_BUBBLE + drop;
        if (dropping) {
          const angle =
            (drop * Math.PI * 2) / DROPLETS_PER_BUBBLE +
            seedValues[index] * 6.28;
          const directionZ = Math.sin(drop * 2.4 + index) * 0.42;
          const spread =
            particle.burstRadius * (0.8 + age * p.bubbleDropletSpeed);
          dummy.position.copy(particle.burstPosition);
          dummy.position.x += Math.cos(angle) * spread + age * 0.12;
          dummy.position.y += Math.sin(angle) * spread - age * age * 0.8;
          dummy.position.z += directionZ * spread;
          const fade =
            1 - THREE.MathUtils.smoothstep(age, 0.08, p.bubbleDropletSeconds);
          const size =
            particle.burstRadius *
            (0.045 + (drop % 3) * 0.012) *
            Math.sqrt(fade) * reveal;
          dummy.scale.set(size, size * (1.8 - age), size);
          dummy.rotation.set(0, 0, angle - Math.PI / 2);
          color.setRGB(1.2 * fade, 1.05 * fade, 0.8 * fade);
        } else {
          dummy.scale.setScalar(0);
          color.setRGB(0, 0, 0);
        }
        dummy.updateMatrix();
        dropletsRef.current.setMatrixAt(dropIndex, dummy.matrix);
        dropletsRef.current.setColorAt(dropIndex, color);
      }
    });
    meshRef.current.geometry.attributes.aBurst.needsUpdate = true;
    meshRef.current.instanceMatrix.needsUpdate = true;
    coresRef.current.instanceMatrix.needsUpdate = true;
    coresRef.current.instanceColor.needsUpdate = true;
    dropletsRef.current.instanceMatrix.needsUpdate = true;
    dropletsRef.current.instanceColor.needsUpdate = true;
  }, -1);

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={coresRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          color={PARTICLE_BLOOM_COLOR}
          transparent
          opacity={thoughtFieldLayout.particles.opacityScale * 0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 28, 18]}>
          <instancedBufferAttribute
            attach="attributes-aBurst"
            args={[burstValues, 1]}
            usage={THREE.DynamicDrawUsage}
          />
          <instancedBufferAttribute
            attach="attributes-aSeed"
            args={[seedValues, 1]}
          />
        </sphereGeometry>
        <BubbleShellMaterial ref={materialRef} />
      </instancedMesh>
      <instancedMesh
        ref={dropletsRef}
        args={[undefined, undefined, count * DROPLETS_PER_BUBBLE]}
        frustumCulled={false}
      >
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          transparent
          opacity={0.85}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
      <ThoughtFieldBubblePhrases
        bursts={bursts}
        clock={elapsed}
        settings={thoughtFieldLayout.phrases}
        isMobile={isMobile}
        section={section}
      />
    </group>
  );
}
