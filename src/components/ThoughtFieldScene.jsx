import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Hand from "./Hand";
import ThoughtFieldParticles from "./ThoughtFieldParticles";
import ThoughtFieldSparks from "./ThoughtFieldSparks";
import ThoughtFieldPlume from "./ThoughtFieldPlume";
import ThoughtFieldIslands from "./ThoughtFieldIslands";
import CompanyIslandScene from "./CompanyIslandScene";
import { THOUGHT_FIELD_LAYOUT } from "./thoughtFieldLayout";

const ORB_BLOOM_COLOR = new THREE.Color(2.3, 1.8, 1.15);
const PLUME_TILT_AXIS = new THREE.Vector3(0, 0, 1);
const HAND_ENTRANCE_SECONDS = 0.65;
const PARTICLE_DELAY_SECONDS = 0.5;

export default function ThoughtFieldScene({ section, thoughtFieldLayout: sourceLayout = THOUGHT_FIELD_LAYOUT,
  companyIslandRef, companyIslandLayout, openingTransition, onPortalReady }) {
  const rootRef = useRef();
  const foregroundRef = useRef();
  const orbRef = useRef();
  const orbAuraRef = useRef();
  const handRef = useRef();
  const orbLightRef = useRef();
  const fillLightRef = useRef();
  const backgroundReveal = useRef(0);
  const emission = useRef(0);
  const entranceTime = useRef(null);
  const flowingRef = useRef(false);
  const [flowing, setFlowing] = useState(false);
  const { mouse, size } = useThree();
  const isMobile = size.width < 768;
  const thoughtFieldLayout = useMemo(() => {
    if (!isMobile) return sourceLayout;
    // Bring the foreground into the portrait viewport without moving the
    // islands or the camera's later approach destination.
    const shiftX = 3.7;
    return {
      ...sourceLayout,
      hand: { ...sourceLayout.hand, position: [sourceLayout.hand.position[0] + shiftX, ...sourceLayout.hand.position.slice(1)] },
      orb: { ...sourceLayout.orb, position: [sourceLayout.orb.position[0] + shiftX, ...sourceLayout.orb.position.slice(1)] },
      particles: { ...sourceLayout.particles, positionX: 0 },
      sparks: { ...sourceLayout.sparks, baseX: sourceLayout.sparks.baseX + shiftX },
    };
  }, [isMobile, sourceLayout]);
  const plumeTargetQuat = useMemo(() => new THREE.Quaternion(), []);
  const plumeTiltQuat = useMemo(() => new THREE.Quaternion(), []);
  const worldSection = section === 3 ? 0 : 1;

  useFrame((state, delta) => {
    const progress = openingTransition.current.progress;
    const inWorld = section !== 3;
    rootRef.current.visible = inWorld;
    backgroundReveal.current = THREE.MathUtils.smoothstep(progress, 0.12, 0.68);
    // The islands arrive first. Start this clock only near the end of the ascent,
    // and keep it running through the later island approach and return journey.
    if (!inWorld || progress < 0.6) entranceTime.current = null;
    else if (progress >= 0.86 && entranceTime.current === null) entranceTime.current = 0;
    if (entranceTime.current !== null) entranceTime.current += Math.min(delta, 0.05);
    const elapsed = entranceTime.current ?? 0;
    const active = THREE.MathUtils.smoothstep(elapsed, 0, HAND_ENTRANCE_SECONDS)
      * THREE.MathUtils.smoothstep(progress, 0.56, 0.86);
    foregroundRef.current.position.x = -18 * (1 - active);
    foregroundRef.current.visible = inWorld && active > 0.001;
    const emissionTime = elapsed - HAND_ENTRANCE_SECONDS - PARTICLE_DELAY_SECONDS;
    emission.current = THREE.MathUtils.smoothstep(emissionTime, 0, 0.5)
      * THREE.MathUtils.smoothstep(progress, 0.65, 0.86);
    const nextFlowing = inWorld && entranceTime.current !== null && emissionTime >= 0 && progress > 0.6;
    if (nextFlowing !== flowingRef.current) {
      flowingRef.current = nextFlowing;
      setFlowing(nextFlowing);
    }
    const t = state.clock.elapsedTime;
    const pointerX = mouse.x * 0.45 * active;
    const pointerY = mouse.y * 0.24 * active;
    if (handRef.current) {
      handRef.current.position.set(
        thoughtFieldLayout.hand.position[0] + pointerX * 0.16,
        thoughtFieldLayout.hand.position[1] +
          Math.sin(t * 0.55) * 0.04 +
          pointerY * 0.08,
        thoughtFieldLayout.hand.position[2],
      );
      handRef.current.rotation.x =
        thoughtFieldLayout.hand.rotation[0] + Math.cos(t * 0.35) * 0.02;
      handRef.current.rotation.y =
        thoughtFieldLayout.hand.rotation[1] + Math.sin(t * 0.28) * 0.02;
      handRef.current.rotation.z =
        thoughtFieldLayout.hand.rotation[2] + Math.sin(t * 0.42) * 0.03;
    }

    const orbPulse =
      1 + Math.sin(t * 1.1) * 0.035 + Math.sin(t * 2.7 + 0.9) * 0.015 * active;

    if (orbRef.current) {
      orbRef.current.position.set(
        thoughtFieldLayout.orb.position[0] + pointerX * 0.05,
        thoughtFieldLayout.orb.position[1] + pointerY * 0.04,
        thoughtFieldLayout.orb.position[2],
      );
      orbRef.current.rotation.x += delta * 0.18 * active;
      orbRef.current.rotation.y += delta * 0.23 * active;
      orbRef.current.scale.setScalar(thoughtFieldLayout.orb.scale * orbPulse);
    }

    if (orbAuraRef.current) {
      orbAuraRef.current.position.copy(orbRef.current.position);
      const auraWidth =
        thoughtFieldLayout.orb.auraScale * thoughtFieldLayout.plume.length;
      const orbRadius = thoughtFieldLayout.orb.scale * 0.82 * orbPulse;
      orbAuraRef.current.position.x +=
        orbRadius +
        auraWidth * 0.5 +
        pointerX * 0.06 +
        thoughtFieldLayout.plume.offsetX;
      orbAuraRef.current.position.y +=
        pointerY * 0.04 + thoughtFieldLayout.plume.offsetY;
      orbAuraRef.current.position.z += thoughtFieldLayout.plume.offsetZ;
      plumeTiltQuat.setFromAxisAngle(
        PLUME_TILT_AXIS,
        thoughtFieldLayout.plume.rotationZ,
      );
      plumeTargetQuat.copy(state.camera.quaternion).multiply(plumeTiltQuat);
      orbAuraRef.current.quaternion.slerp(plumeTargetQuat, 0.16);
      orbAuraRef.current.scale.set(
        auraWidth,
        thoughtFieldLayout.orb.auraScale *
          (thoughtFieldLayout.plume.availableArea + Math.sin(t * 0.61) * 0.06),
        1,
      );
    }

    if (orbLightRef.current) {
      orbLightRef.current.intensity = THREE.MathUtils.damp(
        orbLightRef.current.intensity,
        active * thoughtFieldLayout.orb.lightIntensity,
        4,
        delta,
      );
    }

    if (fillLightRef.current) {
      fillLightRef.current.intensity = THREE.MathUtils.damp(
        fillLightRef.current.intensity,
        active * thoughtFieldLayout.fillLight.intensity,
        4,
        delta,
      );
    }

  });

  return (
    <group ref={rootRef} position={thoughtFieldLayout.root.activePosition}>
      <ThoughtFieldIslands section={worldSection} settings={thoughtFieldLayout.islands} reveal={backgroundReveal} />
      <CompanyIslandScene ref={companyIslandRef} section={worldSection} reveal={backgroundReveal}
        settings={thoughtFieldLayout.islands} layout={companyIslandLayout} onPortalReady={onPortalReady} />
      <group ref={foregroundRef} position={[-18, 0, 0]} visible={false}>
        <group ref={handRef}><Hand scale={thoughtFieldLayout.hand.scale} /></group>
        <group visible={flowing}>
          <group ref={orbAuraRef}>
            <ThoughtFieldPlume settings={thoughtFieldLayout.plume} section={flowing ? 1 : 0}
              isMobile={isMobile} reveal={emission} />
          </group>
        </group>
        <mesh ref={orbRef}>
          <icosahedronGeometry args={[0.82, 5]} />
          <meshBasicMaterial color={ORB_BLOOM_COLOR} toneMapped={false} />
        </mesh>
        <pointLight ref={orbLightRef} position={thoughtFieldLayout.orb.lightPosition}
          color="#ffc96b" intensity={0} distance={thoughtFieldLayout.orb.lightDistance} decay={2} />
        <pointLight ref={fillLightRef} position={thoughtFieldLayout.fillLight.position}
          color="#4453c7" intensity={0} distance={thoughtFieldLayout.fillLight.distance} decay={2} />
      </group>
      <group visible={flowing}>
        <ThoughtFieldSparks section={flowing ? 1 : 0} emission={emission}
          thoughtFieldLayout={thoughtFieldLayout} mouse={mouse} isMobile={isMobile} />
        <ThoughtFieldParticles section={flowing ? 1 : 0} emission={emission}
          thoughtFieldLayout={thoughtFieldLayout} mouse={mouse} isMobile={isMobile} />
      </group>
    </group>
  );
}
