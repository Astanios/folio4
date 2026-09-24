import { Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import Hand from "./Hand";
import ThoughtFieldParticles from "./ThoughtFieldParticles";
import ThoughtFieldSparks from "./ThoughtFieldSparks";
import { THOUGHT_FIELD_LAYOUT } from "./thoughtFieldLayout";

const PHRASES = [
  "I just like making stuff.",
  "This seemed safer than building rockets.",
  "This escalated into software.",
  "I have been told to stop opening new side projects.",
  "Bad at sitting still.",
  "An unreasonable amount of joy from making things work.",
];

const GLYPHS = ["{}", "</>", "[]", "()", "::", "01", "/*", "*/", "#"];

const SURFACE = new THREE.MeshStandardMaterial({
  color: "#342519",
  emissive: "#ff9622",
  emissiveIntensity: 0.1,
  roughness: 0.72,
  metalness: 0.12,
});

function LegoBlock(props) {
  return (
    <group {...props}>
      <mesh material={SURFACE}>
        <boxGeometry args={[0.85, 0.48, 0.62]} />
      </mesh>
      {[
        [-0.22, 0.3, -0.16],
        [0.22, 0.3, -0.16],
        [-0.22, 0.3, 0.16],
        [0.22, 0.3, 0.16],
      ].map((position, index) => (
        <mesh key={index} position={position} material={SURFACE}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 18]} />
        </mesh>
      ))}
    </group>
  );
}

function GearFragment(props) {
  const teeth = Array.from({ length: 8 }, (_, index) => index);

  return (
    <group {...props}>
      <mesh material={SURFACE}>
        <torusGeometry args={[0.42, 0.12, 16, 32, Math.PI * 1.6]} />
      </mesh>
      {teeth.map((tooth) => {
        const angle = THREE.MathUtils.lerp(
          -0.6,
          2.35,
          tooth / (teeth.length - 1),
        );
        return (
          <mesh
            key={tooth}
            position={[Math.cos(angle) * 0.47, Math.sin(angle) * 0.47, 0]}
            rotation={[0, 0, angle]}
            material={SURFACE}
          >
            <boxGeometry args={[0.12, 0.18, 0.12]} />
          </mesh>
        );
      })}
    </group>
  );
}

function ChairSilhouette(props) {
  return (
    <group {...props}>
      <mesh position={[0, 0.18, -0.1]} material={SURFACE}>
        <boxGeometry args={[0.52, 0.08, 0.5]} />
      </mesh>
      <mesh position={[0, 0.58, -0.28]} material={SURFACE}>
        <boxGeometry args={[0.52, 0.7, 0.08]} />
      </mesh>
      {[
        [-0.18, -0.18, -0.22],
        [0.18, -0.18, -0.22],
        [-0.18, -0.18, 0.18],
        [0.18, -0.18, 0.18],
      ].map((position, index) => (
        <mesh key={index} position={position} material={SURFACE}>
          <boxGeometry args={[0.06, 0.64, 0.06]} />
        </mesh>
      ))}
    </group>
  );
}

