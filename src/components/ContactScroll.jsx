import {
  Billboard,
  Html,
  OrthographicCamera,
  RenderTexture,
  useCursor,
  useGLTF,
  useScroll,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

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
  void main() {
    float radius = length((vUv - 0.5) * 2.0);
    float glow = pow(max(0.0, 1.0 - radius), 2.0);
    gl_FragColor = vec4(1.0, 0.48, 0.18, glow * opacity);
  }
`;
const screenReaderStyle = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clipPath: "inset(50%)",
};

// Local typography supplies the RenderTexture scene, whose finished render
// target maps onto the scroll mesh itself. System fonts avoid another download
// and allow a single render without asynchronous text glyph generation.
function makeInscription(contact) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  const background = context.createRadialGradient(512, 256, 30, 512, 256, 570);
  background.addColorStop(0, "#432622");
  background.addColorStop(0.6, "#25161e");
  background.addColorStop(1, "#100e1b");
  context.fillStyle = background;
  context.fillRect(0, 0, 1024, 512);
  context.strokeStyle = "#9b6242";
  context.lineWidth = 2;
  context.strokeRect(54, 75, 916, 362);
  context.strokeStyle = "#583526";
  context.strokeRect(67, 88, 890, 336);
  context.beginPath();
  context.moveTo(220, 337);
  context.lineTo(454, 337);
  context.moveTo(570, 337);
  context.lineTo(804, 337);
  context.stroke();
  context.fillStyle = "#d89863";
  context.beginPath();
  context.moveTo(512, 326);
  context.lineTo(523, 337);
  context.lineTo(512, 348);
  context.lineTo(501, 337);
  context.closePath();
  context.fill();
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#d9a47e";
  context.font = "500 25px Arial, sans-serif";
  context.fillText(
    contact.external ? "STAY CONNECTED" : "LET’S TALK",
    512,
    157,
  );
  context.font = `600 ${contact.external ? 111 : 128}px Arial, sans-serif`;
  context.fillStyle = "#fff3d1";
  context.shadowColor = "#ff993f";
  context.shadowBlur = 17;
  context.fillText(contact.external ? "" : "EMAIL", 512, 253, 808);
  context.shadowBlur = 0;
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 4;
  return texture;
}

export default function ContactScroll({
  contact,
  active = true,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  labelPosition = [0, 0, 0],
  labelWidth = 220,
  showAddress = true,
  hoverDepth = 0.12,
  surfaceHeight = 0.48,
}) {
  const animated = useRef();
  const material = useRef();
  const copyTimer = useRef();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const scroll = useScroll();
  const portal = useMemo(() => ({ current: scroll.fixed }), [scroll.fixed]);
  const { nodes } = useGLTF("/models/scroll.glb");
  const geometry = useMemo(() => {
    // Keep the cached model untouched for the section 3 company scrolls. An
    // expanded local copy becomes a broad magical inscription facing local +Z.
    const copy = nodes.Scroll_Scroll_0.geometry.clone();
    copy.computeBoundingBox();
    const center = copy.boundingBox.getCenter(new THREE.Vector3());
    const size = copy.boundingBox.getSize(new THREE.Vector3());
    copy.translate(-center.x, -center.y, -center.z);
    copy.scale(1 / size.x, surfaceHeight / size.y, 0.7 / size.x);
    const vertices = copy.attributes.position;
    const uv = new Float32Array(vertices.count * 2);
    for (let i = 0; i < vertices.count; i++) {
      uv[i * 2] = vertices.getX(i) + 0.5;
      uv[i * 2 + 1] = vertices.getY(i) / surfaceHeight + 0.5;
    }
    copy.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    copy.computeBoundingBox();
    copy.computeBoundingSphere();
    return copy;
  }, [nodes, surfaceHeight]);
  const inscription = useMemo(() => makeInscription(contact), [contact]);
  const uniforms = useMemo(() => ({ opacity: { value: 0.12 } }), []);
  const highlighted = active && (hovered || focused);
  useCursor(active && hovered);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => inscription.dispose(), [inscription]);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!active) {
      setHovered(false);
      setFocused(false);
      setCopyStatus("");
      clearTimeout(copyTimer.current);
    }
  }, [active]);

  useFrame((_, delta) => {
    if (!animated.current || !material.current) return;
    animated.current.position.z = reducedMotion
      ? 0
      : THREE.MathUtils.damp(
          animated.current.position.z,
          highlighted ? hoverDepth : 0,
          10,
          delta,
        );
    // Both channels share the same single-frame render target.
    if (material.current.emissiveMap !== material.current.map) {
      material.current.emissiveMap = material.current.map;
      material.current.needsUpdate = true;
    }
    material.current.emissiveIntensity = THREE.MathUtils.damp(
      material.current.emissiveIntensity,
      highlighted ? 1.5 : 0.9,
      10,
      delta,
    );
    uniforms.opacity.value = THREE.MathUtils.damp(
      uniforms.opacity.value,
      highlighted ? 0.3 : 0.12,
      10,
      delta,
    );
  });

  const copyAddress = async () => {
    clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(contact.address);
      setCopyStatus("Email copied");
    } catch {
      setCopyStatus("Select the address to copy");
    }
    copyTimer.current = setTimeout(() => setCopyStatus(""), 3200);
  };

  return (
    <group position={position} scale={scale}>
      <group ref={animated}>
        <mesh geometry={geometry} rotation={rotation} castShadow receiveShadow>
          <meshStandardMaterial
            ref={material}
            color="#e6c5ae"
            roughness={0.88}
            metalness={0.08}
            emissive="#ffc990"
            emissiveIntensity={0.9}
          >
            <RenderTexture
              attach="map"
              frames={1}
              width={512}
              height={256}
              samples={2}
            >
              <OrthographicCamera
                makeDefault
                manual
                position={[0, 0, 5]}
                left={-1}
                right={1}
                top={0.5}
                bottom={-0.5}
                near={0.1}
                far={10}
              />
              <mesh>
                <planeGeometry args={[2, 1]} />
                <meshBasicMaterial map={inscription} toneMapped={false} />
              </mesh>
            </RenderTexture>
          </meshStandardMaterial>
        </mesh>
        <Billboard position={[0, 0, -0.08]}>
          <mesh scale={[1.55, 0.95, 1]} raycast={() => null}>
            <planeGeometry />
            <shaderMaterial
              uniforms={uniforms}
              vertexShader={glowVertex}
              fragmentShader={glowFragment}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </Billboard>
        {active && (
          <Html
            center
            portal={portal}
            position={labelPosition}
            zIndexRange={[30, 20]}
          >
            <div
              data-contact-scene
              style={{
                width: labelWidth,
                textAlign: "center",
                pointerEvents: "auto",
                position: "relative",
              }}
              onPointerEnter={(event) => {
                if (event.pointerType !== "touch") setHovered(true);
              }}
              onPointerLeave={() => setHovered(false)}
              onFocus={() => setFocused(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                  setFocused(false);
              }}
            >
              <a
                href={contact.href}
                target={contact.external ? "_blank" : undefined}
                rel={contact.external ? "noopener noreferrer" : undefined}
                aria-label={
                  contact.external
                    ? `${contact.label} (opens in a new tab)`
                    : contact.label
                }
                style={{
                  display: "block",
                  height: Math.max(70, labelWidth * 0.45),
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: 12,
                  outline: focused
                    ? "1px solid #ffe4ac"
                    : "1px solid transparent",
                  outlineOffset: 5,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={screenReaderStyle}>{contact.label}</span>
              </a>
              {showAddress && contact.address && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    width: "100%",
                    paddingTop: 6,
                    font: "10px/1.4 Arial, sans-serif",
                    color: "#efd5b1",
                    textShadow: "0 2px 8px #120d20",
                  }}
                >
                  <button
                    type="button"
                    onClick={copyAddress}
                    aria-label="Copy email address"
                    style={{
                      margin: "0 auto",
                      minHeight: 36,
                      minWidth: 88,
                      padding: "5px 8px",
                      border: 0,
                      borderRadius: 6,
                      background: "transparent",
                      color: "inherit",
                      font: "inherit",
                      letterSpacing: "0.12em",
                      cursor: "pointer",
                      textShadow: "inherit",
                    }}
                  >
                    {copyStatus === "Email copied" ? "COPIED" : "COPY EMAIL"}
                  </button>
                  {(highlighted ||
                    copyStatus === "Select the address to copy") && (
                    <span
                      style={{
                        display: "block",
                        userSelect: "text",
                        overflowWrap: "anywhere",
                        letterSpacing: 0,
                      }}
                    >
                      {contact.address}
                    </span>
                  )}
                  <span
                    role="status"
                    aria-live="polite"
                    style={screenReaderStyle}
                  >
                    {copyStatus}
                  </span>
                </div>
              )}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
