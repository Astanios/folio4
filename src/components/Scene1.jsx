import { OrbitControls, Scroll, ScrollControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Suspense, useEffect, useState } from "react";
import { Experience } from "./Experience";
import { LoadingScreen } from "./LoadingScreen";
import { Postpro } from "./Postpro";
import { NoMotionScene } from "./NoMotionScene";
function Scene1() {
  const [section, setSection] = useState(0);
  const [started, setStarted] = useState(false);
  const [menuOpened, setMenuOpened] = useState(false);
  useEffect(() => {
    setMenuOpened(false);
  }, [section]);

  return (
    <>
      <LoadingScreen started={started} setStarted={setStarted} />
      <Canvas shadows camera={{ position: [0, 3, 10], fov: 42 }}>
        <color attach="background" args={["rgb(24, 4, 75)"]} />
        <OrbitControls />
        <Postpro />
        <Suspense>
          {started && (
            <NoMotionScene section={section} menuOpened={menuOpened} />
          )}
        </Suspense>
      </Canvas>
      <Leva />
    </>
  );
}

export default Scene1;
