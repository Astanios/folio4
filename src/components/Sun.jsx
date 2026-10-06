import { forwardRef } from "react";
import { GradientTexture } from "@react-three/drei";
import * as THREE from "three";

const SUN_BLOOM_COLOR = new THREE.Color(2.1, 1.5, 1.15);

const Sun = forwardRef(({ bloom = false, ...props }, ref) => {
  return (
    <mesh ref={ref} scale={15} {...props}>
      <sphereGeometry attach="geometry" />
      <meshBasicMaterial
        key={bloom ? "hdr" : "standard"}
        color={bloom ? SUN_BLOOM_COLOR : "white"}
        toneMapped={!bloom}
      >
        <GradientTexture
          stops={[1, 0, 1]} // As many stops as you want
          colors={["#ffffff", "#ff6f00", "#830202"]} // Colors need to match the number of stops
        />
      </meshBasicMaterial>
    </mesh>
  );
});

export default Sun;
