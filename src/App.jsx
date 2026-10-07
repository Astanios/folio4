import { Scroll, ScrollControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { MotionConfig } from "framer-motion";
import { Suspense, useState } from "react";
import { Cursor } from "./components/Cursor";
import { Experience } from "./components/Experience";
import Interface from "./components/Interface";
import { LoadingScreen } from "./components/LoadingScreen";
import { ScrollManager } from "./components/ScrollManager";
import SceneScroll from "./components/SceneScroll";
import { framerMotionConfig, sceneCameraConfig } from "./config";

function App() {
  const [section, setSection] = useState(0);
  const [started, setStarted] = useState(false);

  return (
    <>
      <LoadingScreen started={started} setStarted={setStarted} />
      <MotionConfig
        transition={{
          ...framerMotionConfig,
        }}
      >
        <Canvas shadows camera={sceneCameraConfig}>
          <color attach="background" args={["rgb(24, 4, 75)"]} />
          <ScrollControls pages={4} damping={0.1}>
            <ScrollManager section={section} onSectionChange={setSection} />
            <SceneScroll>
              <Suspense>
                {started && <Experience />}
              </Suspense>
            </SceneScroll>
            <Scroll html>
              {started && <Interface />}
            </Scroll>
          </ScrollControls>
        </Canvas>
        <Cursor />
      </MotionConfig>
    </>
  );
}

export default App;
