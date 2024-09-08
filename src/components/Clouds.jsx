import { Cloud } from "@react-three/drei";

export default function Clouds(props) {
  return (
    <group {...props}>
      <Cloud
        depthTest={false}
        position={[-10, -6, -10]}
        speed={0.2}
        opacity={0.4}
      />
      <Cloud
        depthTest={false}
        position={[10, 6, -15]}
        speed={0.2}
        opacity={0.25}
      />
      <Cloud
        depthTest={false}
        position={[0, 10, 0]}
        speed={0.2}
        opacity={0.2}
      />
      <Cloud
        depthTest={false}
        position={[0, -10, 0]}
        speed={0.2}
        opacity={0.2}
      />
      <Cloud
        depthTest={false}
        position={[-10, -6, 15]}
        speed={0.2}
        opacity={0.3}
      />
      <Cloud
        depthTest={false}
        position={[10, 6, 10]}
        speed={0.2}
        opacity={0.25}
      />
    </group>
  );
}
