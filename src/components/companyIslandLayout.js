import { IMAGES as jobs } from "../utils/jobs";
import { FLOATING_ISLAND_MOTION } from "./floatingIslandMotion";

// Coordinates here are in the island's normalized local space (size = 1).
export const COMPANY_ISLAND_LAYOUT = {
  groupPosition: [0, 0.1, 0.4],
  groupRotation: [0.1, 0.1, 0.1],
  camera: [0.065, 0.31, 1.14],
  target: [0.065, 0.08, -0.1],
  cameraMobile: [0.055, 0.48, 2.45],
  targetMobile: [0.055, 0.14, -0.1],
  mirror: [0, 0.15, 0.1],
  mirrorRotation: [-0.05, 0.01, 0],
  mirrorScale: 0.25,
  mirrorMobileScaleMultiplier: 1.5,
  scrolls: [0, 0, 0],
  scrollsRotation: [0, 0, 0],
  scrollsScale: 0.115,
  responsive: {
    mobile: {
      sceneOffset: [0, 0, 0],
      islandOffset: [0, -0.12, 0],
      mirrorOffset: [0, 0.08, 0],
      scrollScaleOffset: 0.1,
    },
    medium: {
      sceneOffset: [-0.07, 0, -0.5],
      islandOffset: [0.1, -0.12, 0],
      mirrorOffset: [0, 0.045, 0],
      scrollScaleOffset: 0.05,
    },
  },
  satelliteMotion: FLOATING_ISLAND_MOTION.levitate,
  // The main platform and the three satellite islands, in normalized model space.
  scrollPlacements: [
    {
      position: [-0.265, -0.281, -0.26],
      rotation: [0, -0.25, 0],
      scale: 1,
      islandPart: "satellite-2",
    },
    {
      position: [0.31, -0.302, -0.125],
      rotation: [0, 0.35, 0],
      scale: 0.9,
      islandPart: "satellite-1",
    },
    {
      position: [0.25, 0.24, 0.36],
      rotation: [0, 0.2, 0],
      scale: 1,
      islandPart: "satellite-3",
    },
    { position: [0.18, 0, 0.05], rotation: [0, -0.8, 0], scale: 0.95 },
    {
      position: [-0.25, -0.28, -0.33],
      rotation: [0, 0.35, 0],
      scale: 0.8,
      islandPart: "satellite-2",
    },
  ],
};

// Keep the scroll labels and mirror content tied to the same job entry.
export const COMPANY_EXHIBITS = jobs.map((job) => ({
  ...job,
  name: job.title,
  image: job.image ? `/${job.image.replace(/^\//, "")}` : null,
}));

export function islandApproach(offset) {
  const t = Math.max(0, Math.min(1, (offset - 0.36) / (2 / 3 - 0.36)));
  return t * t * (3 - 2 * t);
}
