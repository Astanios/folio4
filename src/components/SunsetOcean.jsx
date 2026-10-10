import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Water } from "three-stdlib";
import * as THREE from "three";

const DEFAULT_SUN_POSITION = [0, -45, -112];
const DEFAULT_SIZE = [600, 500];

/**
 * The opening uses the original reflective Water material. sunPosition is in
 * the enclosing scene's coordinates, so it follows that scene during ascent.
 * Transform props apply to the group; the water surface lies on its XZ plane.
 */
export default function SunsetOcean({
  sunPosition = DEFAULT_SUN_POSITION,
  size = DEFAULT_SIZE,
  waterColor = 0x001e0f,
  sunColor = 0xffffff,
  distortionScale = 3.7,
  waveStrength = 1,
  reflectionStrength = 1,
  reducedMotion = false,
  ...props
}) {
  const group = useRef();
  const elapsed = useRef(0);
  const waterNormals = useLoader(THREE.TextureLoader, "/waternormals.jpeg");
  const vectors = useMemo(() => ({
    sun: new THREE.Vector3(),
    center: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    depth: new THREE.Vector3(),
  }), []);

  const water = useMemo(() => {
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
    const geometry = new THREE.PlaneGeometry(size[0], size[1]);
    const surface = new Water(geometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      waterColor,
      sunColor,
      sunDirection: new THREE.Vector3(0, 1, 0),
      distortionScale,
      fog: false,
    });
    surface.rotation.x = -Math.PI / 2;

    // Water's built-in wave normals assume a horizontal world plane. Align
    // those normals with our composed/tilted surface before lighting them.
    surface.material.uniforms.waterNormalBasis = { value: new THREE.Matrix3() };
    surface.material.uniforms.reflectionStrength = { value: 1 };
    surface.material.fragmentShader = surface.material.fragmentShader
      .replace("uniform vec3 eye;", "uniform vec3 eye;\n uniform mat3 waterNormalBasis;\n uniform float reflectionStrength;")
      .replace(
        "vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );",
        "vec3 surfaceNormal = normalize( waterNormalBasis * ( noise.xzy * vec3( 1.5, 1.0, 1.5 ) ) );",
      )
      .replace(
        "vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );",
        "vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) ) * reflectionStrength;",
      );

    // This version of Water retains its render target only inside a closure.
    // Capture the target the first time it renders so its framebuffer, depth
    // buffer and texture can all be released when the component is removed.
    const renderReflection = surface.onBeforeRender;
    const renderers = new WeakMap();
    surface.onBeforeRender = function (renderer, scene, camera) {
      let reflectionRenderer = renderers.get(renderer);
      if (!reflectionRenderer) {
        reflectionRenderer = Object.create(renderer);
        reflectionRenderer.setRenderTarget = (target, ...args) => {
          if (target?.texture === surface.material.uniforms.mirrorSampler.value) {
            surface.userData.reflectionTarget = target;
          }
          renderer.setRenderTarget(target, ...args);
        };
        reflectionRenderer.render = (reflectionScene, reflectionCamera) => {
          // Mirror the approved sunset sources around the visible horizon in
          // this existing pass. Every reflected 3D model stays physical.
          const restore = [];
          reflectionScene.traverseVisible((object) => {
            const source = object.userData?.openingSunReflection
              ?? object.userData?.openingAtmosphereReflection;
            if (source) restore.push(source.begin());
          });
          try {
            renderer.render(reflectionScene, reflectionCamera);
          } finally {
            for (let i = restore.length - 1; i >= 0; i -= 1) restore[i]();
          }
        };
        renderers.set(renderer, reflectionRenderer);
      }
      renderReflection.call(surface, reflectionRenderer, scene, camera);
    };
    return surface;
  }, [waterNormals, size[0], size[1]]);

  useEffect(() => () => {
    if (water.userData.reflectionTarget) {
      water.userData.reflectionTarget.dispose();
    } else {
      // No framebuffer was allocated if this ocean was never rendered.
      water.material.uniforms.mirrorSampler.value.dispose();
    }
    water.material.dispose();
    water.geometry.dispose();
    // The normal map is cached/shared with the contact ocean: leave it alive.
  }, [water]);

  useFrame((_, delta) => {
    if (!reducedMotion) elapsed.current += Math.min(delta, 0.06);
    const uniforms = water.material.uniforms;
    uniforms.time.value = elapsed.current;
    uniforms.distortionScale.value = distortionScale * waveStrength;
    uniforms.waterColor.value.set(waterColor);
    uniforms.sunColor.value.set(sunColor);
    uniforms.reflectionStrength.value = reflectionStrength;

    vectors.sun.fromArray(sunPosition);
    if (group.current?.parent) {
      group.current.parent.updateWorldMatrix(true, false);
      group.current.parent.localToWorld(vectors.sun);
    }
    water.updateWorldMatrix(true, false);
    water.getWorldPosition(vectors.center);
    uniforms.sunDirection.value.subVectors(vectors.sun, vectors.center).normalize();

    // Water's geometry is XY: local X is across the sea, Z is its normal,
    // and negative local Y runs into the sea after its -PI/2 rotation.
    vectors.tangent.setFromMatrixColumn(water.matrixWorld, 0).normalize();
    vectors.normal.setFromMatrixColumn(water.matrixWorld, 2).normalize();
    vectors.depth.setFromMatrixColumn(water.matrixWorld, 1).normalize().negate();
    uniforms.waterNormalBasis.value.set(
      vectors.tangent.x, vectors.normal.x, vectors.depth.x,
      vectors.tangent.y, vectors.normal.y, vectors.depth.y,
      vectors.tangent.z, vectors.normal.z, vectors.depth.z,
    );
  });

  return (
    <group ref={group} {...props}>
      <primitive object={water} dispose={null} />
    </group>
  );
}
