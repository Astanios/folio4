import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const SPARK_COLORS = ["#fff8da", "#ffe27a", "#ffb86a", "#fff1b8", "#ffd2a8"];

export default function ThoughtFieldSparks({
  section,
  thoughtFieldLayout,
  mouse,
  isMobile,
}) {
  const sparkMeshRef = useRef();
  const pointerLightRef = useRef();
  const { viewport, size } = useThree();
  const aspect = size.width / viewport.width;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = isMobile
    ? thoughtFieldLayout.sparks.countMobile
    : thoughtFieldLayout.sparks.countDesktop;

  const sparks = useMemo(() => {
    const spreadX = isMobile
      ? thoughtFieldLayout.sparks.spreadMobile
      : thoughtFieldLayout.sparks.spreadDesktop;
    const spreadY = isMobile
      ? thoughtFieldLayout.sparks.spreadYMobile
      : thoughtFieldLayout.sparks.spreadYDesktop;
    const spreadZ = isMobile
      ? thoughtFieldLayout.sparks.spreadZMobile
      : thoughtFieldLayout.sparks.spreadZDesktop;

    return Array.from({ length: count }, () => {
      const lane = Math.random();
      return {
        t: Math.random() * 100,
        offset: Math.random(),
        factor: 2 + Math.random() * 8,
        speed: 0.004 + Math.random() * 0.012,
        travel: spreadX * (0.82 + Math.random() * 0.28),
        yFactor:
          thoughtFieldLayout.sparks.baseY +
          THREE.MathUtils.randFloatSpread(spreadY) * (0.35 + lane * 0.85),
        zFactor:
          thoughtFieldLayout.sparks.baseZ +
          THREE.MathUtils.randFloatSpread(spreadZ) * (0.4 + lane * 0.75),
        scale: 0.05 + Math.random() * 0.08,
        mx: 0,
        my: 0,
        color:
          SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
      };
    });
  }, [count, isMobile, thoughtFieldLayout]);

  useEffect(() => {
    if (!sparkMeshRef.current) return;

    sparks.forEach((spark, index) => {
      sparkMeshRef.current.setColorAt(index, new THREE.Color(spark.color));
    });
    sparkMeshRef.current.instanceColor.needsUpdate = true;
  }, [sparks]);

  useFrame((state, delta) => {
    const active = section === 1 ? 1 : 0;
    const orbX = thoughtFieldLayout.orb.position[0];
    const orbY = thoughtFieldLayout.orb.position[1];
    const orbZ = thoughtFieldLayout.orb.position[2];

    if (pointerLightRef.current) {
      pointerLightRef.current.intensity = THREE.MathUtils.damp(
        pointerLightRef.current.intensity,
        active ? thoughtFieldLayout.sparks.pointerLightIntensity : 0,
        4,
        delta,
      );
      pointerLightRef.current.position.set(
        orbX + (mouse.x * 1.8) / Math.max(aspect, 0.001),
        orbY + (-mouse.y * 1.2) / Math.max(aspect, 0.001),
        orbZ + 1.8,
      );
    }

    if (!sparkMeshRef.current) return;

    sparks.forEach((spark, index) => {
      let { t, factor, speed, yFactor, zFactor } = spark;
      t = spark.t += speed * (0.35 + active * 0.85);
      const cycle = (t * 0.12 + spark.offset) % 1;
      const drift = THREE.MathUtils.smoothstep(cycle, 0, 1);
      const x =
        thoughtFieldLayout.sparks.baseX +
        drift * spark.travel +
        (mouse.x * 0.06) / Math.max(aspect, 0.001);
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = 0.65 + Math.cos(t * 1.2) * 0.35;
      spark.mx += (mouse.x - spark.mx) * 0.02;
      spark.my += (mouse.y * -1 - spark.my) * 0.02;

      dummy.position.set(
        x,
        (spark.my / 10) * b +
          yFactor +
          Math.sin((t / 10) * factor) * 0.38 +
          (Math.cos(t * 2) * factor) / 8.5,
        zFactor +
          Math.cos((t / 10) * factor) * 0.42 +
          (Math.sin(t * 3) * factor) / 8.2,
      );
      dummy.scale.setScalar(spark.scale * s * active);
      dummy.rotation.set(s * 4.5, s * 5.1, s * 4.7);
      dummy.updateMatrix();
      sparkMeshRef.current.setMatrixAt(index, dummy.matrix);
    });

    sparkMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <pointLight
        ref={pointerLightRef}
        distance={thoughtFieldLayout.sparks.pointerLightDistance}
        intensity={0}
        decay={1.2}
        color="#ffe0a6"
      />
      <instancedMesh ref={sparkMeshRef} args={[undefined, undefined, count]}>
        <dodecahedronGeometry args={[0.18, 0]} />
        <meshBasicMaterial transparent opacity={0.92} toneMapped={false} />
      </instancedMesh>
    </>
  );
}
