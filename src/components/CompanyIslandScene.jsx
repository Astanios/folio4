import { forwardRef, Suspense, useCallback, useRef, useState } from "react";
import { useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BackgroundIsland } from "./Floating_island_1";
import CompanyMirror from "./CompanyMirror";
import CompanyScrolls from "./CompanyScrolls";
import { COMPANY_EXHIBITS, COMPANY_ISLAND_LAYOUT, islandApproach } from "./companyIslandLayout";

// Island 1 is exported without textures or colors. Keep the distant haze, then
// reveal its foliage, bark and stone through inexpensive material colors.
const ISLAND_PALETTE = {
  "Material.001": "#91a68a",
  "Material.004": "#725747",
  "Material.002": "#7b8b62",
  "Material.003": "#77717e",
};

const CompanyIslandScene = forwardRef(function CompanyIslandScene({ settings, section, reveal,
  layout = COMPANY_ISLAND_LAYOUT, onPortalReady }, ref) {
  const scroll = useScroll();
  const isMobile = useThree((state) => state.size.width < 768);
  const descriptor = settings.placements.find((island) => island.id === "near-right");
  const position = isMobile ? descriptor.mobilePosition : descriptor.position;
  const size = descriptor.size * settings.scale * (isMobile ? settings.mobileScale : 1);
  const [selectedId, setSelectedId] = useState(null);
  const toggleSelection = useCallback((id) => {
    setSelectedId((current) => current === id ? null : id);
  }, []);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const exhibit = useRef();
  const keyLight = useRef();
  const fillLight = useRef();
  const groupRef = useRef();
  const focus = useRef(0);
  const selected = COMPANY_EXHIBITS.find((company) => company.id === selectedId) || null;
  const mirrorScale = layout.mirrorScale * (isMobile ? layout.mirrorMobileScaleMultiplier : 1);
  // Keep the mirror readable on a narrow screen while its foot stays on the island.
  const mirrorPosition = [layout.mirror[0], layout.mirror[1] + mirrorScale - layout.mirrorScale, layout.mirror[2]];

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const progress = islandApproach(scroll.offset);
    groupRef.current.visible = settings.visible && (!reveal || reveal.current > 0.001);
    focus.current = progress;
    const active = section === 1 && settings.visible && progress > 0.94;
    if (active !== readyRef.current) {
      const focused = scroll.el.ownerDocument.activeElement;
      if (!active && focused?.closest?.("[data-company-scroll], [data-mirror-state]")) {
        // Preserve keyboard navigation when the focused scroll button disappears.
        // This Drei version does not give the scroll container a tab index.
        if (!scroll.el.hasAttribute("tabindex")) scroll.el.tabIndex = -1;
        scroll.el.focus({ preventScroll: true });
      }
      readyRef.current = active;
      setReady(active);
    }
    const drift = (1 - progress) * settings.drift;
    const depthFactor = 30 / Math.abs(position[2]);
    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x,
      position[0] + state.pointer.x * settings.parallax * depthFactor * (1 - progress), 2, delta);
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y,
      position[1] + state.pointer.y * settings.parallax * depthFactor * 0.5 * (1 - progress)
        + Math.sin(state.clock.elapsedTime * 0.18 + descriptor.phase) * drift, 2, delta);
    groupRef.current.rotation.z = descriptor.rotation[2]
      + Math.sin(state.clock.elapsedTime * 0.11 + descriptor.phase) * drift * 0.035;
    // These objects are already on the island during the journey. Local lamps
    // gradually reveal them as the camera arrives.
    if (keyLight.current) keyLight.current.intensity = progress * 2;
    if (fillLight.current) fillLight.current.intensity = progress * 0.8;
    if (exhibit.current) exhibit.current.visible = section === 1;
  });

  return (
    <group ref={(node) => { groupRef.current = node; if (ref) ref.current = node; }}
      position={position} rotation={descriptor.rotation} scale={size} visible={settings.visible}>
      <group position={layout.groupPosition} rotation={layout.groupRotation}>
        <BackgroundIsland tint={settings.tint} haze={descriptor.haze * settings.haze} hazeColor={settings.hazeColor}
          focus={focus} palette={ISLAND_PALETTE} reveal={reveal}
          satelliteMotion={descriptor.satelliteMotion ?? settings.satelliteMotion}
          focusedSatelliteMotion={layout.satelliteMotion} motionPhase={descriptor.phase}
          renderPart={(islandPart) => (
            <Suspense fallback={null}>
              <CompanyScrolls companies={COMPANY_EXHIBITS} selectedId={selectedId} onSelect={toggleSelection}
                active={ready} visible={section === 1} islandPart={islandPart}
                position={layout.scrolls} rotation={layout.scrollsRotation}
                placements={layout.scrollPlacements} scrollScale={layout.scrollsScale} />
            </Suspense>
          )} />
        <group ref={exhibit}>
          <pointLight ref={keyLight} position={[0, 0.68, 0.52]} color="#ffdf9a" intensity={0} distance={size * 2} decay={2} />
          <pointLight ref={fillLight} position={[0.42, 0.52, 0.25]} color="#b8bdff" intensity={0} distance={size * 2} decay={2} />
          <Suspense fallback={null}>
            <CompanyMirror company={selected} active={ready} position={mirrorPosition}
              rotation={layout.mirrorRotation} scale={mirrorScale} onPortalReady={onPortalReady} />
          </Suspense>
        </group>
      </group>
    </group>
  );
});

export default CompanyIslandScene;
