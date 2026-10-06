import { Billboard, Html, useCursor, useGLTF, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Model as ScrollModel } from "./Scroll";

const glowVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const glowFragment = `
  varying vec2 vUv;
  uniform float opacity;
  uniform float selected;
  void main() {
    float radius = length((vUv - 0.5) * 2.0);
    float softGlow = pow(max(0.0, 1.0 - radius), 2.0);
    float denseShadow = 1.0 - smoothstep(0.32, 0.95, radius);
    float falloff = mix(softGlow, denseShadow, selected);
    vec3 color = mix(vec3(1.0, 0.73, 0.35), vec3(0.0), selected);
    gl_FragColor = vec4(color, falloff * opacity);
  }
`;

const topologyVertex = `
  attribute vec3 barycentric;
  attribute vec3 edgeMask;
  varying vec3 vBarycentric;
  varying vec3 vEdgeMask;
  varying vec2 vGridUv;
  void main() {
    vBarycentric = barycentric;
    vEdgeMask = edgeMask;
    vGridUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const topologyFragment = `
  uniform vec3 lineColor;
  uniform vec2 gridDensity;
  varying vec3 vBarycentric;
  varying vec3 vEdgeMask;
  varying vec2 vGridUv;
  void main() {
    // A surface-following quad grid stays readable even on the smaller rolls;
    // their finer original edges remain visible underneath it.
    vec2 grid = vGridUv * gridDensity;
    vec2 gridWidth = max(fwidth(grid), vec2(0.00001));
    vec2 gridDistance = abs(fract(grid - 0.5) - 0.5) / gridWidth;
    vec2 gridLines = 1.0 - smoothstep(vec2(0.08), vec2(0.48), gridDistance);
    gridLines *= 1.0 - smoothstep(vec2(0.35), vec2(0.65), gridWidth);
    float line = max(gridLines.x, gridLines.y);
    vec3 distanceToEdge = vBarycentric / max(fwidth(vBarycentric), vec3(0.00001));
    distanceToEdge = mix(vec3(10000.0), distanceToEdge, vEdgeMask);
    float edge = min(min(distanceToEdge.x, distanceToEdge.y), distanceToEdge.z);
    float meshEdges = (1.0 - smoothstep(0.08, 0.4, edge)) * 0.035;
    float coverage = max(line * 0.85, meshEdges) * (gl_FrontFacing ? 1.0 : 0.25);
    if (coverage < 0.02) discard;
    gl_FragColor = vec4(lineColor, coverage);
    #include <encodings_fragment>
  }
