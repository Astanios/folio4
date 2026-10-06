import { OrbitControls, Scroll, ScrollControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { MotionConfig } from "framer-motion";
import { Leva } from "leva";
import { Suspense, useEffect, useState, useRef } from "react";
import { Cursor } from "./components/Cursor";
import { Experience } from "./components/Experience";
import Interface from "./components/Interface";
import { LoadingScreen } from "./components/LoadingScreen";
import { Menu } from "./components/Menu";
import { ScrollManager } from "./components/ScrollManager";
import SceneScroll from "./components/SceneScroll";
import { framerMotionConfig, sceneCameraConfig } from "./config";
import { Postpro } from "./components/Postpro";
import Header from "./components/Header";
function App() {
  const [section, setSection] = useState(0);
  const [started, setStarted] = useState(false);
  const [menuOpened, setMenuOpened] = useState(false);
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    setMenuOpened(false);
  }, [section]);

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
                {started && (
                  <Experience
                    section={section}
                    menuOpened={menuOpened}
                    setSelected={setSelected}
                    selected={selected}
                  />
                )}
              </Suspense>
            </SceneScroll>
            <Scroll html>
              {started && (
                <Interface
                  setSection={setSection}
                  selected={selected}
                  setSelected={setSelected}
                />
              )}
            </Scroll>
          </ScrollControls>
        </Canvas>
        <Menu
          onSectionChange={setSection}
          menuOpened={menuOpened}
          setMenuOpened={setMenuOpened}
        />
        <Cursor />
      </MotionConfig>
      <Leva />
    </>
  );
}

export default App;
