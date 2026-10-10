import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { OPENING_CLOUD_NOISE, OPENING_PASSING_CLOUD } from "./openingCloudShader";

const vertex = `
  varying vec3 vWorld;
  uniform float uReflectionPass;
  uniform mat4 uSourceViewProjection;
  uniform vec3 uHorizonScreen;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
    if (uReflectionPass > 0.5) {
      vec4 sourceClip = uSourceViewProjection * world;
      float horizonY = uHorizonScreen.y + uHorizonScreen.z
        * (sourceClip.x / sourceClip.w - uHorizonScreen.x);
      sourceClip.y = 2.0 * horizonY * sourceClip.w - sourceClip.y;
      sourceClip.x *= -1.0;
      gl_Position = sourceClip;
    }
  }
`;

const fragment = `
  varying vec3 vWorld;
  uniform vec3 uSun;
  uniform vec3 uHorizonNormal;
  uniform float uHorizonElevation;
  uniform float uSunRadius;
  uniform float uTime;
  uniform float uReveal;
  uniform float uReflectionPass;
  uniform vec3 uSourceCamera;

  ${OPENING_CLOUD_NOISE}
  ${OPENING_PASSING_CLOUD}
  void main() {
    vec3 sourceCamera = uReflectionPass > 0.5 ? uSourceCamera : cameraPosition;
    vec3 direction = normalize(vWorld - sourceCamera);
    vec3 solarDirection = normalize(uSun - sourceCamera);
    float elevation = dot(direction, uHorizonNormal);
    float height = elevation - uHorizonElevation;
    float solarDistance = length(direction - solarDirection);
    vec3 dusk = vec3(0.31, 0.13, 0.23);
    vec3 zenith = vec3(0.10, 0.125, 0.25);
    vec3 color = mix(dusk, zenith, smoothstep(0.02, 0.58, height));
    color = mix(color, vec3(0.84, 0.32, 0.17), exp(-abs(height) * 11.0) * 0.72);
    color += vec3(0.6, 0.20, 0.075) * exp(-solarDistance * 4.0) * 0.32;
    color += vec3(1.1, 0.62, 0.20) * exp(-solarDistance * 16.0) * 0.8;

    // Broad billows, bent wisps and small broken edges use different scales.
    // Varying the bank envelope avoids a uniform strip across the whole sky.
    float spread = openingCloudNoise(vec2(direction.x * 5.5 + 4.2, 1.7));
    float warp = openingCloudNoise(vec2(direction.x * 10.0 + 2.3, height * 8.0));
    vec2 p = vec2(direction.x * 9.5 + uTime * 0.006,
      height * 27.0 + (warp - 0.5) * 0.20);
    float densityField = openingCloudFbm(p);
    float fine = openingCloudNoise(p * vec2(3.3, 2.6) + vec2(8.1, uTime * 0.013));
    float bottom = 0.024 + spread * 0.012;
    float top = 0.36 + spread * 0.025;
    float banks = smoothstep(bottom, bottom + 0.055, height)
      * (1.0 - smoothstep(top - 0.08, top + 0.1, height));
    float density = smoothstep(0.43, 0.69, densityField + (fine - 0.5) * 0.13) * banks;
    float wisps = openingCloudNoise(vec2(direction.x * 25.0 + uTime * 0.011,
      height * 155.0 + warp * 0.45));
    float wispEnvelope = smoothstep(0.08, 0.16, height)
      * (1.0 - smoothstep(0.42, 0.58, height));
    density = clamp(density + smoothstep(0.59, 0.89, wisps) * wispEnvelope
      * (0.10 + densityField * 0.17), 0.0, 1.0);
    float lowerEdge = max(openingCloudNoise(p + vec2(0.0, -0.2)) - densityField, 0.0) * 3.7;
    float illumination = exp(-solarDistance * 3.5);
    vec3 cloud = mix(vec3(0.12, 0.10, 0.18), vec3(0.48, 0.23, 0.22), illumination);
    cloud *= 0.88 + fine * 0.22;
    cloud += vec3(0.95, 0.47, 0.19) * lowerEdge * illumination;
    color = mix(color, cloud, density * 0.82);

    // This angular field also attenuates the actual solar mesh. Compositing
    // its color here lets the shared mask read as a cloud in front of the disc
    // while avoiding a transparent plane or an additional occlusion render.
    float passingCloud = openingPassingCloud(direction, solarDirection, uHorizonNormal, uTime);
    vec3 passingColor = mix(vec3(0.18, 0.10, 0.16), vec3(0.40, 0.25, 0.23), illumination);
    passingColor *= 0.90 + fine * 0.15;
    passingColor += vec3(0.6, 0.27, 0.08) * passingCloud * (1.0 - passingCloud) * illumination;
    color = mix(color, passingColor, passingCloud);

    // A soft angular mask suggests shafts through cloud gaps. This is an
    // artistic scattering approximation, with no volume or extra render pass.
    vec3 solarRight = normalize(cross(solarDirection, uHorizonNormal));
    vec3 solarUp = normalize(cross(solarRight, solarDirection));
    vec2 fromSun = vec2(dot(direction - solarDirection, solarRight),
      dot(direction - solarDirection, solarUp));
    float angle = atan(fromSun.y, fromSun.x);
    float angularVariation = openingCloudNoise(vec2(angle * 11.0, 2.7 + uTime * 0.004)) * 0.65
      + openingCloudNoise(vec2(angle * 31.0 + 8.3, 9.4 + uTime * 0.006)) * 0.35;
    float openings = smoothstep(0.38, 0.77, angularVariation);
    // Trace a short corridor across the solar source in this beam direction.
    // A cloud covering that corridor dims the shaft instead of merely adding
    // a decorative, unrelated starburst around the sun.
    float solarRadius = uSunRadius / max(length(uSun - sourceCamera), 1.0);
    vec3 beamAxis = solarRight * cos(angle) + solarUp * sin(angle);
    float shafts = 0.0;
    // The expensive source lookup only matters outside the disc and close
    // enough to see a shaft; broad sky and below-horizon fragments skip it.
    if (solarDistance > solarRadius * 0.95 && solarDistance < 0.65 && height > 0.0) {
      float sourceCloud = max(
        openingPassingCloud(normalize(solarDirection + beamAxis * solarRadius * 0.35),
          solarDirection, uHorizonNormal, uTime),
        openingPassingCloud(normalize(solarDirection + beamAxis * solarRadius * 0.85),
          solarDirection, uHorizonNormal, uTime));
      float sourceTransmission = pow(1.0 - sourceCloud, 2.5);
      shafts = openings * sourceTransmission * exp(-solarDistance * 3.8)
        * smoothstep(solarRadius * 0.95, solarRadius * 1.85, solarDistance)
        * (1.0 - smoothstep(0.48, 0.65, solarDistance))
        * (1.0 - density * 0.86) * (1.0 - passingCloud)
        * smoothstep(0.0, 0.07, height);
    }
    color += vec3(0.50, 0.28, 0.11) * shafts;
    // Tiny dither prevents broad dusk gradients banding on 8-bit displays.
    color += (openingCloudHash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(color, uReveal);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }
`;

