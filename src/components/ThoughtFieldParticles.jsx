import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COLORS = ["#fff9dd", "#ffe27d", "#ffd198", "#fff2c3", "#fffdf4"];

export default function ThoughtFieldParticles({
  section,
  thoughtFieldLayout,
  mouse,
  isMobile,
}) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const count = isMobile ? 28 : 44;

  const particles = useMemo(
    () => Array.from({ length: count }, (_, index) => ({
      size: index < 3 ? 0.11 - index * 0.018 : 0.018 + Math.random() * 0.04,
      speed: 0.16 + Math.random() * 0.34,
      offset: Math.random(),
      travel:
        (isMobile
          ? Math.max(
              thoughtFieldLayout.particles.spreadMobile,
              thoughtFieldLayout.phrases.spreadMobile * 0.92,
            )
          : Math.max(
              thoughtFieldLayout.particles.spreadDesktop,
              thoughtFieldLayout.phrases.spreadDesktop * 0.95,
            )) *
        (0.88 + Math.random() * 0.18),
      spreadY: THREE.MathUtils.randFloatSpread(isMobile ? 4.4 : 7.2),
      spreadZ:
        index < 2
          ? THREE.MathUtils.randFloat(0.6, 5.2)
          : THREE.MathUtils.randFloatSpread(10.4),
      wobble: THREE.MathUtils.randFloat(0.2, 1),
      brightness: 0.22 + Math.random() * 0.6,
      color:
        PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    })),
    [count, isMobile],
  );

  useFrame((state) => {
    if (!meshRef.current) return;

    const active = section === 1 ? 1 : 0;
    if (!active) return;
    const t = state.clock.elapsedTime;
    const pointerX = mouse.x * 0.45 * active;
    const pointerY = mouse.y * 0.24 * active;

    particles.forEach((particle, index) => {
      const cycle =
        (t *
          particle.speed *
          thoughtFieldLayout.particles.speedMultiplier +
          particle.offset) %
        1;
      const drift = 1 - Math.pow(1 - cycle, 2);
      const pulse = 0.7 + Math.cos(t * 1.3 + index) * 0.3;
      const colorBoost = 0.5 + particle.brightness * (0.35 + (1 - cycle) * 0.6);
      color.set(particle.color).multiplyScalar(colorBoost);
      meshRef.current.setColorAt(index, color);

      dummy.position.set(
        thoughtFieldLayout.particles.baseX +
          drift * particle.travel +
          pointerX * 0.12,
        thoughtFieldLayout.particles.baseY +
          particle.spreadY * (0.4 + drift * 0.85) +
          Math.sin(t * (particle.wobble + 0.3) + index * 0.4) *
            0.11 *
            thoughtFieldLayout.particles.wobbleScale +
          pointerY * 0.12,
        particle.spreadZ * (0.35 + drift * 0.95) +
          Math.cos(t * (particle.wobble + 0.15) + index * 0.5) *
            0.16 *
            thoughtFieldLayout.particles.wobbleScale,
      );
      dummy.scale.setScalar(
        particle.size * 4.8 * (0.7 + (1 - cycle) * 0.6) * pulse * active,
      );
      dummy.rotation.set(pulse * 5, pulse * 5, pulse * 5);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(index, dummy.matrix);
    });

    meshRef.current.instanceColor.needsUpdate = true;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshBasicMaterial
        transparent
        opacity={thoughtFieldLayout.particles.opacityScale * 0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
