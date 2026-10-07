import { Html, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SignPlank, SIGN_PLANK_HEIGHT, SIGN_PLANK_FACE_Z } from "./Plank";
import { CONTACT_LINKS } from "../utils/contact";

const srOnly = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clipPath: "inset(50%)",
};

function makeLettering(label) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "700 104px Georgia, serif";
  context.lineWidth = 5;
  context.strokeStyle = "rgba(29, 17, 9, 0.8)";
  context.strokeText(label, 512, 100, 900);
  context.fillStyle = "#ffffff";
  context.fillText(label, 512, 100, 900);
  // Fine breaks in the paint allow the original wood grain to show through.
  context.globalCompositeOperation = "destination-out";
  context.fillStyle = "rgba(0, 0, 0, 0.2)";
  for (const y of [61, 83, 117, 136]) context.fillRect(70, y, 884, 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 4;
  return texture;
}

function SignBoard({
  contact,
  active,
  width,
  height,
  position,
  tilt,
  copy,
  copied,
  copyError,
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const material = useRef();
  const scroll = useScroll();
  const portal = useMemo(() => ({ current: scroll.fixed }), [scroll.fixed]);
  const isEmail = contact.id === "email";
  const label = isEmail ? "me@luiscastillo.io" : "LinkedIn ↗";
  const texture = useMemo(() => makeLettering(label), [label]);
  const highlight = active && (hovered || focused || copied);
  const colors = useMemo(
    () => ({
      warm: new THREE.Color("#ffe6b0"),
      glow: new THREE.Color("#d9f77d"),
    }),
    [],
  );
  const faceZ = SIGN_PLANK_FACE_Z * width + 0.012;

  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => {
    if (!active) {
      setHovered(false);
      setFocused(false);
    }
  }, [active]);
  useFrame((_, delta) => {
    if (!material.current) return;
    const target = highlight ? colors.glow : colors.warm;
    material.current.color.lerp(target, 1 - Math.exp(-9 * delta));
    material.current.emissive.copy(material.current.color);
    material.current.emissiveIntensity = THREE.MathUtils.damp(
      material.current.emissiveIntensity,
      highlight ? 1.15 : 0.52,
      9,
      delta,
    );
  });

  const controlStyle = {
    width: "100%",
    height: "100%",
    display: "block",
    padding: 0,
    border: 0,
    background: "transparent",
    borderRadius: 3,
    cursor: "pointer",
    outline: focused ? "1px solid #d9f77d" : "1px solid transparent",
    outlineOffset: 3,
    WebkitTapHighlightColor: "transparent",
  };
  const interaction = {
    onPointerEnter: (event) => {
      if (event.pointerType !== "touch") setHovered(true);
    },
    onPointerLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
    },
  };

  return (
    <group position={position} rotation={[0, 0, tilt]}>
      <SignPlank
        scale={[width, height / SIGN_PLANK_HEIGHT, width]}
        color="#8c6850"
        emissive={highlight ? "#b6dc62" : "#a66b3d"}
        emissiveIntensity={highlight ? 0.075 : 0.045}
      />
      <mesh position={[0, 0, faceZ]} raycast={() => null}>
        <planeGeometry args={[width * 0.88, height * 0.82]} />
        <meshStandardMaterial
          ref={material}
          map={texture}
          emissiveMap={texture}
          color="#ffe6b0"
          emissive="#ffe6b0"
          emissiveIntensity={0.52}
          transparent
          alphaTest={0.02}
          depthWrite={false}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * width * 0.425, 0, faceZ - 0.007]}>
          <sphereGeometry args={[height * 0.035, 8, 6]} />
          <meshStandardMaterial
            color="#251a13"
            roughness={0.85}
            metalness={0.35}
          />
        </mesh>
      ))}
      {active && (
        <Html
          transform
          distanceFactor={10}
          portal={portal}
          position={[0, 0, faceZ + 0.005]}
          zIndexRange={[30, 20]}
          style={{ width: width * 40, height: height * 40 }}
        >
          <div
            data-contact-scene
            {...interaction}
            style={{ width: "100%", height: "100%" }}
          >
            {isEmail ? (
              <button
                type="button"
                onClick={copy}
                aria-label={copied ? "Email copied" : "Copy email address"}
                style={controlStyle}
              >
                <span style={srOnly}>{label}</span>
              </button>
            ) : (
              <a
                href={contact.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect on LinkedIn (opens in a new tab)"
                style={controlStyle}
              >
                <span style={srOnly}>{label}</span>
              </a>
            )}
            {isEmail && (
              <span role="status" aria-live="polite" style={srOnly}>
                {copied
                  ? "Email copied to clipboard"
                  : copyError
                    ? "Select the email address below to copy it"
                    : ""}
              </span>
            )}
            {isEmail && copyError && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  background: "#1a1712",
                  color: "#fff0ce",
                  font: "10px/1.4 Arial, sans-serif",
                }}
              >
                <label>
                  Select to copy
                  <input
                    aria-label="Email address"
                    readOnly
                    value={contact.address}
                    onFocus={(event) => event.currentTarget.select()}
                    style={{
                      display: "block",
                      width: "100%",
                      color: "inherit",
                      background: "transparent",
                      border: 0,
                      font: "inherit",
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export default function ContactSign({ active, layout, ...props }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const timer = useRef();
  const signLightTarget = useMemo(() => {
    const target = new THREE.Object3D();
    target.position.set(0, 1.65, 0);
    return target;
  }, []);
  const email = CONTACT_LINKS.find((contact) => contact.id === "email");
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!active) {
      clearTimeout(timer.current);
      setCopied(false);
      setCopyError(false);
    }
  }, [active]);
  const copy = async () => {
    clearTimeout(timer.current);
    setCopied(false);
    try {
      await navigator.clipboard.writeText(email.address);
      setCopied(true);
      setCopyError(false);
      timer.current = setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <group {...props}>
      <SignPlank
        position={[0, 1.28, -0.15]}
        rotation={[0, 0, Math.PI / 2 - 0.025]}
        scale={[3.1, 1.55, 10]}
        color="#4a3021"
      />
      <primitive object={signLightTarget} />
      <spotLight
        position={[2.8, 3.4, 2.2]}
        target={signLightTarget}
        color="#ffd4a3"
        intensity={2.2}
        distance={6}
        angle={0.58}
        penumbra={1}
        decay={2}
      />
      {layout.boards.map((board) => (
        <SignBoard
          key={board.id}
          contact={CONTACT_LINKS.find((contact) => contact.id === board.id)}
          active={active}
          width={layout.width}
          height={layout.height}
          position={board.position}
          tilt={board.tilt}
          copy={copy}
          copied={board.id === "email" && copied}
          copyError={board.id === "email" && copyError}
        />
      ))}
    </group>
  );
}
