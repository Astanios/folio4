import { Html, useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BackgroundIsland } from "./Floating_island_2";
import Ocean from "./Ocean";
import Mountain from "./Mountain";
import Sun from "./Sun";
import ContactScroll from "./ContactScroll";
import { CONTACT_LINKS } from "../utils/contact";
import { CONTACT_WORLD_Y, getContactLayout } from "./contactSceneLayout";
import useSceneViewport from "./useSceneViewport";
import { useReducedMotion } from "framer-motion";
import ContactMist from "./ContactMist";

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
  const labelWidth = layout.mobile ? Math.min(145, (width - 44) / 2) : width < 1000 ? 190 : 270;
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
      <group position={layout.island}>
        <BackgroundIsland
          position={[0, 0, layout.mobile ? 8 : 4]}
          scale={layout.islandScale}
          rotation={layout.islandRotation}
          tint="#ac7b9d"
          haze={0.08}
          hazeColor="#34192e"
          emissiveIntensity={0.018}
          satelliteMotion={reducedMotion ? false : COASTAL_MOTION}
          partOffsets={COASTAL_ROCK_OFFSETS}
        />
        <pointLight
          position={[5, 8, 7]}
          intensity={1.2}
          color="#ffb077"
          distance={22}
          decay={2}
        />
        <pointLight
          position={[12, 5, 2]}
          intensity={0.5}
          color="#ce66e9"
          distance={18}
          decay={2}
        />
        {ready && (
          <Html
            center
            portal={portal}
            position={layout.mobile ? [6, 10.6, -3] : [5.5, 11, -8]}
            zIndexRange={[30, 20]}
            style={{ pointerEvents: "none" }}
          >
            <h1
              data-contact-scene
              style={{
                margin: 0,
                width: layout.mobile ? 290 : width < 1000 ? 440 : 490,
                textAlign: "center",
                font: `${
                  layout.mobile ? 32 : width < 1000 ? 36 : 44
                }px/1.1 Georgia, serif`,
                color: "#fff0cf",
                textShadow: "0 2px 18px #1c0c29",
                letterSpacing: "-0.035em",
              }}
            >
              Let’s make a team.
            </h1>
          </Html>
        )}
        <group>
          <ContactScroll
            contact={CONTACT_LINKS[0]}
            active={ready}
            position={layout.mobile ? [4.1, 6.7, 3] : [5.5, 7.3, 4]}
            rotation={[-0.12, 0.12, -0.08]}
            scale={layout.mobile ? 2.8 : 4.2}
            labelWidth={labelWidth}
          />
          <ContactScroll
            contact={CONTACT_LINKS[1]}
            active={ready}
            position={layout.mobile ? [7.9, 6.7, 3] : [12.5, 7, 2]}
            rotation={[-0.12, -0.12, 0.08]}
            scale={layout.mobile ? 2.8 : 4.2}
            labelWidth={labelWidth}
          />
        </group>
      </group>
      <ContactMist position={[0, 0.25, layout.camera[2] - 14]} reducedMotion={reducedMotion} />
    </group>
  );
}
