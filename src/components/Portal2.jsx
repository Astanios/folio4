import { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor, Text, Html } from "@react-three/drei";
import { motion } from "framer-motion-3d";

const Portal = ({ selected, ...props }) => {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  //   useFrame((state) =>
  //     ref.current.scale.setScalar(
  //       hovered ? 1 + Math.sin(state.clock.elapsedTime * 10) / 50 : 1
  //     )
  //   );
  // Sets document.body.style.cursor: useCursor(flag, onPointerOver = 'pointer', onPointerOut = 'auto')
  useCursor(hovered);
  return (
    <motion.group {...props}>
      <motion.mesh
        ref={ref}
        receiveShadow
        castShadow
        onClick={(e) => (e.stopPropagation(), setClicked(!clicked))}
        onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
        onPointerOut={(e) => setHovered(false)}
      >
        <Text
          fontSize={0.2}
          anchorY="middle"
          anchorX="center"
          lineHeight={0.8}
          position={[0, 0, 0.1]}
        >
          Riverside.FM
        </Text>

        <Text
          lineHeight={0.8}
          fontSize={0.1}
          anchorY="middle"
          anchorX="center"
          position={[0, 0.5, 0.01]}
        >
          Software Engineer
        </Text>
        <boxGeometry args={[2, 3, 0.075]} />
        <motion.meshStandardMaterial
          roughness={1}
          transparent
          // color={clicked ? "lightblue" : hovered ? "aquamarine" : "white"}
          transition={{
            duration: 0.5,
          }}
          animate={{
            opacity: selected ? 1 : 0,
            color: selected ? "blue" : "red",
          }}
        ></motion.meshStandardMaterial>
      </motion.mesh>
    </motion.group>
  );
};

export default Portal;
