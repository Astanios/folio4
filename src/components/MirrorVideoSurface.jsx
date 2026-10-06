import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D video;
  uniform float videoAspect;
  uniform float frameAspect;
  uniform float strength;
  varying vec2 vUv;
  void main() {
    // Normalize to the oval glass: the lens bends both axes at its perimeter.
    vec2 p = (vUv - 0.5) * 2.0;
    p *= 1.0 - strength + strength * dot(p, p);
    vec2 frameUv = p * 0.5 + 0.5;
    vec3 color = vec3(0.0);
    if (all(greaterThanEqual(frameUv, vec2(0.0))) && all(lessThanEqual(frameUv, vec2(1.0)))) {
      vec2 crop = vec2(min(1.0, frameAspect / videoAspect), min(1.0, videoAspect / frameAspect));
      vec2 sampleUv = (frameUv - 0.5) * crop + 0.5;
      vec3 encoded = texture2D(video, sampleUv).rgb;
      // VideoTexture in Three r146 needs the same sRGB decode as its map shader.
      color = mix(pow(encoded * 0.9478672986 + vec3(0.0521327014), vec3(2.4)),
        encoded * 0.0773993808, vec3(lessThanEqual(encoded, vec3(0.04045))));
    }
    gl_FragColor = vec4(color, 1.0);
    #include <encodings_fragment>
  }
`;

export default function MirrorVideoSurface({ geometry, texture, width, height, strength = 0.28 }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      video: { value: texture },
      videoAspect: { value: 1 },
      // Retain the wider framing while filling the oval from top to bottom.
      frameAspect: { value: width / (height * 0.82) },
      strength: { value: strength },
    },
    vertexShader,
    fragmentShader,
    toneMapped: false,
  }), [texture, width, height, strength]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(() => {
    const video = texture.image;
    if (video.videoWidth && video.videoHeight) {
      material.uniforms.videoAspect.value = video.videoWidth / video.videoHeight;
    }
  });
  return <mesh geometry={geometry} material={material} position={[0, 0, 0.002]}
    dispose={null} raycast={() => null} />;
}
