import { forwardRef, useMemo, useRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OPENING_CLOUD_NOISE, OPENING_PASSING_CLOUD } from "./openingCloudShader";

const vertex = `
  varying vec3 vNormal;
  varying vec3 vWorld;
  uniform float uReflectionPass;
  uniform mat4 uSourceViewProjection;
  uniform vec3 uHorizonScreen;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
    if (uReflectionPass > 0.5) {
      // The composed horizon is the ocean's finite far edge. Mirror the
      // approved camera image about that edge instead of the infinite plane.
      vec4 sourceClip = uSourceViewProjection * world;
      float horizonY = uHorizonScreen.y + uHorizonScreen.z
        * (sourceClip.x / sourceClip.w - uHorizonScreen.x);
      sourceClip.y = 2.0 * horizonY * sourceClip.w - sourceClip.y;
      // Water's reflected camera reverses X for points on the mirror plane.
      // Its projective lookup reverses this again in the final water image.
      sourceClip.x *= -1.0;
      gl_Position = sourceClip;
    }
  }
`;

const fragment = `
  varying vec3 vNormal;
  varying vec3 vWorld;
  uniform vec3 uHorizonNormal;
  uniform float uHorizonElevation;
  uniform vec3 uSun;
  uniform float uTime;
  uniform float uReflectionPass;
  uniform vec3 uSourceCamera;
  ${OPENING_CLOUD_NOISE}
  ${OPENING_PASSING_CLOUD}
  void main() {
    // Use the same view of the disc/cloud during the reflection pass. Its
    // projection is mirrored, while its source appearance stays unchanged.
    vec3 sourceCamera = uReflectionPass > 0.5 ? uSourceCamera : cameraPosition;
    float facing = max(dot(normalize(vNormal), normalize(sourceCamera - vWorld)), 0.0);
    // Atmospheric extinction warms and softens the limb. The sky supplies the
    // broad halo, so the disc never needs a second, sharply bounded glow shell.
    float limb = smoothstep(0.0, 0.55, facing);
    vec3 color = mix(vec3(1.5, 0.60, 0.16), vec3(1.9, 1.27, 0.65), limb);
    float elevation = dot(normalize(vWorld - sourceCamera), uHorizonNormal);
    float horizon = smoothstep(uHorizonElevation - 0.002, uHorizonElevation + 0.002, elevation);
    float cloud = openingPassingCloud(normalize(vWorld - sourceCamera),
      normalize(uSun - sourceCamera), uHorizonNormal, uTime);
    // Extinction dims the source, while alpha reveals the matching cloud in
    // the sky behind it. GodRays renders this material too, so its beams follow
    // the same moving cloud gaps instead of shining through an intact disc.
    float transmission = pow(1.0 - cloud, 2.0);
    gl_FragColor = vec4(color, smoothstep(0.0, 0.2, facing) * horizon * transmission);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }
`;

const OpeningSun = forwardRef(function OpeningSun({ radius = 11.5, horizonPosition, cloudClock, ...props }, ref) {
  const mesh = useRef();
  useImperativeHandle(ref, () => mesh.current, []);
  const horizonPoint = useMemo(() => new THREE.Vector3(), []);
  const horizonWorld = useMemo(() => new THREE.Vector3(), []);
  const horizonScreen = useMemo(() => new THREE.Vector3(), []);
  const horizonTangent = useMemo(() => new THREE.Vector3(), []);
  const uniforms = useMemo(() => ({
    uHorizonNormal: { value: new THREE.Vector3(0, Math.cos(0.3), -Math.sin(0.3)) },
    uHorizonElevation: { value: -0.04 },
    uSun: { value: new THREE.Vector3() },
    uTime: { value: 0 },
    uReflectionPass: { value: 0 },
    uSourceCamera: { value: new THREE.Vector3() },
    uSourceViewProjection: { value: new THREE.Matrix4() },
    uHorizonScreen: { value: new THREE.Vector3() },
  }), []);
  const reflection = useMemo(() => ({
    begin() {
      const previousPass = uniforms.uReflectionPass.value;
      uniforms.uReflectionPass.value = 1;
      return () => {
        uniforms.uReflectionPass.value = previousPass;
      };
    },
  }), [uniforms]);
  const userData = useMemo(() => ({ openingSunReflection: reflection }), [reflection]);
  useFrame((state) => {
    if (!horizonPosition) return;
    const parent = mesh.current.parent;
    parent.updateWorldMatrix(true, false);
    mesh.current.getWorldPosition(uniforms.uSun.value);
    uniforms.uTime.value = cloudClock?.current ?? 0;
    uniforms.uHorizonNormal.value.set(0, Math.cos(0.3), -Math.sin(0.3))
      .transformDirection(parent.matrixWorld);
    horizonWorld.fromArray(horizonPosition).applyMatrix4(parent.matrixWorld);
    horizonPoint.copy(horizonWorld).sub(state.camera.position).normalize();
    uniforms.uHorizonElevation.value = horizonPoint.dot(uniforms.uHorizonNormal.value);
    state.camera.updateMatrixWorld();
    state.camera.getWorldPosition(uniforms.uSourceCamera.value);
    uniforms.uSourceViewProjection.value.multiplyMatrices(
      state.camera.projectionMatrix, state.camera.matrixWorldInverse,
    );
    horizonScreen.copy(horizonWorld).project(state.camera);
    // A local tangent to the source's angular horizon also supports the small
    // apparent horizon tilt as the camera changes during the section ascent.
    horizonTangent.crossVectors(uniforms.uHorizonNormal.value, horizonPoint)
      .normalize().multiplyScalar(horizonWorld.distanceTo(state.camera.position) * 0.01)
      .add(horizonWorld).project(state.camera);
    const span = horizonTangent.x - horizonScreen.x;
    const slope = Math.abs(span) > 0.00001
      ? (horizonTangent.y - horizonScreen.y) / span : 0;
    uniforms.uHorizonScreen.value.set(horizonScreen.x, horizonScreen.y, slope);
  });
  return (
    <mesh ref={mesh} scale={radius} userData={userData} frustumCulled={false} {...props}>
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment}
        transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
});

export default OpeningSun;
