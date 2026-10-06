import { useGLTF } from "@react-three/drei";
import FloatingIslandBackgroundModel from "./FloatingIslandBackgroundModel";

const SATELLITE_ROOTS = ["pCube1", "pCube2", "pCube3", "pCube4", "pCube5"];

export function BackgroundIsland(props) {
  const { scene } = useGLTF("/models/floating_island_2.glb");
  return <FloatingIslandBackgroundModel scene={scene} satelliteRoots={SATELLITE_ROOTS} {...props} />;
}

useGLTF.preload("/models/floating_island_2.glb");
