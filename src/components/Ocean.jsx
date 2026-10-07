import { useRef, useMemo } from "react";
import { extend, useThree, useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Water } from "three-stdlib";

extend({ Water });

function Ocean({ waterColor = 0x001e0f, sunColor = 0xffffff,
  sunDirection = [0, 0, 0], distortionScale = 3.7, ...props }) {
  const ref = useRef();
  const gl = useThree((state) => state.gl);
  const waterNormals = useLoader(THREE.TextureLoader, "/waternormals.jpeg");
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  const geom = useMemo(() => new THREE.PlaneGeometry(180, 120), []);
  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(...sunDirection).normalize(),
      sunColor,
      waterColor,
      distortionScale,
      fog: false,
      format: gl.encoding,
    }),
    [waterNormals, waterColor, sunColor, sunDirection[0], sunDirection[1], sunDirection[2], distortionScale]
  );
  useFrame((_, delta) => (ref.current.material.uniforms.time.value += delta));
  return (
    <group {...props}>
      <water ref={ref} args={[geom, config]} rotation-x={-Math.PI / 2} />
    </group>
  );
}

export default Ocean;
