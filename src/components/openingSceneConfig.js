import { section1Lighting } from "../config";

// One source for the visible disc, atmospheric scattering and water reflection.
export function getOpeningSun(mobile) {
  const [x, y, z] = section1Lighting.position;
  return [x, y - (mobile ? 3 : 0), z];
}

// The ocean's distant edge, including its existing composition tilt. Using
// this point keeps the sky's horizon and the setting disc aligned on resize.
export function getOpeningHorizon(scale) {
  const far = 250 * scale;
  return [Math.sin(3.15) * far,
    -23 + Math.sin(0.3) * Math.cos(3.15) * far,
    -36 + Math.cos(0.3) * Math.cos(3.15) * far];
}

export const OPENING_EFFECTS = {
  godRaysSamples: 48,
  godRaysDensity: 0.95,
  godRaysDecay: 0.94,
  godRaysWeight: 0.48,
  godRaysExposure: 0.065,
  bloom1Intensity: 0.28,
  bloom1Threshold: 0.95,
  bloom1Smoothing: 0.5,
  bloom1Radius: 0.7,
  bloom1Levels: 5,
};
