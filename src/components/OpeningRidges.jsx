import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { sceneCameraConfig } from "../config";
import Mountain from "./Mountain";

// The original terrain's silhouette is reused from different sides. Distant
// layers lose contrast into the sky instead of competing with the near coast.
export const OPENING_RIDGE_LAYERS = [
  {
    id: "left-middle",
    position: [-78, -60, -160],
    rotation: [-0.3, 1.0, 0],
    scale: [0.45, 0.2, 0.38],
    color: "#566074",
    hazeStrength: 0.36,
  },
  {
    id: "left-far",
    position: [-113, -83, -205],
    rotation: [-0.3, -0.45, 0],
    scale: [0.6, 0.22, 0.5],
    color: "#657084",
    hazeStrength: 0.56,
  },
  {
    id: "right-middle",
    position: [85, -65, -180],
    rotation: [-0.3, -0.85, 0],
    scale: [0.42, 0.22, 0.36],
    color: "#566074",
    hazeStrength: 0.32,
  },
  {
    id: "right-far",
    position: [115, -78, -210],
    rotation: [-0.3, 2.1, 0],
    scale: [0.6, 0.22, 0.5],
    color: "#657084",
    hazeStrength: 0.53,
  },
];

// A portrait camera sees a much narrower stretch of coast. Two smaller
// shoulders frame the same sunset instead of cropping all the distant land.
export const OPENING_MOBILE_RIDGE_LAYERS = [
  {
    id: "mobile-left",
    position: [-36, -62, -130],
    rotation: [-0.3, 0.9, 0],
    scale: [0.23, 0.15, 0.18],
    color: "#566074",
    hazeStrength: 0.38,
  },
  {
    id: "mobile-right",
    position: [40, -70, -138],
    rotation: [-0.3, -0.75, 0],
    scale: [0.22, 0.18, 0.19],
    color: "#657084",
    hazeStrength: 0.46,
  },
];

export function frameOpeningRidge(layer, aspect, mobile = false) {
  const z = layer.position[2];
  // The GLB is an open terrain sheet: its flat underside must follow the ocean
  // tilt and sit below the water, otherwise the back edge looks suspended.
  const y = -23 + Math.tan(0.3) * (z + 36) - (mobile ? 0.6 : 1.0);
  const [cameraX, cameraY, cameraZ] = sceneCameraConfig.position;
  const cameraDistance = Math.hypot(cameraY, cameraZ);
  const depth = ((cameraY - y) * cameraY + (cameraZ - z) * cameraZ) / cameraDistance;
  const halfWidth = depth * Math.tan(sceneCameraConfig.fov * Math.PI / 360) * aspect;
  // Centre each terrain at the viewport edge. Projecting the actual GLB's
  // above-water surface leaves roughly half of every silhouette in the scene.
  const side = Math.sign(layer.position[0]);
  const x = cameraX + side * halfWidth;
  return { ...layer, position: [x, y, z] };
}

export default function OpeningRidges({
  mobile = false,
  layers,
  hazeColor = "#7c8498",
  ...props
}) {
  const size = useThree((state) => state.size);
  const aspect = size.width / size.height;
  const framedLayers = useMemo(() => layers ||
    (mobile ? OPENING_MOBILE_RIDGE_LAYERS : OPENING_RIDGE_LAYERS)
      .map((layer) => frameOpeningRidge(layer, aspect, mobile)), [layers, mobile, aspect]);
  return (
    <group {...props}>
      {framedLayers.map(({ id, ...layer }) => (
        <Mountain
          key={id}
          roughness={1}
          metalness={0}
          rockSurface
          hazeColor={hazeColor}
          hazeNear={50}
          hazeFar={260}
          {...layer}
        />
      ))}
    </group>
  );
}
