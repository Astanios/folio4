import { useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { animate, useMotionValue } from "framer-motion";
import { motion } from "framer-motion-3d";
import { useEffect, useRef, useState } from "react";
import { folder, useControls } from "leva";
import * as THREE from "three";
// import { DirectionalLightHelper } from "three";

import { framerMotionConfig } from "../config";
import Ocean from "./Ocean";
import Mountain from "./Mountain";
import { Postpro } from "./Postpro";
import Mirror from "./Mirror";
import ThoughtFieldScene from "./ThoughtFieldScene";
import { THOUGHT_FIELD_LAYOUT } from "./thoughtFieldLayout";

const animateMirror = {
  0: { x: 0, y: 12, z: -12, rotateX: 0.2, rotateY: -0.2, scale: 0.8 },
  1: { x: 14, y: -8, z: -40, rotateX: 0.4, rotateY: -0.8, scale: 0.2 },
  2: { x: 0.5, y: -14.2, z: 7.3, rotateX: 0, rotateY: -0.5 },
  3: { x: 0, y: -30, z: -30, rotateX: 0, rotateY: 0, scale: 0.2 },
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
  1: { z: -80, y: -82, x: 12, rotateZ: -0.1 },
  2: { z: -36, y: -40 },
  3: { z: -60, y: -70, x: -18 },
};
export const Experience = (props) => {
  const { PI } = Math;
  const { posX, posY, posZ, intensity, rotX, rotY, rotZ, x, y, z } =
    useControls("Lighting", {
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
      intensity: { min: 0, max: 10, value: 1.5, step: 0.5 },
      x: { min: -100, max: 100, value: 18, step: 1 },
      y: { min: -100, max: 100, value: 67, step: 1 },
      z: { min: -100, max: 100, value: 5, step: 1 },
    });
  const section2FxControls = useControls("Section 2 FX", {
    vignette: folder({
      vignetteDarkness: {
        value: THOUGHT_FIELD_LAYOUT.effects.vignetteDarkness,
        min: 0,
        max: 2.5,
        step: 0.01,
      },
    }),
    godRays: folder({
      godRaysSamples: {
        value: THOUGHT_FIELD_LAYOUT.effects.godRaysSamples,
        min: 1,
        max: 60,
        step: 1,
      },
      godRaysDensity: {
        value: THOUGHT_FIELD_LAYOUT.effects.godRaysDensity,
        min: 0,
        max: 1,
        step: 0.001,
      },
      godRaysDecay: {
        value: THOUGHT_FIELD_LAYOUT.effects.godRaysDecay,
        min: 0,
        max: 1,
        step: 0.001,
      },
      godRaysWeight: {
        value: THOUGHT_FIELD_LAYOUT.effects.godRaysWeight,
        min: 0,
        max: 1,
        step: 0.001,
      },
      godRaysExposure: {
        value: THOUGHT_FIELD_LAYOUT.effects.godRaysExposure,
        min: 0,
        max: 0.2,
        step: 0.001,
      },
    }),
    color: folder({
      hue: {
        value: THOUGHT_FIELD_LAYOUT.effects.hue,
        min: -0.5,
        max: 0.5,
        step: 0.001,
      },
      saturation: {
        value: THOUGHT_FIELD_LAYOUT.effects.saturation,
        min: -1,
        max: 1,
        step: 0.001,
      },
    }),
    bloom1: folder({
      bloom1Intensity: {
        value: THOUGHT_FIELD_LAYOUT.effects.bloom1Intensity,
        min: 0,
        max: 8,
        step: 0.01,
      },
      bloom1Smoothing: {
        value: THOUGHT_FIELD_LAYOUT.effects.bloom1Smoothing,
        min: 0,
        max: 1,
        step: 0.001,
      },
      bloom1Radius: {
        value: THOUGHT_FIELD_LAYOUT.effects.bloom1Radius,
        min: 0,
        max: 1.5,
        step: 0.01,
      },
      bloom1Levels: {
        value: THOUGHT_FIELD_LAYOUT.effects.bloom1Levels,
        min: 1,
        max: 9,
        step: 1,
      },
    }),
    bloom2: folder({
      bloom2Intensity: {
        value: THOUGHT_FIELD_LAYOUT.effects.bloom2Intensity,
        min: 0,
        max: 8,
        step: 0.01,
      },
      bloom2Smoothing: {
        value: THOUGHT_FIELD_LAYOUT.effects.bloom2Smoothing,
        min: 0,
        max: 1,
        step: 0.001,
      },
      bloom2Radius: {
        value: THOUGHT_FIELD_LAYOUT.effects.bloom2Radius,
        min: 0,
        max: 1.5,
        step: 0.01,
      },
      bloom2Levels: {
        value: THOUGHT_FIELD_LAYOUT.effects.bloom2Levels,
        min: 1,
        max: 9,
        step: 1,
      },
    }),
  });
  const { menuOpened, selected, setSelected } = props;
  const { viewport } = useThree();
  const data = useScroll();
  const lightRef = useRef();

  const isMobile = window.innerWidth < 768;
  const responsiveRatio = viewport.width / 12;
  const officeScaleRatio = Math.max(0.5, Math.min(0.9 * responsiveRatio, 0.9));

  const [section, setSection] = useState(0);

  const cameraPositionX = useMotionValue(0);
  const cameraLookAtX = useMotionValue(0);

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
  const mountainGroup = useRef();
  const thoughtFieldLayout = {
    ...THOUGHT_FIELD_LAYOUT,
    effects: {
      ...THOUGHT_FIELD_LAYOUT.effects,
      vignetteDarkness: section2FxControls.vignetteDarkness,
      godRaysSamples: section2FxControls.godRaysSamples,
      godRaysDensity: section2FxControls.godRaysDensity,
      godRaysDecay: section2FxControls.godRaysDecay,
      godRaysWeight: section2FxControls.godRaysWeight,
      godRaysExposure: section2FxControls.godRaysExposure,
      hue: section2FxControls.hue,
      saturation: section2FxControls.saturation,
      bloom1Intensity: section2FxControls.bloom1Intensity,
      bloom1Smoothing: section2FxControls.bloom1Smoothing,
      bloom1Radius: section2FxControls.bloom1Radius,
      bloom1Levels: section2FxControls.bloom1Levels,
      bloom2Intensity: section2FxControls.bloom2Intensity,
      bloom2Smoothing: section2FxControls.bloom2Smoothing,
      bloom2Radius: section2FxControls.bloom2Radius,
      bloom2Levels: section2FxControls.bloom2Levels,
    },
  };

  useFrame((state, delta) => {
    let curSection = Math.floor(data.scroll.current * data.pages);

    if (curSection > 3) {
      curSection = 3;
    }

    if (curSection !== section) {
      setSection(curSection);
    }

    const sectionCameraY =
      section === 1 ? THOUGHT_FIELD_LAYOUT.camera.positionY : 3;
    const sectionCameraZ =
      section === 1 ? THOUGHT_FIELD_LAYOUT.camera.positionZ : 10;
    const sectionLookAtX =
      cameraLookAtX.get() +
      (section === 1 ? THOUGHT_FIELD_LAYOUT.camera.lookAtOffsetX : 0);
    const sectionLookAtY =
      section === 1 ? THOUGHT_FIELD_LAYOUT.camera.lookAtY : 0;
    const sectionLookAtZ =
      section === 1 ? THOUGHT_FIELD_LAYOUT.camera.lookAtZ : 0;

    state.camera.position.x = THREE.MathUtils.damp(
      state.camera.position.x,
      cameraPositionX.get() +
        (section === 1 ? THOUGHT_FIELD_LAYOUT.camera.positionOffsetX : 0),
      4,
      delta,
    );
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      sectionCameraY,
      4,
      delta,
    );
    state.camera.position.z = THREE.MathUtils.damp(
      state.camera.position.z,
      sectionCameraZ,
      4,
      delta,
    );
    state.camera.lookAt(sectionLookAtX, sectionLookAtY, sectionLookAtZ);

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
      <Postpro section={section} thoughtFieldLayout={thoughtFieldLayout} />
      <ThoughtFieldScene
        section={section}
        thoughtFieldLayout={thoughtFieldLayout}
      />

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
            x: -110,
            y: 32,
            z: -90,
            scale: officeScaleRatio * 0.4,
          },
          2: { x: -52, y: -6, z: -10, scale: officeScaleRatio },
          3: { x: -80, y: -36, z: -70, scale: officeScaleRatio * 0.4 },
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
    </>
  );
};
