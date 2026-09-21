import { useScroll, Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { animate, useMotionValue } from "framer-motion";
import { motion } from "framer-motion-3d";
import { useEffect, useRef, useState } from "react";
import { useControls } from "leva";
// import { DirectionalLightHelper } from "three";

import { framerMotionConfig } from "../config";
import Ocean from "./Ocean";
import Mountain from "./Mountain";
import { Postpro } from "./Postpro";
import Hand from "./Hand";
import Swarm from "./Swarm";
import Mirror from "./Mirror";

const animateMirror = {
  0: { x: 0, y: 10, z: 0, rotateX: 0, rotateY: 0 },
  2: { x: 0.5, y: -14.2, z: 7.3, rotateX: 0, rotateY: -0.5 },
};

const rightHand = {
  0: { x: -50, y: -150, z: -300 },
  1: { x: -30, y: -50, z: -80, scale: 4, rotateX: -0.4 },
  2: { y: -40, x: -60 },
};
const leftHand = {
  0: {
    x: 50,
    y: -150,
    z: -300,
    rotateX: -0.4,
    rotateZ: 3.1,
    rotateY: 3.1,
  },
  1: {
    x: 30,
    y: -50,
    z: -80,
    scale: 4,
    rotateX: -0.4,
    rotateY: 3.1,
    rotateZ: 3.1,
  },
  2: { y: -40, x: -60 },
};

const animateOcean = {
  0: {
    rotateX: -0.3,
    rotateY: 3.15,
    rotateZ: 0,
    x: 0,
    y: -23,
    z: -36,
  },
  1: { z: -30, y: -60 },
  2: { z: -36, y: -40 },
};
export const Experience = (props) => {
  const { PI } = Math;
  const { posX, posY, posZ, intensity, rotX, rotY, rotZ, x, y, z } =
    useControls({
      rotX: {
        value: 0,
        min: -2 * PI,
        max: 2 * PI,
        step: 0.01,
      },
      rotY: {
        value: -1.6,
        min: -2 * PI,
        max: 2 * PI,
        step: 0.01,
      },
      rotZ: {
        value: -3.5,
        min: -2 * PI,
        max: 2 * PI,
        step: 0.01,
      },
      posX: {
        value: 0,
        min: -2000,
        max: 2000,
        step: 10,
      },
      posY: {
        value: 0,
        min: -2000,
        max: 2000,
        step: 10,
      },
      posZ: {
        value: 0,
        min: -2000,
        max: 2000,
        step: 10,
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
  const { menuOpened, selected, setSelected } = props;
  const { viewport } = useThree();
  const data = useScroll();
  const lightRef = useRef();

  const isMobile = window.innerWidth < 768;
  const responsiveRatio = viewport.width / 12;
  const officeScaleRatio = Math.max(0.5, Math.min(0.9 * responsiveRatio, 0.9));

  const [section, setSection] = useState(0);

  const cameraPositionX = useMotionValue();
  const cameraLookAtX = useMotionValue();

  useEffect(() => {
    animate(cameraPositionX, menuOpened ? -5 : 0, {
      ...framerMotionConfig,
    });
    animate(cameraLookAtX, menuOpened ? 5 : 0, {
      ...framerMotionConfig,
    });
  }, [menuOpened]);

  const [characterAnimation, setCharacterAnimation] = useState("Typing");
  useEffect(() => {
    setCharacterAnimation("Falling");
  }, []);

  const characterGroup = useRef();
  const oceanGroup = useRef();
  const mirrorGroup = useRef();
  const rightHandGroup = useRef();
  const leftHandGroup = useRef();
  const mountainGroup = useRef();

  useFrame((state) => {
    let curSection = Math.floor(data.scroll.current * data.pages);

    if (curSection > 3) {
      curSection = 3;
    }

    if (curSection !== section) {
      setSection(curSection);
    }

    state.camera.position.x = cameraPositionX.get();
    state.camera.lookAt(cameraLookAtX.get(), 0, 0);

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
    // const { x, y, z } = whaleGroup.current.position;
    // if (section === 0) {
    //   whaleGroup.current.position.set(
    //     x < -36 ? 45 : x - 0.002, //Math.sin(t) * radius * 10,
    //     y, //(Math.cos(t) * radius * Math.atan(t)) / Math.PI / 1.25,
    //     z
    //   );
    // }
    // if (section === 1) {
    //   whaleGroup.current.position.set(5.5, -26, -66);
    // }
  });
  // useHelper(lightRef, DirectionalLightHelper, 1, "white");

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
      <Postpro section={section} />

      {/* <motion.group
        ref={characterGroup}
        animate={"" + section}
        position={[-5, -11, -14]}
        rotation={[-0.3, 1.1, 0]}
        scale={officeScaleRatio}
        transition={{
          duration: 1.2,
        }}
        variants={{
          1: {
            x: 0,
            y: -25,
            z: 25,
            rotateX: -0.3,
            rotateY: 1.1,
            rotateZ: 0,
          },
          2: {
            x: -90,
            y: -26,
            z: 30,
            rotateX: -0.3,
            rotateY: 1.1,
            rotateZ: 0,
            scaleX: isMobile ? 1.5 : officeScaleRatio * 3,
            scaleY: isMobile ? 1.5 : officeScaleRatio * 3,
            scaleZ: isMobile ? 1.5 : officeScaleRatio * 3,
          },
          3: {
            y: -viewport.height * 3 + 1,
            x: 0.24,
            z: 8.5,
            rotateX: 0,
            rotateY: -Math.PI / 4,
            rotateZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
        }}
      >
        <group>
          <group position={[25, -3, 24]}>
            <Island scale={section === 2 ? 1.6 : 1} />
            <group position={[0, 10, 0]}>
              {IMAGES.map(({ position, id }) => (
                <Fruit
                  scale={0.5}
                  selected={selected}
                  setSelected={setSelected}
                  id={id}
                  position={position}
                  key={id}
                />
              ))}
            </group>
          </group>

          <Mountain position={[32, -10, -99]} />
        </group>
      </motion.group> */}

      <motion.group
        ref={mountainGroup}
        animate={"" + section}
        scale={officeScaleRatio}
        rotation={[-0.3, 1.1, 0]}
        transition={{
          duration: 1.2,
        }}
        variants={{
          0: {
            x: -46,
            y: -28,
            z: -46,
          },
          1: {
            x: -54,
            y: 0,
            z: 45,
          },
        }}
      >
        <Mountain />
      </motion.group>
      <motion.group
        ref={oceanGroup}
        rotation={[-0.3, 3.15, 0]}
        position={[0, -23, -36]}
        scale={officeScaleRatio}
        transition={{ duration: 1.6 }}
        animate={animateOcean[section]}
      >
        <Ocean />
      </motion.group>

      <motion.group
        ref={leftHandGroup}
        animate={"" + section}
        transition={{ duration: 1.4 }}
        variants={leftHand}
      >
        <Hand key={"hand"} scale={5} />
      </motion.group>
      <motion.group
        ref={rightHandGroup}
        animate={"" + section}
        transition={{ duration: 1.4 }}
        variants={rightHand}
        rotation={[0, Math.PI, -2.9]}
      >
        <Hand key={"hand"} scale={[-5, 5, 5]} />
      </motion.group>
      <motion.group
        ref={mirrorGroup}
        animate={"" + section}
        transition={{ duration: 1.4 }}
        variants={animateMirror}
      >
        <Mirror />
      </motion.group>
    </>
  );
};
