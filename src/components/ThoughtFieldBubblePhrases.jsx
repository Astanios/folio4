import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { confinePhrase } from "./thoughtFieldPhraseBounds";

export const THOUGHT_PHRASES = [
  "I'm a developer/ programmer/ software engineer/ random guy in a basement with a computer.",
  "I just like making stuff",
  "And this seemed safer than building rockets.",
  "I've stared into the abyss of a minified JavaScript file and felt the abyss stare back",
  `"Expert" is a strong word. I'm more of a "guy who has made all the mistakes."`,
  "I am proficient in Python, JavaScript and talking to rubber ducks.",
];

export default function ThoughtFieldBubblePhrases({
  bursts,
  clock,
  settings,
  isMobile,
  section,
}) {
  const groups = useRef([]);
  const texts = useRef([]);
  const boundsScratch = useMemo(() => ({
    clipMatrix: new THREE.Matrix4(),
    textMatrix: new THREE.Matrix4(),
    corner: new THREE.Vector3(),
    safeRange: new THREE.Vector2(),
  }), []);
  useFrame((state) => {
    groups.current.forEach((group, index) => {
      if (!group || !texts.current[index]) return;
      const event = bursts.current[index];
      const interval = isMobile
        ? settings.bubbleIntervalMobile
        : settings.bubbleInterval;
      const duration = Math.min(
        isMobile
          ? settings.bubbleReadDurationMobile
          : settings.bubbleReadDuration,
        interval * (isMobile ? 2 : 3) - 0.1,
      );
      const age = clock.current - event.time;
      const revealAge = age - settings.bubbleRevealDelay;
      group.visible =
        section === 1 &&
        index < settings.visibleCount &&
        revealAge > 0 &&
        age < duration;
      if (!group.visible) return;
      const reveal = THREE.MathUtils.smoothstep(
        revealAge,
        0,
        settings.bubbleRevealDuration,
      );
      const fade =
        1 - THREE.MathUtils.smoothstep(age, duration - 1.4, duration);
      group.position.copy(event.position);
      const driftSpeed = isMobile
        ? settings.bubbleDriftMobile
        : settings.bubbleDrift;
      const [driftX, driftY] = settings.bubbleDriftDirection;
      group.position.x += revealAge * driftSpeed * driftX;
      group.position.y +=
        revealAge * (driftSpeed * driftY + 0.025) +
        (Math.sin(revealAge * 0.85 + index) - Math.sin(index)) * 0.1 * reveal;
      group.rotation.z = -0.025;
      group.scale.setScalar(settings.baseScale * (0.2 + 0.8 * reveal));
      if (settings.bubbleHorizontalLanes) {
        confinePhrase(group, texts.current[index], state.camera, state.size.width,
          settings.bubbleViewportPadding, boundsScratch);
      }
      // Each Text owns its derived material; fading one never fades another.
      const material = texts.current[index].material;
      const materials = Array.isArray(material) ? material : [material];
      materials.forEach((entry) => {
        entry.transparent = true;
        entry.depthWrite = false;
        entry.opacity = reveal * fade;
      });
    });
  });

  return THOUGHT_PHRASES.map((text, index) => (
    <group
      key={text}
      ref={(node) => (groups.current[index] = node)}
      visible={false}
    >
      <Text
        ref={(node) => (texts.current[index] = node)}
        fontSize={
          isMobile ? settings.bubbleFontSizeMobile : settings.fontSizeDesktop
        }
        maxWidth={
          isMobile
            ? settings.bubbleMaxWidthMobile
            : settings.bubbleMaxWidthDesktop
        }
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        color="#d4c8ad"
        outlineColor="#5a4722"
        outlineWidth={0.006}
        outlineOpacity={0.35}
        fillOpacity={0.88}
      >
        {text}
      </Text>
    </group>
  ));
}
