import {
  EffectComposer,
  Bloom,
  Vignette,
  GodRays,
  HueSaturation,
} from "@react-three/postprocessing";
import { BlendFunction, Resizer, KernelSize } from "postprocessing";
import { THOUGHT_FIELD_LAYOUT } from "./thoughtFieldLayout";
import useCompanyPostproControls from "./useCompanyPostproControls";

export const Postpro = ({
  section,
  sun,
  companyPortal,
  thoughtFieldLayout = THOUGHT_FIELD_LAYOUT,
}) => {
  const section2Fx = thoughtFieldLayout.effects;
  const section3Fx = useCompanyPostproControls();
  // Sections are zero-based: the mirror island is section 2 internally.
  const inCompanySection = section === 2;
  const value = (key, fallback) => inCompanySection ? section3Fx[key]
    : section === 1 ? section2Fx[key] ?? fallback : fallback;
  const lightSource = inCompanySection ? companyPortal : sun;
  const raysEnabled = value("godRaysEnabled", true);
  const bloomThreshold = section === 1 ? section2Fx.bloomThreshold : 0;

  return (
    <EffectComposer multisampling={0} enabled={!inCompanySection || section3Fx.enabled}>
      {(!inCompanySection || section3Fx.vignetteEnabled) && (
        <Vignette eskil={false}
          offset={inCompanySection ? section3Fx.vignetteOffset : 0.1}
          darkness={inCompanySection ? section3Fx.vignetteDarkness : 1} />
      )}
      {lightSource && raysEnabled && (
        <GodRays
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
          blendFunction={BlendFunction.NORMAL}
          hue={inCompanySection ? section3Fx.hue : 0.1}
          saturation={inCompanySection ? section3Fx.saturation : 0.7}
        />
      )}
      {(!inCompanySection || section3Fx.bloom1Enabled) && <Bloom
        mipmapBlur
        intensity={value("bloom1Intensity", 0.45)}
        luminanceThreshold={value("bloom1Threshold", bloomThreshold)}
        luminanceSmoothing={value("bloom1Smoothing", 0.75)}
        radius={value("bloom1Radius")}
        levels={value("bloom1Levels")}
      />}
      {(!inCompanySection || section3Fx.bloom2Enabled) && <Bloom
        mipmapBlur
        intensity={value("bloom2Intensity", 0)}
        luminanceThreshold={value("bloom2Threshold", bloomThreshold)}
        luminanceSmoothing={value("bloom2Smoothing", 1)}
        radius={value("bloom2Radius")}
        levels={value("bloom2Levels")}
      />}
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
