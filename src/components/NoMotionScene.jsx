import { useScroll, Stars, useHelper, Environment } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { animate, useMotionValue } from "framer-motion";
import { motion } from "framer-motion-3d";
import { useEffect, useRef, useState } from "react";
import { useControls } from "leva";
import { DirectionalLightHelper } from "three";

import { framerMotionConfig } from "../config";
// import { Background } from "./Background";
import { Projects } from "./Projects";
import { Island } from "./Island2";
import Portal from "./Portal";
import Ocean from "./Ocean";
import BlueWhale from "./BlueWhale";
import Clouds from "./Clouds";
import Fruit from "./Fruit";
import Mountain from "./Mountain";
import Sun from "./Sun";

export const NoMotionScene = (props) => {
  // const { PI } = Math;
  const { posX, posY, posZ, intensity, x, y, z } = useControls({
    // rotX: {
    //   value: 0,
    //   min: -PI * 2,
    //   max: PI * 2,
    //   step: PI / 16,
    // },
    // rotY: {
    //   value: 0,
    //   min: -PI * 2,
    //   max: PI * 2,
    //   step: PI / 16,
    // },
    // rotZ: {
    //   value: 0,
    //   min: -PI * 2,
    //   max: PI * 2,
    //   step: PI / 16,
    // },
    posX: {
      value: 0,
      min: -200,
      max: 200,
      step: 2,
    },
    posY: {
      value: -28,
      min: -200,
      max: 200,
      step: 2,
    },
    posZ: {
      value: -52,
      min: -200,
      max: 200,
      step: 2,
    },
    // scale: {
    //   value: 0.15,
    //   min: 0.001,
    //   max: 10,
    //   step: 0.005,
    // },
    intensity: { min: 0, max: 10, value: 1, step: 0.5 },
    x: { min: -100, max: 100, value: 0, step: 1 },
    y: { min: -100, max: 100, value: -11, step: 1 },
    z: { min: -100, max: 100, value: -30, step: 1 },
  });
  const { viewport } = useThree();
  const data = useScroll();
  const lightRef = useRef();

  const isMobile = window.innerWidth < 768;
  const responsiveRatio = viewport.width / 12;
  const officeScaleRatio = Math.max(0.5, Math.min(0.9 * responsiveRatio, 0.9));

  const [section, setSection] = useState(1);

  const cameraPositionX = useMotionValue();
  const cameraLookAtX = useMotionValue();

  const characterContainerAboutRef = useRef();

  const [characterAnimation, setCharacterAnimation] = useState("Typing");
  useEffect(() => {
    setCharacterAnimation("Falling");
    setTimeout(() => {
      setCharacterAnimation(section === 0 ? "Typing" : "Standing");
    }, 600);
  }, [section]);

  const characterGroup = useRef();
  const oceanGroup = useRef();

  //   useFrame((state) => {
  //     let curSection = Math.floor(data.scroll.current * data.pages);

  //     if (curSection > 3) {
  //       curSection = 3;
  //     }

  //     if (curSection !== section) {
  //       setSection(curSection);
  //     }

  //     state.camera.position.x = cameraPositionX.get();
  //     state.camera.lookAt(cameraLookAtX.get(), 0, 0);

  // const position = new THREE.Vector3();
  // if (section === 0) {
  //   characterContainerAboutRef.current.getWorldPosition(
  //     characterGroup.current.position
  //   );
  // }
  // console.log([position.x, position.y, position.z]);

  // const quaternion = new THREE.Quaternion();
  // characterContainerAboutRef.current.getWorldQuaternion(quaternion);
  // const euler = new THREE.Euler();
  // euler.setFromQuaternion(quaternion, "XYZ");

  // console.log([euler.x, euler.y, euler.z]);
  //   });
  useHelper(lightRef, DirectionalLightHelper, 1, "white");

  return (
    <>
      {/* <Background /> */}

      {/* <Environment preset="dawn" background blur={0.6} /> */}
      <directionalLight
        ref={lightRef}
        intensity={intensity}
        position={[x, y, z]}
        color={"orange"}
      />
      <ambientLight intensity={0.1} />
      {/* <Stars radius={0.001} depth={300} count={1000} /> */}

      <group
        ref={characterGroup}
        animate={"" + section}
        position={[-5, -11, -14]}
        rotation={[-0.3, 1.1, 0]}
        transition={{
          duration: 0.6,
        }}
        // variants={{
        //   0: {
        //     x: -5,
        //     y: -11,
        //     z: -14,
        //     rotateX: -0.3,
        //     rotateY: 1.1,
        //     rotateZ: 0,
        //     scaleX: officeScaleRatio,
        //     scaleY: officeScaleRatio,
        //     scaleZ: officeScaleRatio,
        //   },
        //   1: {
        //     x: 0,
        //     y: -25,
        //     z: 25,
        //     rotateX: -0.3,
        //     rotateY: 1.1,
        //     rotateZ: 0,
        //     // z: -20,
        //     // rotateX: 0,
        //     // rotateY: Math.PI / 2,
        //     // rotateZ: 0,
        //     // scaleX: 1,
        //     // scaleY: 1,
        //     // scaleZ: 1,
        //   },
        //   2: {
        //     x: isMobile ? 0.3 : 1,
        //     y: -viewport.height + 5.5,
        //     z: 22,
        //     rotateX: -0.1,
        //     rotateY: 1.25,
        //     rotateZ: 0,
        //     scaleX: isMobile ? 1.5 : officeScaleRatio * 3,
        //     scaleY: isMobile ? 1.5 : officeScaleRatio * 3,
        //     scaleZ: isMobile ? 1.5 : officeScaleRatio * 3,
        //   },
        //   3: {
        //     y: -viewport.height * 3 + 1,
        //     x: 0.24,
        //     z: 8.5,
        //     rotateX: 0,
        //     rotateY: -Math.PI / 4,
        //     rotateZ: 0,
        //     scaleX: 1,
        //     scaleY: 1,
        //     scaleZ: 1,
        //   },
        // }}
      >
        <group>
          {/* <Portal rotation={[0.5, 0, 1.59]} position={[0, 10, 7]} scale={2.5} /> */}
          <Island scale={1} position={[25, -5, 25]} />
          {/* <Ocean rotation={[0, 2.05, 0]} position={[32, -0.5, -14]} /> */}
          {/* <Fruit scale={5} position={[0, 10, 0]} /> */}
          <Mountain position={[32, -6, -99]} />
        </group>
        {/* <Mountain position={[55, -19, -113]} /> */}
      </group>
      <group
        ref={oceanGroup}
        rotation={[-0.3, 3.15, 0]}
        position={[posX, posY, posZ]}
        scale={officeScaleRatio}
        transition={{
          duration: 0.8,
        }}
        animate={{
          z: section === 1 ? -30 : -36,
          y: section === 1 ? -30 : -23,
        }}
      >
        <Ocean />
      </group>

      <BlueWhale
        rotation={[0, -Math.PI / 2, 0]}
        position={[5.5, -25, -66]}
        scale={0.15}
      />
      <gridHelper position={[0, -10, 0]} />
      {/* <group
        position={[
          isMobile ? 0 : 1.5 * officeScaleRatio,
          isMobile ? -viewport.height / 6 : 2,
          3,
        ]}
        scale={[officeScaleRatio, officeScaleRatio, officeScaleRatio]}
        rotation-y={-Math.PI / 4}
        animate={{
          y: isMobile ? -viewport.height / 6 : 0,
        }}
        transition={{
          duration: 0.8,
        }}
      >
        <group
          ref={characterContainerAboutRef}
          name="CharacterSpot"
          position={[0.07, 0.16, -0.57]}
          rotation={[-Math.PI, 0.42, -Math.PI]}
        ></group>
      </group> */}

      {/* SKILLS */}
      {/* <group
        position={[
          0,
          isMobile ? -viewport.height : -1.5 * officeScaleRatio,
          -10,
        ]}
        animate={{
          z: section === 1 ? 0 : -10,
          y:
            section === 1
              ? -viewport.height
              : isMobile
              ? -viewport.height
              : -1.5 * officeScaleRatio,
        }}
      >
        <directionalLight position={[-5, 3, 5]} intensity={0.4} />
        <Float>
          <mesh position={[1, -3, -15]} scale={[2, 2, 2]}>
            <sphereGeometry />
            <MeshDistortMaterial
              opacity={0.8}
              transparent
              distort={0.4}
              speed={4}
              color={"red"}
            />
          </mesh>
        </Float>
        <Float>
          <mesh scale={[3, 3, 3]} position={[3, 1, -18]}>
            <sphereGeometry />
            <MeshDistortMaterial
              opacity={0.8}
              transparent
              distort={1}
              speed={5}
              color="yellow"
            />
          </mesh>
        </Float>
        <Float>
          <mesh scale={[1.4, 1.4, 1.4]} position={[-3, -1, -11]}>
            <boxGeometry />
            <MeshWobbleMaterial
              opacity={0.8}
              transparent
              factor={1}
              speed={5}
              color={"blue"}
            />
          </mesh>
        </Float>
      </group> */}
      <Projects />
    </>
  );
};
