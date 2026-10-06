import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Html, useGLTF, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import MirrorPortal from "./MirrorPortal";
import MirrorVideoSurface from "./MirrorVideoSurface";

const GLASS_WIDTH = 0.960462;
const GLASS_HEIGHT = 1.242948;
const GLASS_CENTER_Y = -0.061484;
const GLASS_FRONT_Z = -0.017;

function MirrorVideo({ src, active, title, poster, companyId, onSurface }) {
  const videoRef = useRef();
  const generation = useRef(0);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const video = videoRef.current;
    let texture;
    const prepareSurface = () => {
      if (texture || video.readyState < 2) return;
      texture = new THREE.VideoTexture(video);
      texture.encoding = THREE.sRGBEncoding;
      texture.minFilter = texture.magFilter = THREE.LinearFilter;
      onSurface(companyId, texture);
    };
    video.addEventListener("loadeddata", prepareSurface);
    prepareSurface();
    return () => {
      video.removeEventListener("loadeddata", prepareSurface);
      onSurface(companyId, null);
      texture?.dispose();
    };
  }, [src, companyId, onSurface]);

  useEffect(() => {
    const video = videoRef.current;
    const current = ++generation.current;
    if (!video) return;
    if (active) {
      setStatus("loading");
      video.play().catch(() => {
        if (generation.current === current)
          setStatus(video.error ? "error" : "blocked");
      });
    } else video.pause();
    return () => {
      generation.current++;
      video.pause();
    };
  }, [src, active]);

  const retry = () => {
    const video = videoRef.current;
    if (!video || !active) return;
    const current = ++generation.current;
    setStatus("loading");
    if (video.error) video.load();
    video.play().catch(() => {
      if (generation.current === current)
        setStatus(video.error ? "error" : "blocked");
    });
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={`${title} preview`}
        onPlaying={() => setStatus("ready")}
        onError={() => setStatus("error")}
        className="company-mirror-video"
      />
      {(status === "blocked" || status === "error") && (
        <button
          type="button"
          onClick={retry}
          className="company-mirror-video-retry"
        >
          {status === "error" ? "Retry preview" : "Play preview"}
        </button>
      )}
    </div>
  );
}

function JobInformation({ company, active, warped, onSurface }) {
  const title = company.name || company.title;
  const imagePath =
    company.image && !/^(?:https?:)?\/\//i.test(company.image)
      ? `/${company.image.replace(/^\/+/, "")}`
      : null;
  const [failedImage, setFailedImage] = useState(false);
  const imageSrc =
    company.mediaType === "gif" && company.mediaSrc
      ? company.mediaSrc
      : imagePath;
  const hasVideo = company.mediaSrc && company.mediaType !== "gif";
  const canLink = /^https?:\/\//i.test(company.url || "");

  useEffect(() => {
    setFailedImage(false);
  }, [imageSrc]);

  return (
    <article
      aria-label={`${title} company information`}
      data-company-id={company.id}
      data-video-warped={warped || undefined}
      onClick={(event) => event.stopPropagation()}
      className="company-mirror-experience"
    >
      {(imageSrc || hasVideo) && (
        <div className="company-mirror-media">
          {hasVideo ? (
            <MirrorVideo
              key={company.mediaSrc}
              src={company.mediaSrc}
              active={active}
              title={title}
              poster={company.poster || imagePath}
              companyId={company.id}
              onSurface={onSurface}
            />
          ) : !failedImage ? (
            <img
              key={imageSrc}
              src={imageSrc}
              alt={`${title} project`}
              onError={() => setFailedImage(true)}
              draggable={false}
              className="company-mirror-image"
            />
          ) : (
            <div
              role="status"
              className="company-mirror-unavailable"
            >
              Preview unavailable
            </div>
          )}
        </div>
      )}
      <header className="company-mirror-header">
        <h3>{title}</h3>
      </header>
      {canLink && (
        <footer className="company-mirror-footer">
          <a href={company.url} target="_blank" rel="noopener noreferrer"
            aria-label={`Visit ${title} website`}>
            VISIT SITE
          </a>
        </footer>
      )}
    </article>
  );
}

