// Dimensions after centering the plank and normalizing its width to one unit.
export const SIGN_PLANK_HEIGHT = 0.146127;
export const SIGN_PLANK_DEPTH = 0.015809;
export const SIGN_PLANK_FACE_Z = SIGN_PLANK_DEPTH / 2;

// Shared by the visible sign and the fireflies' landing points.
export function getContactSignLayout(mobile, portrait) {
  return {
    position: mobile ? [0.273, 0.173, -0.142]
      : portrait ? [0.295, 0.17, -0.303] : [0.265, 0.177, -0.28],
    rotation: [0, mobile ? 0.9 : 0.65, 0],
    width: mobile ? 2.4 : 4.4,
    height: mobile ? 0.62 : portrait ? 1.05 : 0.82,
    boards: [
      { id: "linkedin", position: [0.06, mobile ? 2.25 : 2.2, 0], tilt: -0.045 },
      { id: "email", position: [-0.06, mobile ? 1.3 : 1.05, 0.04], tilt: 0.025 },
    ],
  };
}
