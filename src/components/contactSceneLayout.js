import * as THREE from "three";
import { sceneCameraConfig } from "../config";

// The coast lives below the floating islands, not at the opening's elevation.
export const CONTACT_WORLD_Y = -280;

export function contactApproach(offset) {
  return THREE.MathUtils.smoothstep(offset, 0.685, 0.99);
}

export function getContactLayout(width, height) {
  const mobile = width < 768;
  const framing = Math.max(1, 1.65 * height / width);
  const mobileDistance = 24 * Math.max(1, (height / 720) * (390 / width));
  const cameraZ = mobile ? mobileDistance : 20 * framing;
  const halfWidthAtDepth = (depth) => Math.tan(sceneCameraConfig.fov * Math.PI / 360) * (cameraZ + depth) * width / height;
  return {
    mobile,
    camera: [0, 2.8, cameraZ],
    target: [0, 2.3, -25],
    island: mobile ? [-6, -5.2, 4] : [-9, -5.5, 3],
    islandModelOffset: [mobile ? -3 : -5.5, 0, mobile ? 8 : 9],
    islandScale: 32,
    islandRotation: [0, mobile ? -0.9 : -0.65, mobile ? 0 : -0.05],
    mountain: [halfWidthAtDepth(100) * 1.05, -5, -100],
    mountainScale: mobile ? 0.8 : 1.15,
    sun: [halfWidthAtDepth(160) * (mobile ? 0.28 : 0.64), 20, -160],
    sunScale: mobile ? 14 : 18,
    waterY: -1.3,
  };
}
