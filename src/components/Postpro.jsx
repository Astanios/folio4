import { extend, useLoader, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  FilmPass,
  WaterPass,
  UnrealBloomPass,
  LUTPass,
  LUTCubeLoader,
} from "three-stdlib";
import { Effects } from "@react-three/drei";
import {
  EffectComposer,
  DepthOfField,
  Bloom,
  Vignette,
  GodRays,
  HueSaturation,
  LUT,
  Scanline,
  Pixelation,
} from "@react-three/postprocessing";
import { motion } from "framer-motion-3d";
import { BlendFunction, Resizer, KernelSize, GlitchMode } from "postprocessing";
import Sun from "./Sun";
import { THOUGHT_FIELD_LAYOUT } from "./thoughtFieldLayout";

extend({ WaterPass, UnrealBloomPass, FilmPass, LUTPass });

export const Postpro = ({ section, thoughtFieldLayout = THOUGHT_FIELD_LAYOUT }) => {
  const sunRef = useRef();
  const isMobile = window.innerWidth < 768;
  const section2Fx = thoughtFieldLayout.effects;

  // const water = useRef();
  // const data = useLoader(LUTCubeLoader, "/cubicle.CUBE");
  // useFrame((state) => (water.current.time = state.clock.elapsedTime * 4));
  const thoughtFieldSun = isMobile
    ? thoughtFieldLayout.sun.mobile
    : thoughtFieldLayout.sun.desktop;
  const animateSun = {
    1: {
      scale: thoughtFieldSun.scale,
      x: thoughtFieldSun.x,
      y: thoughtFieldSun.y,
      z: thoughtFieldSun.z,
    },
    2: { scale: 1, x: 0, y: -29, z: 15 },
    3: { scale: 0.35, x: 0, y: -40, z: -20 },
  };
  return (
    <>
      <motion.group
        position={[0, isMobile ? -50 : -45, -112]}
        transition={{
          duration: 1.4,
        }}
        animate={{ ...animateSun[section] }}
      >
        <Sun ref={sunRef} />
      </motion.group>

      {sunRef.current && (
        <EffectComposer multisampling={0}>
          {/* <DepthOfField
            focusDistance={1}
            focalLength={0.5}
            bokehScale={2}
            height={720}
          /> */}
          {/* <Noise opacity={0.025} /> */}
          <Vignette
            eskil={false}
            offset={0.1}
            darkness={section === 1 ? section2Fx.vignetteDarkness : 1.2}
          />
          {/* <LUT lut={data.texture} /> */}

          {/* <Bloom
            luminanceThreshold={0.6}
            luminanceSmoothing={0.9}
            opacity={10}
          /> */}
          <GodRays
            sun={sunRef.current}
            blendFunction={BlendFunction.Screen}
            samples={section === 1 ? section2Fx.godRaysSamples : 40}
            density={section === 1 ? section2Fx.godRaysDensity : 1}
            decay={section === 1 ? section2Fx.godRaysDecay : 0.9}
            weight={section === 1 ? section2Fx.godRaysWeight : 1}
            exposure={section === 1 ? section2Fx.godRaysExposure : 0.1}
            clampMax={1}
            width={Resizer.AUTO_SIZE}
            height={Resizer.AUTO_SIZE}
            kernelSize={KernelSize.LARGE}
          />
          <HueSaturation
            blendFunction={BlendFunction.NORMAL} // blend mode
            hue={section === 1 ? section2Fx.hue : 0.1} // hue in radians
            saturation={section === 1 ? section2Fx.saturation : 0.7} // saturation in radians
          />
          <Bloom
            mipmapBlur
            intensity={section === 1 ? section2Fx.bloom1Intensity : 0.45}
            luminanceThreshold={0}
            luminanceSmoothing={section === 1 ? section2Fx.bloom1Smoothing : 0.75}
            radius={section === 1 ? section2Fx.bloom1Radius : undefined}
            levels={section === 1 ? section2Fx.bloom1Levels : undefined}
          />
          <Bloom
            mipmapBlur
            intensity={section === 1 ? section2Fx.bloom2Intensity : 0}
            luminanceThreshold={0}
            luminanceSmoothing={section === 1 ? section2Fx.bloom2Smoothing : 1}
            radius={section === 1 ? section2Fx.bloom2Radius : undefined}
            levels={section === 1 ? section2Fx.bloom2Levels : undefined}
          />
        </EffectComposer>
      )}
    </>
  );
};

{
  /* <>
<Sun position={[0, -45, -112]} ref={sunRef} />

<Effects disableGamma>
  <waterPass ref={water} factor={0.2} />
  <unrealBloomPass
    args={[undefined, 0.5, 0.001, 0]}
    radius={1.7}
    luminanceThreshold={1}
  />
  <filmPass args={[0.2, 0.5, 1500, false]} />
  <lUTPass lut={data.texture} intensity={0.01} />
</Effects>
</> */
}

// (
//   <>
//     <Sun position={[0, -45, -112]} ref={sunRef} />

//     {sunRef.current && (
//       <EffectComposer>
//         <DepthOfField
//           focusDistance={1}
//           focalLength={0.02}
//           bokehScale={2}
//           height={480}
//         />
//         <Bloom
//           luminanceThreshold={0}
//           luminanceSmoothing={0.9}
//           height={300}
//           opacity={3}
//         />
//         <Noise opacity={0.025} />
//         <Vignette eskil={false} offset={0.1} darkness={1.1} />
//         {/* <LUT lut={data} width={1} /> */}

//         <GodRays
//           sun={sunRef.current}
//           blendFunction={BlendFunction.Screen}
//           samples={30}
//           density={0.9}
//           decay={0.9}
//           weight={1}
//           exposure={0.1}
//           clampMax={1}
//           width={Resizer.AUTO_SIZE}
//           height={Resizer.AUTO_SIZE}
//           kernelSize={KernelSize.LARGE}
//           blur={true}
//         />
//       </EffectComposer>
//     )}
//   </>
// );
