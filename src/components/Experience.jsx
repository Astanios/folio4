import { useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { section1Lighting, sceneCameraConfig } from "../config";
import Mountain from "./Mountain";
import OpeningSun from "./OpeningSun";
import OpeningAtmosphere from "./OpeningAtmosphere";
import OpeningRidges from "./OpeningRidges";
import SunsetOcean from "./SunsetOcean";
import { getOpeningSun, getOpeningHorizon } from "./openingSceneConfig";
import { useReducedMotion } from "framer-motion";
import { Postpro } from "./Postpro";
import ThoughtFieldScene from "./ThoughtFieldScene";
import { THOUGHT_FIELD_LAYOUT } from "./thoughtFieldLayout";
import { COMPANY_ISLAND_LAYOUT, islandApproach } from "./companyIslandLayout";
import useSceneViewport from "./useSceneViewport";
import SpaceBackground from "./SpaceBackground";
import ContactScene from "./ContactScene";
import { CONTACT_WORLD_Y, contactApproach, getContactLayout } from "./contactSceneLayout";

export const Experience = () => {
  const viewport = useSceneViewport();
  const data = useScroll();
  const lightRef = useRef();
  const ambientRef = useRef();
  const openingRef = useRef();
  const openingFillRef = useRef();
  const openingTransition = useRef({ progress: 0 });
  const openingCloudClock = useRef(0);
  const [openingSun, setOpeningSun] = useState(null);
  const [companyPortal, setCompanyPortal] = useState(null);
  const [contactSun, setContactSun] = useState(null);
  const contactProgress = useRef(0);
  const size = useThree((state) => state.size);
  const contactLayout = getContactLayout(size.width, size.height);
  const contactLightColor = useMemo(() => new THREE.Color("#eda3ba"), []);
  const contactVector = useMemo(() => new THREE.Vector3(), []);
  const openingLightColor = useMemo(() => new THREE.Color(section1Lighting.color), []);
  const thoughtLightColor = useMemo(() => new THREE.Color(THOUGHT_FIELD_LAYOUT.section2MountainLight.color), []);
  const companyIslandRef = useRef();
  const islandCamera = useMemo(() => new THREE.Vector3(), []);
  const islandTarget = useMemo(() => new THREE.Vector3(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const smoothedLook = useMemo(() => new THREE.Vector3(), []);
  const companyIslandLayout = COMPANY_ISLAND_LAYOUT;

  const isMobile = size.width < 768;
  const reducedMotion = useReducedMotion();
  const openingSunPosition = useMemo(() => getOpeningSun(isMobile), [isMobile]);
  const responsiveRatio = viewport.width / 12;
  const officeScaleRatio = Math.max(0.5, Math.min(0.9 * responsiveRatio, 0.9));
  const openingHorizon = useMemo(() => getOpeningHorizon(officeScaleRatio), [officeScaleRatio]);
  // Keep the near coast at the left border as the horizontal field widens.
  const openingCoastX = -(44 + 14 * size.width / size.height);

  const [section, setSection] = useState(0);

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
    openingFillRef.current.intensity = 0.32 * (1 - ascent);
    const arrival = contactApproach(data.offset);
    contactProgress.current = arrival;
    openingTransition.current.progress = firstPage;
    if (openingRef.current) {
      // Cancel the page wrapper's lift, then send the entire opening below and
      // away from the camera. Each model keeps its original relative transform.
      openingRef.current.position.set(0,
        -viewport.height * (data.pages - 1) * data.offset - 90 * ascent, -32 * ascent);
      openingRef.current.visible = firstPage < 0.999;
    }

    const camera = THOUGHT_FIELD_LAYOUT.camera;
    cameraTarget.set(camera.positionOffsetX * ascent,
      THREE.MathUtils.lerp(sceneCameraConfig.position[1], camera.positionY, ascent),
      THREE.MathUtils.lerp(sceneCameraConfig.position[2], camera.positionZ, ascent));
    lookTarget.set(camera.lookAtOffsetX * ascent,
      camera.lookAtY * ascent, camera.lookAtZ * ascent);
    if (section === 2 || arrival > 0) {
      // Reset the base every frame so returning from Contact restores the
      // company's lighting, independent of the direction of travel.
      lightRef.current.intensity = 0.85;
      lightRef.current.color.set("#fff0d4");
      lightRef.current.position.set(-10, 20, 20);
      ambientRef.current.intensity = 0.32;
    } else {
      lightRef.current.intensity = THREE.MathUtils.lerp(section1Lighting.intensity,
        THOUGHT_FIELD_LAYOUT.section2MountainLight.intensity, ascent);
      lightRef.current.color.copy(openingLightColor).lerp(thoughtLightColor, ascent);
      lightRef.current.position.fromArray(openingSunPosition).lerp(
        islandTarget.fromArray(THOUGHT_FIELD_LAYOUT.section2MountainLight.position), ascent);
      ambientRef.current.intensity = THREE.MathUtils.lerp(section1Lighting.ambientIntensity, 0.1, ascent);
    }
    if (companyIslandRef.current) {
      const progress = islandApproach(data.offset);
      companyIslandRef.current.updateWorldMatrix(true, false);
      islandCamera.fromArray(isMobile ? companyIslandLayout.cameraMobile : companyIslandLayout.camera);
      islandTarget.fromArray(isMobile ? companyIslandLayout.targetMobile : companyIslandLayout.target);
      companyIslandRef.current.localToWorld(islandCamera);
      companyIslandRef.current.localToWorld(islandTarget);
      cameraTarget.lerp(islandCamera, progress);
      lookTarget.lerp(islandTarget, progress);
    }
    if (arrival > 0) {
      contactVector.fromArray(contactLayout.camera);
      contactVector.y += CONTACT_WORLD_Y;
      cameraTarget.lerp(contactVector, arrival);
      // Back away from the portal before descending toward the water.
      cameraTarget.z += Math.sin(arrival * Math.PI) * 42;
      contactVector.fromArray(contactLayout.target);
      contactVector.y += CONTACT_WORLD_Y;
      lookTarget.lerp(contactVector, arrival);
      lightRef.current.color.lerp(contactLightColor, arrival);
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0.55, arrival);
      const pageLift = viewport.height * (data.pages - 1) * data.offset;
      lightRef.current.position.lerp(contactVector.set(18, CONTACT_WORLD_Y + 22 - pageLift, -45), arrival);
      lightRef.current.target.position.set(0, CONTACT_WORLD_Y * arrival, 0);
      lightRef.current.target.updateMatrixWorld();
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, 0.025, arrival);
    } else {
      lightRef.current.target.position.set(0, 0, 0);
      lightRef.current.target.updateMatrixWorld();
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
        position={section === 0 ? openingSunPosition : section === 2 ? [-10, 20, 20] : THOUGHT_FIELD_LAYOUT.section2MountainLight.position}
        color={section === 0 ? section1Lighting.color : section === 2 ? "#fff0d4" : THOUGHT_FIELD_LAYOUT.section2MountainLight.color}
      />
      <ambientLight ref={ambientRef} intensity={section === 0 ? section1Lighting.ambientIntensity : section === 2 ? 0.32 : 0.1} />

      <Postpro section={section} sun={section === 3 ? contactSun : openingSun} companyPortal={companyPortal}
        thoughtFieldLayout={thoughtFieldLayout} contactProgress={contactProgress} />
      <ThoughtFieldScene
        section={section >= 2 ? 1 : section}
        thoughtFieldLayout={thoughtFieldLayout}
        companyIslandRef={companyIslandRef}
        companyIslandLayout={companyIslandLayout}
        onPortalReady={setCompanyPortal}
        openingTransition={openingTransition}
        contactProgress={contactProgress}
      />
      <ContactScene progress={contactProgress} onSunReady={setContactSun} />

      <group ref={openingRef}>
        <hemisphereLight ref={openingFillRef} args={["#c4b6dc", "#8f5548", 0.32]} />
        <OpeningAtmosphere sunPosition={openingSunPosition} horizonPosition={openingHorizon}
          sunRadius={isMobile ? 10.5 : 11.5}
          transition={openingTransition} reducedMotion={reducedMotion} cloudClock={openingCloudClock} />
        <OpeningSun ref={setOpeningSun} position={openingSunPosition} horizonPosition={openingHorizon}
          radius={isMobile ? 10.5 : 11.5} cloudClock={openingCloudClock} />
        <OpeningRidges mobile={isMobile} />
        <group position={[openingCoastX, -28, -46]}
          rotation={[-0.3, 1.1, 0]} scale={officeScaleRatio}>
          <Mountain rockSurface detailStrength={0.15} metalness={0.02} roughness={0.9}
            hazeNear={55} hazeFar={150} hazeStrength={0.18} hazeColor="#b88186" />
        </group>
        <SunsetOcean position={[0, -23, -36]} rotation={[-0.3, 3.15, 0]}
          scale={officeScaleRatio} size={[600, 500]}
          sunPosition={openingSunPosition} reducedMotion={reducedMotion} />
      </group>
    </>
  );
};