`;

function CompanyScroll({ company, placement, scrollScale, selected, active, onSelect, portal }) {
  const animated = useRef();
  const scrollMesh = useRef();
  const glow = useRef();
  const [hovered, setHovered] = useState(false);
  const [meshHovered, setMeshHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const highlighted = active && (hovered || meshHovered || focused);
  const { materials } = useGLTF("/models/scroll.glb");
  const material = useMemo(() => {
    const copy = materials.Scroll.clone();
    copy.emissive.set("#f3c477");
    copy.emissiveMap = copy.map;
    copy.emissiveIntensity = 0.08;
    return copy;
  }, [materials]);
  const projectedEnds = useMemo(() => [new THREE.Vector3(), new THREE.Vector3()], []);
  const selectedMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      lineColor: { value: new THREE.Color("#b5ee32").multiplyScalar(1.35) },
      gridDensity: { value: new THREE.Vector2(12, 36) },
    },
    vertexShader: topologyVertex, fragmentShader: topologyFragment,
    extensions: { derivatives: true }, transparent: true, depthWrite: false,
    toneMapped: false, side: THREE.DoubleSide,
  }), []);
  const uniforms = useMemo(() => ({ opacity: { value: 0.24 }, selected: { value: 0 } }), []);
  useCursor(active && (hovered || meshHovered));
  useEffect(() => () => { material.dispose(); selectedMaterial.dispose(); }, [material, selectedMaterial]);
  useEffect(() => { if (!active) { setHovered(false); setMeshHovered(false); setFocused(false); } }, [active]);

  useFrame(({ camera, size: viewportSize }, delta) => {
    if (!animated.current) return;
    // Draw the parchment forward through depth, keeping its height unchanged.
    animated.current.position.z = THREE.MathUtils.damp(animated.current.position.z,
      highlighted ? 0.022 : active && selected ? 0.008 : 0, 12, delta);
    material.emissiveIntensity = THREE.MathUtils.damp(material.emissiveIntensity,
      highlighted && !selected ? 0.45 : 0.08, 10, delta);
    if (selected && scrollMesh.current) {
      // Keep cells a few pixels apart as the camera and island move.
      scrollMesh.current.updateWorldMatrix(true, false);
      const [left, right] = projectedEnds;
      left.set(-0.5, 0, 0).applyMatrix4(scrollMesh.current.matrixWorld).project(camera);
      right.set(0.5, 0, 0).applyMatrix4(scrollMesh.current.matrixWorld).project(camera);
      const pixels = Math.hypot((right.x - left.x) * viewportSize.width,
        (right.y - left.y) * viewportSize.height) * 0.5;
      selectedMaterial.uniforms.gridDensity.value.set(12, 36)
        .multiplyScalar(THREE.MathUtils.clamp(pixels / 130, 0.5, 3));
    }
    if (glow.current) {
      glow.current.uniforms.selected.value = selected ? 1 : 0;
      glow.current.uniforms.opacity.value = THREE.MathUtils.damp(
        glow.current.uniforms.opacity.value, selected ? highlighted ? 1 : 0.98 : highlighted ? 0.62 : 0.24, 10, delta);
    }
  });

  const select = (event) => {
    event.stopPropagation();
    if (active) onSelect(company.id);
  };
  const size = scrollScale * (placement.scale ?? 1);
  return (
    <group position={placement.position}>
      <group ref={animated}>
        <group ref={scrollMesh} rotation={placement.rotation} scale={size}
          onPointerOver={(event) => { if (active) { event.stopPropagation(); setMeshHovered(true); } }}
          onPointerOut={() => setMeshHovered(false)} onClick={select}>
          <ScrollModel normalized topology={selected} material={selected ? selectedMaterial : material}
            renderOrder={selected ? 2 : 0} />
        </group>
        <Billboard position={[0, 0, -0.007]}>
          <mesh scale={[size * 1.5, size * 0.65, 1]} raycast={() => null} renderOrder={selected ? 1 : 0}>
            <planeGeometry />
            <shaderMaterial ref={glow} uniforms={uniforms} vertexShader={glowVertex}
              fragmentShader={glowFragment} transparent depthWrite={false} depthTest={!selected}
              blending={selected ? THREE.NormalBlending : THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
        </Billboard>
        {active && <Html center portal={portal} zIndexRange={[30, 20]}>
          <button type="button" className="company-scroll-trigger" data-company-scroll
            data-revealed={highlighted || undefined} data-selected={selected || undefined}
            aria-label={selected ? `Unselect ${company.name} and return to the portal` : `Open ${company.name} in the mirror`}
            aria-pressed={selected} onClick={select}
            onPointerEnter={(event) => { if (event.pointerType !== "touch") setHovered(true); }}
            onPointerLeave={() => setHovered(false)}
            onFocus={(event) => setFocused(event.currentTarget.matches(":focus-visible"))}
            onBlur={() => setFocused(false)} onKeyDown={() => setFocused(true)}>
            <span className="company-scroll-name" aria-hidden="true">{company.name}</span>
          </button>
        </Html>}
      </group>
    </group>
  );
}

export default function CompanyScrolls({ companies = [], placements, scrollScale, selectedId, onSelect, active = true, islandPart, ...props }) {
  const scroll = useScroll();
  const portal = useMemo(() => ({ current: scroll.fixed }), [scroll.fixed]);
  return (
    <group {...props}>
      {companies.map((company, index) => {
        const placement = placements[index % placements.length];
        if (islandPart && (placement.islandPart ?? "main") !== islandPart) return null;
        return <CompanyScroll key={company.id} company={company} placement={placement}
          scrollScale={scrollScale} selected={selectedId === company.id}
          active={active} onSelect={onSelect} portal={portal} />;
      })}
      {active && (!islandPart || islandPart === "main") && <Html portal={portal} position={[0, 0, 0]} style={{ pointerEvents: "none" }}>
        <span role="status" className="sr-only">
          {selectedId !== null ? `${companies.find((company) => company.id === selectedId)?.name} selected` : "Select a company scroll"}
        </span>
      </Html>}
    </group>
  );
}