export default function CompanyMirror({
  company = null,
  active = true,
  onPortalReady,
  ...props
}) {
  const { scene } = useGLTF("/models/mirror.glb");
  const scroll = useScroll();
  const htmlPortal = useMemo(() => ({ current: scroll.fixed }), [scroll.fixed]);
  const staticLayerRef = useRef();
  const selectionId = useRef(null);
  const animation = useRef({
    running: false,
    elapsed: 0,
    initialStatic: 0,
    swapped: false,
    target: null,
  });
  const staticAmount = useRef(0);
  const staticFrame = useRef(null);
  const [displayedCompany, setDisplayedCompany] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [videoSurface, setVideoSurface] = useState(null);
  const onSurface = useCallback((id, texture) => {
    setVideoSurface((current) => texture ? { id, texture } : current?.id === id ? null : current);
  }, []);
  const warped = active && displayedCompany !== null && videoSurface?.id === displayedCompany.id;

  useLayoutEffect(() => {
    const id = company?.id ?? null;
    if (!active) {
      animation.current.running = false;
      staticAmount.current = 0;
      if (staticLayerRef.current) staticLayerRef.current.style.opacity = "0";
      setPhase(id === null ? "idle" : "ready");
      selectionId.current = id;
      setDisplayedCompany(company);
      return;
    }
    if (selectionId.current === id) return;
    selectionId.current = id;
    animation.current = {
      running: true,
      elapsed: 0,
      initialStatic: staticAmount.current,
      swapped: false,
      target: company,
    };
    setPhase("revealing");
  }, [company?.id, active]);

  const { frame, glassGeometry, frameMaterials } = useMemo(() => {
    const frame = scene.clone(true);
    const materialCopies = new Map();
    let glassGeometry;
    frame.traverse((object) => {
      if (!object.isMesh) return;
      if (object.name === "defaultMaterial012") {
        object.visible = false;
        glassGeometry = object.geometry.clone();
        const vertices = glassGeometry.attributes.position;
        const uv = new Float32Array(vertices.count * 2);
        for (let index = 0; index < vertices.count; index++) {
          uv[index * 2] = vertices.getX(index) / GLASS_WIDTH + 0.5;
          uv[index * 2 + 1] =
            (vertices.getY(index) - GLASS_CENTER_Y) / GLASS_HEIGHT + 0.5;
        }
        glassGeometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      } else {
        const cloneMaterial = (source) => {
          if (!materialCopies.has(source)) {
            const material = source.clone();
            material.color?.set("#c9a46d");
            material.emissive?.set("#211609");
            material.emissiveIntensity = 0.35;
            material.roughness = 0.62;
            material.metalness = 0.35;
            materialCopies.set(source, material);
          }
          return materialCopies.get(source);
        };
        object.material = Array.isArray(object.material)
          ? object.material.map(cloneMaterial)
          : cloneMaterial(object.material);
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return {
      frame,
      glassGeometry,
      frameMaterials: [...materialCopies.values()],
    };
  }, [scene]);

  useEffect(
    () => () => {
      glassGeometry?.dispose();
      frameMaterials.forEach((material) => material.dispose());
    },
    [glassGeometry, frameMaterials],
  );

  useFrame(({ clock }, delta) => {
    const transition = animation.current;
    if (active && transition.running) {
      transition.elapsed += Math.min(delta, 0.05);
      const time = transition.elapsed;
      // Swap company content or the idle portal under the same burst of snow.
      if (time < 0.1) {
        staticAmount.current = THREE.MathUtils.lerp(
          transition.initialStatic,
          1,
          THREE.MathUtils.smoothstep(time / 0.1, 0, 1),
        );
      } else {
        staticAmount.current =
          time < 0.4
            ? 1
            : 1 - THREE.MathUtils.smoothstep((time - 0.4) / 0.25, 0, 1);
      }
      if (time >= 0.24 && !transition.swapped) {
        transition.swapped = true;
        setDisplayedCompany(transition.target);
      }
      const canvas = staticLayerRef.current;
      if (canvas) {
        canvas.style.opacity = String(staticAmount.current);
        // A small canvas at 30 fps keeps the effect inexpensive and stops work
        // completely once the company or portal is revealed.
        const tick = Math.floor(clock.elapsedTime * 30);
        if (staticFrame.current?.canvas !== canvas) {
          const context = canvas.getContext("2d");
          staticFrame.current = context && {
            canvas,
            context,
            pixels: context.createImageData(canvas.width, canvas.height),
            tick: -1,
          };
        }
        const frame = staticFrame.current;
        if (frame && frame.tick !== tick) {
          const { data } = frame.pixels;
          for (let y = 0; y < canvas.height; y++) {
            const scanline = y % 3 === 0 ? 0.65 : 1;
            const tracking = (y + tick * 7) % canvas.height < 10 ? 0.55 : 1;
            for (let x = 0; x < canvas.width; x++) {
              const index = (y * canvas.width + x) * 4;
              const gray = (20 + Math.random() * 210) * scanline * tracking;
              data[index] = data[index + 1] = data[index + 2] = gray;
              data[index + 3] = 255;
            }
          }
          frame.context.putImageData(frame.pixels, 0, 0);
          frame.tick = tick;
        }
      }
      if (time >= 0.65) {
        transition.running = false;
        setPhase(transition.target ? "ready" : "idle");
      }
    }
  });

  return (
    <group {...props}>
      <primitive object={frame} dispose={null} />
      {glassGeometry && (
        <MirrorPortal
          onPortalReady={onPortalReady}
          geometry={glassGeometry}
          idle={!active || !displayedCompany}
          focused={active}
          width={GLASS_WIDTH}
          height={GLASS_HEIGHT}
          centerY={GLASS_CENTER_Y}
        />
      )}
      {glassGeometry && warped && (
        <MirrorVideoSurface geometry={glassGeometry} texture={videoSurface.texture}
          width={GLASS_WIDTH} height={GLASS_HEIGHT} />
      )}
      {active && (
        <Html
          transform
          portal={htmlPortal}
          position={[0, GLASS_CENTER_Y, GLASS_FRONT_Z]}
          distanceFactor={0.945}
          pointerEvents="none"
          zIndexRange={[20, 10]}
        >
          <div
            data-mirror-state={phase}
            style={{
              position: "relative",
              width: 400,
              height: 518,
              overflow: "hidden",
              borderRadius: "50%",
              pointerEvents: "none",
              isolation: "isolate",
            }}
          >
            {displayedCompany ? (
              <JobInformation
                key={displayedCompany.id}
                company={displayedCompany}
                active={active}
                warped={warped}
                onSurface={onSurface}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 40px",
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              >
                <p
                  data-portal-prompt
                  style={{
                    margin: 0,
                    color: "#ffe9cc",
                    font: "63px/1.15 Georgia, serif",
                    textShadow: "0 2px 10px #190410, 0 0 5px #190410",
                  }}
                >
                  CLICK
                  <br />A<br />
                  SCROLL
                </p>
              </div>
            )}
            <canvas
              ref={staticLayerRef}
              width={160}
              height={208}
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                imageRendering: "pixelated",
                opacity: staticAmount.current,
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload("/models/mirror.glb");
