import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { animate, useMotionValue } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { framerMotionConfig, section1Lighting, sceneCameraConfig } from "../config";
import Ocean from "./Ocean";
import Sun from "./Sun";
import Mountain from "./Mountain";
import { Postpro } from "./Postpro";
import ThoughtFieldScene from "./ThoughtFieldScene";
import { THOUGHT_FIELD_LAYOUT } from "./thoughtFieldLayout";
import { COMPANY_ISLAND_LAYOUT, islandApproach } from "./companyIslandLayout";
import useSceneViewport from "./useSceneViewport";
import SpaceBackground from "./SpaceBackground";

export const Experience = (props) => {
  const { menuOpened } = props;
  const viewport = useSceneViewport();
  const data = useScroll();
  const lightRef = useRef();
  const ambientRef = useRef();
  const openingRef = useRef();
  const openingTransition = useRef({ progress: 0 });
  const [openingSun, setOpeningSun] = useState(null);
  const [companyPortal, setCompanyPortal] = useState(null);
  const openingLightColor = useMemo(() => new THREE.Color(section1Lighting.color), []);
  const thoughtLightColor = useMemo(() => new THREE.Color(THOUGHT_FIELD_LAYOUT.section2MountainLight.color), []);
  const companyIslandRef = useRef();
  const islandCamera = useMemo(() => new THREE.Vector3(), []);
  const islandTarget = useMemo(() => new THREE.Vector3(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const smoothedLook = useMemo(() => new THREE.Vector3(), []);
  const companyIslandLayout = COMPANY_ISLAND_LAYOUT;

  const isMobile = window.innerWidth < 768;
  const responsiveRatio = viewport.width / 12;
  const officeScaleRatio = Math.max(0.5, Math.min(0.9 * responsiveRatio, 0.9));

  const [section, setSection] = useState(0);

  const cameraPositionX = useMotionValue(0);
  const cameraLookAtX = useMotionValue(0);

  useEffect(() => {
    animate(cameraPositionX, menuOpened ? -5 : 0, {
      ...framerMotionConfig,
    });
    animate(cameraLookAtX, menuOpened ? 5 : 0, {
      ...framerMotionConfig,
    });
  }, [menuOpened]);

  const thoughtFieldLayout = THOUGHT_FIELD_LAYOUT;

  useFrame((state, delta) => {
    let curSection = Math.floor(data.scroll.current * data.pages);

    if (curSection > 3) {
      curSection = 3;
    }

    if (curSection !== section) {
      setSection(curSection);
    }

    const firstPage = THREE.MathUtils.clamp(data.offset * (data.pages - 1), 0, 1);
    const ascent = THREE.MathUtils.smoothstep(firstPage, 0, 1);
    openingTransition.current.progress = firstPage;
    if (openingRef.current) {
      // Cancel the page wrapper's lift, then send the entire opening below and
      // away from the camera. Each model keeps its original relative transform.
      openingRef.current.position.set(0,
        -viewport.height * (data.pages - 1) * data.offset - 90 * ascent, -32 * ascent);
      if (section === 3) openingRef.current.position.set(0, 0, 0);
      openingRef.current.visible = section === 3 || firstPage < 0.999;
    }

    const inIslandWorld = section !== 3;
    const camera = THOUGHT_FIELD_LAYOUT.camera;
    cameraTarget.set(cameraPositionX.get() + camera.positionOffsetX * ascent,
      THREE.MathUtils.lerp(sceneCameraConfig.position[1], camera.positionY, ascent),
      THREE.MathUtils.lerp(sceneCameraConfig.position[2], camera.positionZ, ascent));
    lookTarget.set(cameraLookAtX.get() + camera.lookAtOffsetX * ascent,
      camera.lookAtY * ascent, camera.lookAtZ * ascent);
    if (!inIslandWorld) {
      cameraTarget.set(cameraPositionX.get(), 3, 10);
      lookTarget.set(cameraLookAtX.get(), 0, 0);
    }
    if (lightRef.current && section !== 2) {
      lightRef.current.intensity = THREE.MathUtils.lerp(section1Lighting.intensity,
        THOUGHT_FIELD_LAYOUT.section2MountainLight.intensity, ascent);
      lightRef.current.color.copy(openingLightColor).lerp(thoughtLightColor, ascent);
      lightRef.current.position.fromArray(section1Lighting.position).lerp(
        islandTarget.fromArray(THOUGHT_FIELD_LAYOUT.section2MountainLight.position), ascent);
    }
    if (ambientRef.current && section !== 2) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(section1Lighting.ambientIntensity, 0.1, ascent);
    }
    if (inIslandWorld && companyIslandRef.current) {
      const progress = islandApproach(data.offset);
      companyIslandRef.current.updateWorldMatrix(true, false);
      islandCamera.fromArray(isMobile ? companyIslandLayout.cameraMobile : companyIslandLayout.camera);
      islandTarget.fromArray(isMobile ? companyIslandLayout.targetMobile : companyIslandLayout.target);
      companyIslandRef.current.localToWorld(islandCamera);
      companyIslandRef.current.localToWorld(islandTarget);
      islandCamera.x += cameraPositionX.get() * 0.25;
      cameraTarget.lerp(islandCamera, progress);
      lookTarget.lerp(islandTarget, progress);
    }
    state.camera.position.lerp(cameraTarget, 1 - Math.exp(-5 * delta));
    smoothedLook.lerp(lookTarget, 1 - Math.exp(-6 * delta));
    state.camera.lookAt(smoothedLook);

  });

  return (
    <>
      <SpaceBackground openingTransition={openingTransition} section={section} />
      <directionalLight ref={lightRef}
        intensity={section === 0 ? section1Lighting.intensity : section === 2 ? 0.85 : THOUGHT_FIELD_LAYOUT.section2MountainLight.intensity}
        position={section === 0 ? section1Lighting.position : section === 2 ? [-10, 20, 20] : THOUGHT_FIELD_LAYOUT.section2MountainLight.position}
        color={section === 0 ? section1Lighting.color : section === 2 ? "#fff0d4" : THOUGHT_FIELD_LAYOUT.section2MountainLight.color}
      />
      <ambientLight ref={ambientRef} intensity={section === 0 ? section1Lighting.ambientIntensity : section === 2 ? 0.32 : 0.1} />

      <Postpro section={section} sun={openingSun} companyPortal={companyPortal}
        thoughtFieldLayout={thoughtFieldLayout} />
      <ThoughtFieldScene
        section={section === 2 ? 1 : section}
        thoughtFieldLayout={thoughtFieldLayout}
        companyIslandRef={companyIslandRef}
        companyIslandLayout={companyIslandLayout}
        onPortalReady={setCompanyPortal}
        openingTransition={openingTransition}
      />

      <group ref={openingRef}>
        <group position={section === 3 ? [0, -40, -20] : [0, isMobile ? -50 : -45, -112]} scale={section === 3 ? 0.35 : 1}>
          <Sun ref={setOpeningSun} />
        </group>
        <group position={section === 3 ? [-80, -36, -70] : [-46, -28, -46]}
          rotation={[-0.3, 1.1, 0]} scale={officeScaleRatio * (section === 3 ? 0.4 : 1)}>
          <Mountain />
        </group>
        <group position={section === 3 ? [-18, -70, -60] : [0, -23, -36]}
          rotation={[-0.3, 3.15, 0]} scale={officeScaleRatio}>
          <Ocean />
        </group>
      </group>
    </>
  );
};
