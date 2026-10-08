import { Html, useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BackgroundIsland } from "./Floating_island_2";
import Ocean from "./Ocean";
import Mountain from "./Mountain";
import Sun from "./Sun";
import ContactSign from "./ContactSign";
import { getContactSignLayout } from "./contactSignLayout";
import { CONTACT_WORLD_Y, getContactLayout } from "./contactSceneLayout";
import useSceneViewport from "./useSceneViewport";
import { useReducedMotion } from "framer-motion";
import ContactMist from "./ContactMist";
import ContactFireflies from "./ContactFireflies";

// Bring the model's satellites alongside the shore rather than below the sea.
const COASTAL_ROCK_OFFSETS = {
  "satellite-1": [-0.16, 0.44, 0.12],
  "satellite-2": [0.12, 0.22, 0],
  "satellite-3": [-0.08, 0.39, -0.04],
  "satellite-4": [0.2, 0.4, 0.1],
  "satellite-5": [-0.24, 0.62, 0.3],
};
const COASTAL_MOTION = {
  mode: "levitate",
  speed: 0.25,
  amplitude: [0, 0.002, 0],
  rotation: [0, 0, 0],
};

// Keep the contact heading aligned with the viewport edges as framing changes.
const contactTitlePosition = () => [0, 0];

const skyVertex = `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const skyFragment = `
  varying vec3 vWorld;
  uniform float reveal;
  void main() {
    vec3 direction = normalize(vWorld - cameraPosition);
    float elevation = direction.y;
    vec3 night = vec3(0.025, 0.014, 0.095);
    vec3 dusk = vec3(0.27, 0.075, 0.16);
    vec3 horizon = vec3(0.56, 0.22, 0.12);
    vec3 color = mix(dusk, night, smoothstep(0.02, 0.55, elevation));
    color = mix(color, horizon, exp(-abs(elevation + 0.025) * 9.0) * 0.7);
    gl_FragColor = vec4(color, reveal);
  }
`;

export default function ContactScene({ progress, onSunReady }) {
  const scroll = useScroll();
  const { width, height } = useThree((state) => state.size);
  const viewport = useSceneViewport();
  const reducedMotion = useReducedMotion();
  const layout = getContactLayout(width, height);
  const portrait = height > width;
  const signLayout = useMemo(() => getContactSignLayout(layout.mobile, portrait), [layout.mobile, portrait]);
  const titleInset = Math.min(192, Math.max(72, width * 0.12));
  const islandPosition = layout.island.map((value, axis) => value + layout.islandModelOffset[axis]);
  const root = useRef();
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const portal = useMemo(() => ({ current: scroll.fixed }), [scroll.fixed]);
  const skyUniforms = useMemo(() => ({ reveal: { value: 0 } }), []);

  useFrame(() => {
    const amount = progress.current;
    // Stage the coast while it is still well below the camera's field of view.
    // Geometry never fades in or assembles during the descent.
    root.current.visible = scroll.offset > 0.55;
    root.current.position.y =
      CONTACT_WORLD_Y - viewport.height * (scroll.pages - 1) * scroll.offset;
    skyUniforms.reveal.value = THREE.MathUtils.smoothstep(amount, 0.2, 0.85);
    const active = amount > 0.985;
    if (active !== readyRef.current) {
      if (
        !active &&
        scroll.el.ownerDocument.activeElement?.closest("[data-contact-scene]")
      ) {
        scroll.el.focus({ preventScroll: true });
      }
      readyRef.current = active;
      setReady(active);
    }
  });

  return (
    <group ref={root} visible={false}>
      <mesh renderOrder={-2100} raycast={() => null}>
        <sphereGeometry args={[450, 32, 16]} />
        <shaderMaterial
          uniforms={skyUniforms}
          vertexShader={skyVertex}
          fragmentShader={skyFragment}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <Sun ref={onSunReady} position={layout.sun} scale={layout.sunScale} />
      <Mountain
        position={layout.mountain}
        scale={layout.mountainScale}
        rotation={[0, 0.45, 0]}
        color="#67516a"
        roughness={1}
        metalness={0}
      />
      <Ocean
        position={[0, layout.waterY, -80]}
        scale={5}
        waterColor="#0a0717"
        sunColor="#ffd0a0"
        sunDirection={[0.8, 0.25, -0.5]}
        distortionScale={2.4}
      />
      <group position={islandPosition} rotation={layout.islandRotation} scale={layout.islandScale}>
        <BackgroundIsland
          tint="#ac7b9d"
          haze={0.025}
          hazeColor="#34192e"
          emissiveIntensity={0.008}
          shadowContrast={0.55}
          satelliteMotion={reducedMotion ? false : COASTAL_MOTION}
          partOffsets={COASTAL_ROCK_OFFSETS}
        />
        <ContactFireflies
          mobile={layout.mobile}
          reducedMotion={reducedMotion}
          signLayout={signLayout}
          islandScale={layout.islandScale}
        />
        <ContactSign active={ready} layout={signLayout}
          position={signLayout.position}
          rotation={signLayout.rotation}
          scale={1 / layout.islandScale} />
      </group>
      <group position={layout.island}>
        <pointLight
          position={[5, 8, 7]}
          intensity={1.5}
          color="#ffb077"
          distance={22}
          decay={2}
        />
        <pointLight
          position={[-1, 4, 12]}
          intensity={0.45}
          color="#d5a4cf"
          distance={18}
          decay={2}
        />
        {ready && (
          <Html
            portal={portal}
            calculatePosition={contactTitlePosition}
            zIndexRange={[30, 20]}
            style={{
              pointerEvents: "none",
              width,
              padding: titleInset,
              boxSizing: "border-box",
            }}
          >
            <h1
              data-contact-scene
              className="font-extrabold text-white"
              style={{
                margin: 0,
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.1em",
                textAlign: "left",
                whiteSpace: "nowrap",
                fontSize: "clamp(20px, 6vw, 60px)",
                lineHeight: 1.1,
              }}
            >
              <span>Let’s make a</span>
              <span className="bg-white text-black px-1 italic">Team</span>
            </h1>
          </Html>
        )}
      </group>
      <ContactMist position={[0, 0.25, layout.camera[2] - 14]} reducedMotion={reducedMotion} />
    </group>
  );
}
