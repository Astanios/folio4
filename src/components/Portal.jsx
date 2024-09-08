/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.2.18 public/models/triangular_portal.glb -o src/components/Portal.jsx -r public -k 
*/
import React, { useRef } from "react";
import { useGLTF, useAnimations, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { motion } from "framer-motion-3d";
import { useSpring, useTransform } from "framer-motion";

const animationsName = ["PortalAction"];

export function Portal(props) {
  const group = useRef();
  const { nodes, materials, animations, scene } = useGLTF(
    "/models/triangular_portal.glb"
  );
  const { actions } = useAnimations(animations, group);

  useFrame(() => {
    animationsName.forEach((animation) => {
      const action = actions[animation];
      action.play();
    });
  });
  return (
    <motion.group center={[0, 0, 0]}>
      <group ref={group} {...props} dispose={null}>
        <Text
          fontSize={0.3}
          anchorY="top"
          anchorX="left"
          lineHeight={0.8}
          position={[-0.375, 0.715, 0.01]}
          material-toneMapped={false}
        >
          Portal
        </Text>
        <group name="Scene">
          <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, 0]}>
            <group
              name="eb5aeda8010a4781bcb9285ea743a8c6fbx"
              rotation={[Math.PI / 2, 0, 0]}
              scale={0.01}
            >
              <group name="Object_2">
                <group name="RootNode">
                  <group
                    name="Portal"
                    position={[0, 0.704, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    scale={100}
                  >
                    <motion.mesh
                      name="0"
                      geometry={nodes["0"].geometry}
                      material={materials.Portal_Inner}
                      morphTargetDictionary={nodes["0"].morphTargetDictionary}
                      morphTargetInfluences={nodes["0"].morphTargetInfluences}
                      opacity={0.1}
                    />
                    <motion.mesh
                      name="1"
                      geometry={nodes["1"].geometry}
                      material={materials.Portal_Rim}
                      morphTargetDictionary={nodes["1"].morphTargetDictionary}
                      morphTargetInfluences={nodes["1"].morphTargetInfluences}
                      opacity={0.1}
                    />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </motion.group>
  );
}

useGLTF.preload("/models/triangular_portal.glb");

export default Portal;