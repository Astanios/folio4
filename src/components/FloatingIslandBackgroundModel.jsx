import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getFloatingIslandParts } from "./floatingIslandParts";
import { resolveIslandMotion, sampleIslandMotion } from "./floatingIslandMotion";

function IslandPart({ part, index, motion, focusedMotion, motionBlend, motionPhase, batches, materials, children }) {
  const group = useRef();
  const time = useRef({ background: 0, focused: 0 });
  const scratch = useMemo(() => Array.from({ length: 4 }, () => new THREE.Vector3()), []);
  const inversePivot = useMemo(() => part.position.map((value) => -value), [part]);

  useFrame((_, delta) => {
    if (part.id === "main" || !group.current) return;
    const dt = Math.min(delta, 0.1);
    const variation = 0.85 + index * 0.09;
    // Integrate speed rather than multiplying elapsed time: changing props does
    // not reset the phase or teleport a platform during the camera approach.
    time.current.background += dt * motion.speed * variation;
    time.current.focused += dt * focusedMotion.speed * variation;
    const phase = motionPhase + index * 2.399963;
    const [position, rotation, focusedPosition, focusedRotation] = scratch;
    sampleIslandMotion(time.current.background, phase, motion, position, rotation);
    sampleIslandMotion(time.current.focused, phase, focusedMotion, focusedPosition, focusedRotation);
    const blend = THREE.MathUtils.clamp(typeof motionBlend === "number" ? motionBlend : motionBlend?.current ?? 0, 0, 1);
    position.lerp(focusedPosition, blend);
    rotation.lerp(focusedRotation, blend);
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, part.position[0] + position.x, 8, dt);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, part.position[1] + position.y, 8, dt);
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, part.position[2] + position.z, 8, dt);
    group.current.rotation.set(THREE.MathUtils.damp(group.current.rotation.x, rotation.x, 8, dt),
      THREE.MathUtils.damp(group.current.rotation.y, rotation.y, 8, dt),
      THREE.MathUtils.damp(group.current.rotation.z, rotation.z, 8, dt));
  });

  return (
    <group ref={group} name={`floating-island-${part.id}`} position={part.position}>
      {part.batchIndices.map((batchIndex) => (
        <mesh key={batchIndex} geometry={batches[batchIndex].geometry} material={materials[batchIndex]} />
      ))}
      {/* Content keeps its authored model coordinates and follows its platform. */}
      {children && <group position={inversePivot}>{children}</group>}
    </group>
  );
}

// satelliteMotion: { mode, speed, amplitude: [x,y,z], rotation: [x,y,z], phase }.
// Pass false to stop motion. motionBlend (0..1, or a ref) eases toward
// focusedSatelliteMotion. renderPart can attach content to each moving platform.
export default function FloatingIslandBackgroundModel({
  scene, satelliteRoots, tint, haze, hazeColor, focus, palette, reveal,
  satelliteMotion, focusedSatelliteMotion, motionBlend = focus, motionPhase = 0, renderPart, ...props
}) {
  const { parts, batches } = useMemo(() => getFloatingIslandParts(scene, satelliteRoots), [scene, satelliteRoots]);
  const motion = useMemo(() => resolveIslandMotion(satelliteMotion), [satelliteMotion]);
  const focusedMotion = useMemo(() => resolveIslandMotion(satelliteMotion === false ? false : focusedSatelliteMotion, "levitate"),
    [satelliteMotion, focusedSatelliteMotion]);
  const focusColors = useMemo(() => batches.map(({ material }) => (
    palette?.[material.name] ? new THREE.Color(palette[material.name]) : material.color.clone()
  )), [batches, palette]);
  const materials = useMemo(() => batches.map(({ material: source }) => {
    const material = source.clone();
    material.color.multiply(new THREE.Color(tint));
    material.emissive.set(tint);
    material.emissiveMap = material.map;
    material.emissiveIntensity = 0.12;
    material.roughness = 0.95;
    material.metalness = 0;
    if (reveal) material.transparent = true;
    // Atmospheric perspective confined to the islands; no scene-wide fog.
    material.onBeforeCompile = (shader) => {
      shader.uniforms.islandHaze = { value: haze };
      shader.uniforms.islandHazeColor = { value: new THREE.Color(hazeColor) };
      material.userData.islandShader = shader;
      shader.fragmentShader = `uniform float islandHaze;\nuniform vec3 islandHazeColor;\n${shader.fragmentShader}`
        .replace("#include <output_fragment>", `
          outgoingLight = mix(min(outgoingLight, vec3(0.8)), islandHazeColor, islandHaze);
          #include <output_fragment>
        `);
    };
    material.customProgramCacheKey = () => "thought-field-island-haze-v1";
    return material;
  }), [batches, tint, haze, hazeColor]);
  const tintColor = useMemo(() => new THREE.Color(tint), [tint]);

  useFrame(() => {
    if (reveal) materials.forEach((material) => { material.opacity = reveal.current; });
    if (!focus) return;
    materials.forEach((material, index) => {
      material.color.copy(batches[index].material.color).multiply(tintColor)
        .lerp(focusColors[index], focus.current);
      const shader = material.userData.islandShader;
      if (shader) shader.uniforms.islandHaze.value = haze * (1 - focus.current);
    });
  });

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);

  return (
    <group {...props} dispose={null}>
      {parts.map((part, index) => (
        <IslandPart key={part.id} part={part} index={index} batches={batches} materials={materials}
          motion={motion} focusedMotion={focusedMotion} motionBlend={motionBlend} motionPhase={motionPhase}>
          {renderPart?.(part.id)}
        </IslandPart>
      ))}
    </group>
  );
}
