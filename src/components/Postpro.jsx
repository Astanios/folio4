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

extend({ WaterPass, UnrealBloomPass, FilmPass, LUTPass });

export const Postpro = ({ section }) => {
  const sunRef = useRef();
  const isMobile = window.innerWidth < 768;

  // const water = useRef();
  // const data = useLoader(LUTCubeLoader, "/cubicle.CUBE");
  // useFrame((state) => (water.current.time = state.clock.elapsedTime * 4));
  const animateSun = {
    1: { scale: isMobile ? 2 : 2.5, y: -50 },
    2: { scale: 1, y: -60 },
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
        <EffectComposer>
          <DepthOfField
            focusDistance={1}
            focalLength={0.5}
            bokehScale={2}
            height={720}
          />
          {/* <Noise opacity={0.025} /> */}
          <Vignette eskil={false} offset={0.1} darkness={1.2} />
          {/* <LUT lut={data.texture} /> */}

          {/* <Bloom
            luminanceThreshold={0.6}
            luminanceSmoothing={0.9}
            opacity={10}
          /> */}
          <GodRays
            sun={sunRef.current}
            blendFunction={BlendFunction.Screen}
            samples={40}
            density={1}
            decay={0.9}
            weight={1}
            exposure={0.1}
            clampMax={1}
            width={Resizer.AUTO_SIZE}
            height={Resizer.AUTO_SIZE}
            kernelSize={KernelSize.LARGE}
          />
          <HueSaturation
            blendFunction={BlendFunction.NORMAL} // blend mode
            hue={0.1} // hue in radians
            saturation={0.7} // saturation in radians
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
