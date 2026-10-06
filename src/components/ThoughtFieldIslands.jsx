import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BackgroundIsland as IslandOne } from "./Floating_island_1";
import { BackgroundIsland as IslandTwo } from "./Floating_island_2";
import { getIslandWrapBounds, wrapIslandX } from "./floatingIslandTravel";

function Island({ descriptor, settings, section, isMobile, reveal }) {
  const group = useRef();
  const continuityReveal = useRef(1);
  const visibility = descriptor.continuity ? continuityReveal : reveal;
  const Model = descriptor.model === 1 ? IslandOne : IslandTwo;
  const position = isMobile ? descriptor.mobilePosition : descriptor.position;
  const size = descriptor.size * settings.scale * (isMobile ? settings.mobileScale : 1);
  const depthFactor = 30 / Math.abs(position[2]);
  const travel = descriptor.travel;
  const flow = useRef({ offsetX: 0, time: 0 });
  const wrapBounds = useRef({ min: 0, max: 0 });
  const projection = useMemo(() => new THREE.Matrix4(), []);

  useEffect(() => {
    // A changed placement starts a new travel path.
    flow.current.offsetX = 0;
    flow.current.time = 0;
  }, [position[0], position[1], position[2]]);

  useFrame((state, delta) => {
    if (section !== 1 || !settings.visible || !group.current) return;
    group.current.visible = !visibility || visibility.current > 0.001;
    const t = state.clock.elapsedTime;
    const phase = descriptor.phase;
    let targetX = position[0] + state.pointer.x * settings.parallax * depthFactor;
    let targetY = position[1] + state.pointer.y * settings.parallax * depthFactor * 0.5
      + Math.sin(t * 0.18 + phase) * settings.drift;
    if (travel) {
      const dt = Math.min(delta, 0.1);
      flow.current.time += dt;
      flow.current.offsetX += travel.direction * travel.speed * dt;
      targetX += flow.current.offsetX;
      targetY += Math.sin(flow.current.time * travel.frequency + phase) * travel.amplitude;
    }
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, targetX, 2, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, targetY, 2, delta);
    if (travel) {
      group.current.parent.updateWorldMatrix(true, false);
      state.camera.updateMatrixWorld();
      projection.multiplyMatrices(state.camera.projectionMatrix, state.camera.matrixWorldInverse)
        .multiply(group.current.parent.matrixWorld);
      if (getIslandWrapBounds(projection, group.current.position.y, position[2], size * 1.1, wrapBounds.current)) {
        const currentX = group.current.position.x;
        const wrappedX = wrapIslandX(currentX, travel.direction, wrapBounds.current.min, wrapBounds.current.max);
        if (wrappedX !== currentX) {
          flow.current.offsetX += wrappedX - currentX;
          // Jump across while fully off screen, rather than damping across view.
          group.current.position.x = wrappedX;
        }
      }
    }
    group.current.rotation.z = descriptor.rotation[2]
      + Math.sin(t * 0.11 + phase) * settings.drift * 0.035;
  });

  return (
    <group ref={group} position={position} rotation={descriptor.rotation} scale={size}>
      <Model
        satelliteMotion={descriptor.satelliteMotion ?? settings.satelliteMotion}
        motionPhase={descriptor.phase}
        reveal={visibility}
        tint={settings.tint}
        haze={THREE.MathUtils.clamp(descriptor.haze * settings.haze, 0, 0.95)}
        hazeColor={settings.hazeColor}
      />
    </group>
  );
}

export default function ThoughtFieldIslands({ section, settings, reveal }) {
  const isMobile = useThree((state) => state.size.width < 768);
  const placements = settings.placements;
  return (
    <group visible={section === 1 && settings.visible}>
      <Suspense fallback={null}>
        {placements.filter((item) => item.id !== "near-right" && (!isMobile || item.mobile)).map((descriptor) => (
          <Island key={descriptor.id} descriptor={descriptor} settings={settings}
            section={section} isMobile={isMobile} reveal={reveal} />
        ))}
      </Suspense>
    </group>
  );
}
