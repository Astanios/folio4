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
import { framerMotionConfig } from "./config";
import { Postpro } from "./components/Postpro";
import { useControls } from "leva";
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
        <Canvas shadows camera={{ position: [0, 3, 10], fov: 42 }}>
          <color attach="background" args={["rgb(24, 4, 75)"]} />
          <ScrollControls pages={4} damping={0.1}>
            <ScrollManager section={section} onSectionChange={setSection} />
            <Scroll>
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
            </Scroll>
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
      <Leva hidden />
    </>
  );
}

export default App;
