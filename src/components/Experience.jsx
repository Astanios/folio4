import { useScroll, Stars, useHelper, Environment } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { animate, useMotionValue } from "framer-motion";
import { motion } from "framer-motion-3d";
import { useEffect, useRef, useState } from "react";
import { useControls } from "leva";
import { DirectionalLightHelper } from "three";

import { framerMotionConfig } from "../config";
// import { Background } from "./Background";
// import { Projects } from "./Projects";
import { Island } from "./Island2";
// import Portal from "./Portal2";
import Ocean from "./Ocean";
import BlueWhale from "./BlueWhale";
// import Clouds from "./Clouds";
import Fruit from "./Fruit";
import Mountain from "./Mountain";
// import Sun from "./Sun";
import { Postpro } from "./Postpro";
// import { Marsh } from "./Marsh";
import { IMAGES } from "../utils/images";

export const Experience = (props) => {
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
      value: -23,
      min: -200,
      max: 200,
      step: 2,
    },
    posZ: {
      value: -36,
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
  const whaleGroup = useRef();

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
    const { x, y, z } = whaleGroup.current.position;
    if (section === 0) {
      whaleGroup.current.position.set(
        x < -36 ? 45 : x - 0.002, //Math.sin(t) * radius * 10,
        y, //(Math.cos(t) * radius * Math.atan(t)) / Math.PI / 1.25,
        z
      );
    }
    if (section === 1) {
      whaleGroup.current.position.set(5.5, -26, -66);
    }
  });
  // useHelper(lightRef, DirectionalLightHelper, 1, "white");
  const animateOcean = {
    1: { z: -30, y: -28.5 },
    2: { z: -36, y: -40 },
  };

  const animateWhale = {
    1: { scale: 2.8, x: 0 },
    2: { y: -40, x: -60, rotateY: -Math.PI/4 },
  };

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

      <motion.group
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
          {/* <Ocean rotation={[0, 2.05, 0]} position={[32, -0.5, -14]} /> */}

          <Mountain position={[32, -10, -99]} />
        </group>
        {/* <Mountain position={[55, -19, -113]} /> */}
      </motion.group>
      <motion.group
        ref={oceanGroup}
        rotation={[-0.3, 3.15, 0]}
        position={[0, -23, -36]}
        scale={officeScaleRatio}
        transition={{
          duration: 1.6,
        }}
        animate={{
          ...animateOcean[section],
        }}
      >
        <Ocean />
      </motion.group>

      <motion.group
        ref={whaleGroup}
        rotation={[0, -Math.PI / 2, 0]}
        position={[5.5, -26, -66]}
        scale={0.15}
        transition={{
          duration: 1.4,
        }}
        animate={{ ...animateWhale[section] }}
      >
        <BlueWhale />
      </motion.group>

      {/* <motion.group
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
      </motion.group> */}

      {/* SKILLS */}
      {/* <motion.group
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
      </motion.group> 
      <Projects />*/}
    </>
  );
};