function CodeSlab(props) {
  return (
    <group {...props}>
      <mesh material={SURFACE}>
        <boxGeometry args={[1, 0.7, 0.08]} />
      </mesh>
      {[
        [-0.18, 0.14, 0.05, 0.42],
        [-0.08, -0.04, 0.05, 0.62],
        [0.1, -0.22, 0.05, 0.34],
      ].map(([x, y, z, width], index) => (
        <mesh key={index} position={[x, y, z]}>
          <boxGeometry args={[width, 0.04, 0.02]} />
          <meshBasicMaterial
            color="#ffe3a1"
            transparent
            opacity={0.62}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function SupportObject({ type, ...props }) {
  if (type === "lego") return <LegoBlock {...props} />;
  if (type === "gear") return <GearFragment {...props} />;
  if (type === "chair") return <ChairSilhouette {...props} />;
  return <CodeSlab {...props} />;
}

export default function ThoughtFieldScene({
  section,
  thoughtFieldLayout = THOUGHT_FIELD_LAYOUT,
}) {
  const rootRef = useRef();
  const orbRef = useRef();
  const orbGlowRef = useRef();
  const orbAuraRef = useRef();
  const handRef = useRef();
  const orbLightRef = useRef();
  const fillLightRef = useRef();
  const phraseRefs = useRef([]);
  const glyphRefs = useRef([]);
  const supportRefs = useRef([]);
  const { mouse } = useThree();
  const isMobile = window.innerWidth < 768;
  const phraseMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#eadfbf",
        roughness: 1,
        metalness: 0,
        emissive: "#000000",
      }),
    [],
  );

  const phrases = useMemo(
    () =>
      PHRASES.map((text, index) => ({
        text,
        offset: index / PHRASES.length,
        lane: index % 3,
      })),
    [],
  );

  const glyphs = useMemo(
    () =>
      Array.from({ length: isMobile ? 10 : 14 }, (_, index) => ({
        text: GLYPHS[index % GLYPHS.length],
        offset: Math.random(),
        spreadY: THREE.MathUtils.randFloatSpread(isMobile ? 4.2 : 7.0),
        spreadZ: THREE.MathUtils.randFloatSpread(isMobile ? 4.8 : 9.8),
      })),
    [isMobile],
  );

  const supportObjects = thoughtFieldLayout.supportObjects;

  useEffect(() => {
    if (!rootRef.current) return;

    rootRef.current.visible = section === 1;

    if (section !== 1) {
      rootRef.current.position.set(...thoughtFieldLayout.root.hiddenPosition);
      rootRef.current.scale.setScalar(thoughtFieldLayout.root.hiddenScale);
    }
  }, [section]);

  useFrame((state, delta) => {
    const active = section === 1 ? 1 : 0;
    const t = state.clock.elapsedTime;
    const pointerX = mouse.x * 0.45 * active;
    const pointerY = mouse.y * 0.24 * active;

    if (rootRef.current) {
      if (section !== 1) {
        return;
      }

      rootRef.current.position.x = THREE.MathUtils.damp(
        rootRef.current.position.x,
        active ? thoughtFieldLayout.root.activePosition[0] : -4.5,
        3.4,
        delta,
      );
      rootRef.current.position.y = THREE.MathUtils.damp(
        rootRef.current.position.y,
        active ? thoughtFieldLayout.root.activePosition[1] : -2.4,
        3.4,
        delta,
      );
      rootRef.current.position.z = THREE.MathUtils.damp(
        rootRef.current.position.z,
        active ? thoughtFieldLayout.root.activePosition[2] : -8,
        3.4,
        delta,
      );

      const nextScale = THREE.MathUtils.damp(
        rootRef.current.scale.x,
        active ? 1 : 0.74,
        3.4,
        delta,
      );
      rootRef.current.scale.setScalar(nextScale);
    }

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

    if (orbGlowRef.current) {
      orbGlowRef.current.position.copy(orbRef.current.position);
      orbGlowRef.current.scale.setScalar(
        thoughtFieldLayout.orb.glowScale *
          (1 + Math.sin(t * 0.8) * 0.04) *
          orbPulse,
      );
    }

    if (orbAuraRef.current) {
      orbAuraRef.current.position.copy(orbRef.current.position);
      orbAuraRef.current.scale.setScalar(
        thoughtFieldLayout.orb.auraScale *
          (1 + Math.sin(t * 0.55 + 1.4) * 0.03),
      );
    }

    if (orbLightRef.current) {
      orbLightRef.current.intensity = THREE.MathUtils.damp(
        orbLightRef.current.intensity,
        active ? thoughtFieldLayout.orb.lightIntensity : 0,
        4,
        delta,
      );
    }

    if (fillLightRef.current) {
      fillLightRef.current.intensity = THREE.MathUtils.damp(
        fillLightRef.current.intensity,
        active ? thoughtFieldLayout.fillLight.intensity : 0,
        4,
        delta,
      );
    }

    phraseRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const descriptor = phrases[index];
      const cycle =
        (t * thoughtFieldLayout.phrases.speed + descriptor.offset) % 1;
      const readable =
        THREE.MathUtils.smoothstep(cycle, 0.18, 0.38) *
        (1 - THREE.MathUtils.smoothstep(cycle, 0.66, 0.92));
      const spread = isMobile
        ? thoughtFieldLayout.phrases.spreadMobile
        : thoughtFieldLayout.phrases.spreadDesktop;
      const x =
        thoughtFieldLayout.phrases.baseX + cycle * spread + pointerX * 0.08;
      const y =
        thoughtFieldLayout.phrases.baseY -
        descriptor.lane *
          (isMobile
            ? thoughtFieldLayout.phrases.laneGapMobile
            : thoughtFieldLayout.phrases.laneGapDesktop) +
        Math.sin(t * 0.38 + index) * 0.08 +
        pointerY * 0.14;
      const z =
        thoughtFieldLayout.phrases.baseZ -
        index * thoughtFieldLayout.phrases.zStep;
      ref.position.set(x, y, z);
      ref.rotation.z = -0.08 + descriptor.lane * 0.03;
      ref.visible =
        active > 0.01 &&
        cycle > thoughtFieldLayout.phrases.visibleCycleStart &&
        cycle < thoughtFieldLayout.phrases.visibleCycleEnd &&
        index < thoughtFieldLayout.phrases.visibleCount;
      ref.scale.setScalar(
        thoughtFieldLayout.phrases.baseScale +
          readable * thoughtFieldLayout.phrases.readableScaleBoost,
      );
    });

    glyphRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const descriptor = glyphs[index];
      const cycle =
        (t * thoughtFieldLayout.glyphs.speed + descriptor.offset) % 1;
      const drift = THREE.MathUtils.smoothstep(cycle, 0, 1);
      const spread = isMobile
        ? Math.max(
            thoughtFieldLayout.glyphs.spreadMobile,
            thoughtFieldLayout.phrases.spreadMobile * 0.9,
          )
        : Math.max(
            thoughtFieldLayout.glyphs.spreadDesktop,
            thoughtFieldLayout.phrases.spreadDesktop * 0.92,
          );
      ref.position.set(
        thoughtFieldLayout.glyphs.baseX +
          drift * spread +
          Math.sin(t * 0.7 + index) * 0.06,
        thoughtFieldLayout.glyphs.baseY +
          descriptor.spreadY * (0.4 + drift * 0.85) +
          Math.cos(t * 0.6 + index) * 0.05,
        descriptor.spreadZ *
          (0.35 + drift * 0.95) *
          thoughtFieldLayout.glyphs.zScale,
      );
      ref.rotation.z = Math.sin(t * 0.45 + index * 1.3) * 0.4;
      ref.visible =
        active > 0.01 && cycle > thoughtFieldLayout.glyphs.visibleStart;
      ref.scale.setScalar(
        thoughtFieldLayout.glyphs.baseScale +
          (1 - cycle) * thoughtFieldLayout.glyphs.scaleBoost,
      );
    });

    supportRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const descriptor = supportObjects[index];
      ref.position.set(
        descriptor.position[0] +
          Math.sin(t * (0.22 + index * 0.05)) * 0.12 +
          pointerX * 0.1,
        descriptor.position[1] +
          Math.cos(t * (0.2 + index * 0.04)) * 0.1 +
          pointerY * 0.08,
        descriptor.position[2] + Math.sin(t * (0.16 + index * 0.03)) * 0.08,
      );
      ref.rotation.x =
        descriptor.rotation[0] + Math.sin(t * 0.18 + index) * 0.18;
      ref.rotation.y =
        descriptor.rotation[1] + Math.cos(t * 0.16 + index) * 0.24;
      ref.rotation.z =
        descriptor.rotation[2] + Math.sin(t * 0.14 + index * 1.4) * 0.2;
      const objectScale = THREE.MathUtils.damp(
        ref.scale.x,
        active ? descriptor.scale ?? 0.72 : 0.35,
        4,
        delta,
      );
      ref.scale.setScalar(objectScale);
    });
  });

  return (
    <group ref={rootRef}>
      <group ref={handRef}>
        <Hand scale={thoughtFieldLayout.hand.scale} />
      </group>

      <mesh ref={orbAuraRef}>
        <sphereGeometry args={[1, 40, 40]} />
        <meshBasicMaterial
          color="#ff9a1f"
          transparent
          opacity={0.08}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={orbGlowRef}>
        <sphereGeometry args={[0.95, 40, 40]} />
        <meshBasicMaterial
          color="#ffb84d"
          transparent
          opacity={0.16}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={orbRef}>
        <icosahedronGeometry args={[0.82, 5]} />
        <meshBasicMaterial color="#fff5bf" toneMapped={false} />
      </mesh>

      <pointLight
        ref={orbLightRef}
        position={thoughtFieldLayout.orb.lightPosition}
        color="#ffc96b"
        intensity={0}
        distance={thoughtFieldLayout.orb.lightDistance}
        decay={2}
      />
      <pointLight
        ref={fillLightRef}
        position={thoughtFieldLayout.fillLight.position}
        color="#4453c7"
        intensity={0}
        distance={thoughtFieldLayout.fillLight.distance}
        decay={2}
      />

      <ThoughtFieldSparks
        section={section}
        thoughtFieldLayout={thoughtFieldLayout}
        mouse={mouse}
        isMobile={isMobile}
      />
      <ThoughtFieldParticles
        section={section}
        thoughtFieldLayout={thoughtFieldLayout}
        mouse={mouse}
        isMobile={isMobile}
      />

      {phrases.map((phrase, index) => (
        <group
          key={phrase.text}
          ref={(node) => (phraseRefs.current[index] = node)}
        >
          <Text
            material={phraseMaterial}
            fontSize={
              isMobile
                ? thoughtFieldLayout.phrases.fontSizeMobile
                : thoughtFieldLayout.phrases.fontSizeDesktop
            }
            maxWidth={
              isMobile
                ? thoughtFieldLayout.phrases.maxWidthMobile
                : thoughtFieldLayout.phrases.maxWidthDesktop
            }
            anchorX="center"
            anchorY="middle"
            color="#eadfbf"
            outlineColor="#5a4722"
            outlineWidth={0.006}
            outlineOpacity={0.35}
            fillOpacity={0.88}
          >
            {phrase.text}
          </Text>
        </group>
      ))}

      {glyphs.map((glyph, index) => (
        <group
          key={`${glyph.text}-${index}`}
          ref={(node) => (glyphRefs.current[index] = node)}
        >
          <Text
            fontSize={isMobile ? 0.13 : 0.16}
            anchorX="center"
            anchorY="middle"
            color="#ffefc7"
            fillOpacity={0.5}
          >
            {glyph.text}
          </Text>
        </group>
      ))}

      {supportObjects.map((object, index) => (
        <group
          key={object.type}
          ref={(node) => (supportRefs.current[index] = node)}
        >
          <SupportObject type={object.type} />
        </group>
      ))}
    </group>
  );
}
