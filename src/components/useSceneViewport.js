import { useThree } from "@react-three/fiber";
import { sceneCameraConfig } from "../config";

// Section spacing and responsive object sizes use the opening camera's world
// scale, even if a resize happens after the camera has flown to a distant island.
const height = 2 * Math.tan(sceneCameraConfig.fov * Math.PI / 360)
  * Math.hypot(...sceneCameraConfig.position);

export default function useSceneViewport() {
  const size = useThree((state) => state.size);
  return { height, width: height * size.width / size.height };
}
