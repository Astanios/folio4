import React, { forwardRef } from "react";
import { GradientTexture } from "@react-three/drei";
const Sun = forwardRef((props, ref) => {
  return (
    <mesh ref={ref} scale={10} {...props}>
      <sphereGeometry attach="geometry" />
      <meshBasicMaterial>
        <GradientTexture
          stops={[1, 0, 1]} // As many stops as you want
          colors={["#ffffff", "#ff6f00", "#830202"]} // Colors need to match the number of stops
        />
      </meshBasicMaterial>
    </mesh>
  );
});

export default Sun;
