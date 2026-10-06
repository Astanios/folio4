import { useGLTF } from "@react-three/drei";
import FloatingIslandBackgroundModel, { ISLAND_ONE_PALETTE } from "./FloatingIslandBackgroundModel";

const SATELLITE_ROOTS = ["tanah001", "tanah002", "tanah003"];

export function BackgroundIsland(props) {
  const { scene } = useGLTF("/models/floating_island_1.glb");
  return <FloatingIslandBackgroundModel scene={scene} satelliteRoots={SATELLITE_ROOTS}
    basePalette={ISLAND_ONE_PALETTE} {...props} />;
}

useGLTF.preload("/models/floating_island_1.glb");
