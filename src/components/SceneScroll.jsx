import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import useSceneViewport from "./useSceneViewport";

export default function SceneScroll({ children }) {
  const group = useRef();
  const scroll = useScroll();
  const { height } = useSceneViewport();

  useFrame(() => {
    // Resizing near the company island must not recalculate page spacing from
    // that distant camera position. All sections share the original world scale.
    group.current.position.y = height * (scroll.pages - 1) * scroll.offset;
  });

  return <group ref={group}>{children}</group>;
}