export default function OpeningAtmosphere({ sunPosition, horizonPosition, transition, reducedMotion, cloudClock, sunRadius = 11.5 }) {
  const mesh = useRef();
  const localClock = useRef(0);
  const horizonPoint = useMemo(() => new THREE.Vector3(), []);
  const horizonWorld = useMemo(() => new THREE.Vector3(), []);
  const horizonScreen = useMemo(() => new THREE.Vector3(), []);
  const horizonTangent = useMemo(() => new THREE.Vector3(), []);
  const uniforms = useMemo(() => ({
    uSun: { value: new THREE.Vector3() },
    uHorizonNormal: { value: new THREE.Vector3() },
    uHorizonElevation: { value: -0.04 },
    uSunRadius: { value: sunRadius },
    uTime: { value: 0 },
    uReveal: { value: 1 },
    uReflectionPass: { value: 0 },
    uSourceCamera: { value: new THREE.Vector3() },
    uSourceViewProjection: { value: new THREE.Matrix4() },
    uHorizonScreen: { value: new THREE.Vector3() },
  }), []);
  const reflection = useMemo(() => ({
    begin() {
      const previousPass = uniforms.uReflectionPass.value;
      uniforms.uReflectionPass.value = 1;
      return () => { uniforms.uReflectionPass.value = previousPass; };
    },
  }), [uniforms]);
  const userData = useMemo(() => ({ openingAtmosphereReflection: reflection }), [reflection]);
  useFrame((state, delta) => {
    const reveal = 1 - THREE.MathUtils.smoothstep(transition.current.progress, 0.08, 0.78);
    mesh.current.visible = reveal > 0.001;
    if (!mesh.current.visible) return;
    const parent = mesh.current.parent;
    parent.updateWorldMatrix(true, false);
    uniforms.uSun.value.fromArray(sunPosition).applyMatrix4(parent.matrixWorld);
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
    horizonTangent.crossVectors(uniforms.uHorizonNormal.value, horizonPoint)
      .normalize().multiplyScalar(horizonWorld.distanceTo(state.camera.position) * 0.01)
      .add(horizonWorld).project(state.camera);
    const span = horizonTangent.x - horizonScreen.x;
    const slope = Math.abs(span) > 0.00001
      ? (horizonTangent.y - horizonScreen.y) / span : 0;
    uniforms.uHorizonScreen.value.set(horizonScreen.x, horizonScreen.y, slope);
    const clock = cloudClock ?? localClock;
    if (!reducedMotion) clock.current += Math.min(delta, 0.05);
    uniforms.uTime.value = clock.current;
    uniforms.uReveal.value = reveal;
    uniforms.uSunRadius.value = sunRadius;
  });
  return (
    <mesh ref={mesh} position={[0, -70, -285]} renderOrder={-2200} raycast={() => null}
      userData={userData} frustumCulled={false}>
      <planeGeometry args={[1100, 760]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment}
        transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
