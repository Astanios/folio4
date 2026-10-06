import { folder, useControls } from "leva";

export const COMPANY_POSTPRO_DEFAULTS = {
  enabled: true,
  vignetteEnabled: true,
  vignetteOffset: 0.1,
  vignetteDarkness: 1.14,
  colorEnabled: true,
  hue: -0.1,
  saturation: -0.2,
  bloom1Enabled: true,
  bloom1Intensity: 1.22,
  bloom1Threshold: 0.55,
  bloom1Smoothing: 0.08,
  bloom1Radius: 0.11,
  bloom1Levels: 1,
  bloom2Enabled: true,
  bloom2Intensity: 0.12,
  bloom2Threshold: 1,
  bloom2Smoothing: 0.12,
  bloom2Radius: 0.95,
  bloom2Levels: 7,
  godRaysEnabled: true,
  godRaysSamples: 40,
  godRaysDensity: 0.8,
  godRaysDecay: 0.9,
  godRaysWeight: 0.4,
  godRaysExposure: 0.04,
  godRaysClampMax: 1,
};

const defaults = COMPANY_POSTPRO_DEFAULTS;
const slider = (key, label, min, max, step = 0.01) => ({
  label, value: defaults[key], min, max, step,
});
const bloom = (layer) => ({
  [`bloom${layer}Enabled`]: { label: "enabled", value: defaults[`bloom${layer}Enabled`] },
  [`bloom${layer}Intensity`]: slider(`bloom${layer}Intensity`, "intensity", 0, 3),
  [`bloom${layer}Threshold`]: slider(`bloom${layer}Threshold`, "threshold", 0, 2),
  [`bloom${layer}Smoothing`]: slider(`bloom${layer}Smoothing`, "smoothing", 0, 1),
  [`bloom${layer}Radius`]: slider(`bloom${layer}Radius`, "radius", 0, 1),
  [`bloom${layer}Levels`]: slider(`bloom${layer}Levels`, "levels", 1, 9, 1),
});

export default function useCompanyPostproControls() {
  return useControls("Section 3 Postprocessing", {
    enabled: defaults.enabled,
    Vignette: folder({
      vignetteEnabled: { label: "enabled", value: defaults.vignetteEnabled },
      vignetteOffset: slider("vignetteOffset", "offset", 0, 1),
      vignetteDarkness: slider("vignetteDarkness", "darkness", 0, 2),
    }),
    "Color grading": folder({
      colorEnabled: { label: "enabled", value: defaults.colorEnabled },
      hue: slider("hue", "hue", -Math.PI, Math.PI),
      saturation: slider("saturation", "saturation", -1, 1),
    }),
    Bloom: folder(bloom(1)),
    "Bloom 2": folder(bloom(2), { collapsed: true }),
    "Portal god rays": folder({
      godRaysEnabled: { label: "enabled", value: defaults.godRaysEnabled },
      godRaysSamples: slider("godRaysSamples", "samples", 8, 100, 1),
      godRaysDensity: slider("godRaysDensity", "density", 0, 1),
      godRaysDecay: slider("godRaysDecay", "decay", 0, 1),
      godRaysWeight: slider("godRaysWeight", "weight", 0, 2),
      godRaysExposure: slider("godRaysExposure", "exposure", 0, 1),
      godRaysClampMax: slider("godRaysClampMax", "clamp max", 0, 2),
    }, { collapsed: true }),
  });
}
