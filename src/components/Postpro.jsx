import {
  EffectComposer,
  Bloom,
  Vignette,
  GodRays,
  HueSaturation,
} from "@react-three/postprocessing";
import { BlendFunction, Resizer, KernelSize } from "postprocessing";
import { THOUGHT_FIELD_LAYOUT } from "./thoughtFieldLayout";
import { COMPANY_POSTPRO_DEFAULTS } from "./companyPostproConfig";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";

export const Postpro = ({
  section,
  sun,
  companyPortal,
  contactProgress,
  thoughtFieldLayout = THOUGHT_FIELD_LAYOUT,
}) => {
  const section2Fx = thoughtFieldLayout.effects;
  const section3Fx = COMPANY_POSTPRO_DEFAULTS;
  const vignette = useRef();
  const grading = useRef();
  const bloom = useRef();
  const bloom2 = useRef();
  const rays = useRef();
  const [contactSettled, setContactSettled] = useState(false);
  const settledRef = useRef(false);
  // Sections are zero-based: the mirror island is section 2 internally.
  const inCompanySection = section === 2;
  const inContactSection = section === 3;
  const contactFx = {
    godRaysExposure: 0.085,
    godRaysWeight: 0.7,
    bloom1Intensity: 0.7,
    bloom1Threshold: 0.48,
    bloom1Smoothing: 0.55,
    bloom1Radius: 0.65,
    bloom1Levels: 5,
  };
  const value = (key, fallback) =>
    inCompanySection
      ? section3Fx[key]
      : section === 1
        ? section2Fx[key] ?? fallback
        : inContactSection
          ? contactFx[key] ?? fallback
          : fallback;
  const lightSource = inCompanySection ? companyPortal : sun;
  const raysEnabled = value("godRaysEnabled", true);
  const bloomThreshold = section === 1 ? section2Fx.bloomThreshold : 0;

  useFrame(() => {
    const t = contactProgress?.current ?? 0;
    const settled = t === 1;
    if (settled !== settledRef.current) {
      settledRef.current = settled;
      setContactSettled(settled);
    }
    if (section < 2) return;
    const blend = (from, to) => MathUtils.lerp(from, to, t);
    if (vignette.current) {
      vignette.current.offset = blend(section3Fx.vignetteOffset, 0.1);
      vignette.current.darkness = blend(section3Fx.vignetteDarkness, 1.08);
    }
    if (grading.current) {
      grading.current.hue = blend(section3Fx.hue, 0);
      grading.current.saturation = blend(section3Fx.saturation, 0.08);
    }
    if (bloom.current) {
      bloom.current.intensity = blend(
        section3Fx.bloom1Intensity,
        contactFx.bloom1Intensity,
      );
      bloom.current.luminanceMaterial.threshold = blend(
        section3Fx.bloom1Threshold,
        contactFx.bloom1Threshold,
      );
      bloom.current.luminanceMaterial.smoothing = blend(
        section3Fx.bloom1Smoothing,
        contactFx.bloom1Smoothing,
      );
    }
    if (bloom2.current)
      bloom2.current.intensity = blend(section3Fx.bloom2Intensity, 0);
    if (rays.current) {
      // Dim the portal rays before changing the source, then reveal the sunset.
      rays.current.godRaysMaterial.exposure = inCompanySection
        ? section3Fx.godRaysExposure * (1 - MathUtils.smoothstep(t, 0, 0.11))
        : contactFx.godRaysExposure * MathUtils.smoothstep(t, 0.13, 0.7);
    }
  });

  return (
    <EffectComposer
      multisampling={0}
      enabled={!inCompanySection || section3Fx.enabled}
    >
      {(!inCompanySection || section3Fx.vignetteEnabled) && (
        <Vignette
          ref={vignette}
          eskil={false}
          offset={inCompanySection ? section3Fx.vignetteOffset : 0.1}
          darkness={
            inCompanySection
              ? section3Fx.vignetteDarkness
              : inContactSection
                ? 1.08
                : 1
          }
        />
      )}
      {lightSource && raysEnabled && (
        <GodRays
          ref={rays}
          sun={lightSource}
          blendFunction={BlendFunction.SCREEN}
          samples={value("godRaysSamples", 40)}
          density={value("godRaysDensity", 1)}
          decay={value("godRaysDecay", 0.9)}
          weight={value("godRaysWeight", 1)}
          exposure={value("godRaysExposure", 0.1)}
          clampMax={value("godRaysClampMax", 1)}
          width={Resizer.AUTO_SIZE}
          height={Resizer.AUTO_SIZE}
          kernelSize={KernelSize.LARGE}
        />
      )}
      {section !== 1 && (!inCompanySection || section3Fx.colorEnabled) && (
        <HueSaturation
          ref={grading}
          blendFunction={BlendFunction.NORMAL}
          hue={inCompanySection ? section3Fx.hue : inContactSection ? 0 : 0.1}
          saturation={
            inCompanySection
              ? section3Fx.saturation
              : inContactSection
                ? 0.08
                : 0.7
          }
        />
      )}
      {(!inCompanySection || section3Fx.bloom1Enabled) && (
        <Bloom
          ref={bloom}
          mipmapBlur
          intensity={value("bloom1Intensity", 0.45)}
          luminanceThreshold={value("bloom1Threshold", bloomThreshold)}
          luminanceSmoothing={value("bloom1Smoothing", 0.75)}
          radius={value("bloom1Radius")}
          levels={value("bloom1Levels")}
        />
      )}
      {/* Zero-intensity bloom still runs its blur passes. Keep it during the
          contact blend, then release it once its contribution reaches zero. */}
      {(!inCompanySection || section3Fx.bloom2Enabled) &&
        (value("bloom2Intensity", 0) > 0 ||
          (inContactSection &&
            !contactSettled &&
            section3Fx.bloom2Intensity > 0)) && (
          <Bloom
            ref={bloom2}
            mipmapBlur
            intensity={value("bloom2Intensity", 0)}
            luminanceThreshold={value("bloom2Threshold", bloomThreshold)}
            luminanceSmoothing={value("bloom2Smoothing", 1)}
            radius={value("bloom2Radius")}
            levels={value("bloom2Levels")}
          />
        )}
      {section === 1 && (
        <HueSaturation
          blendFunction={BlendFunction.NORMAL}
          hue={section2Fx.hue}
          saturation={section2Fx.saturation}
        />
      )}
    </EffectComposer>
  );
};
