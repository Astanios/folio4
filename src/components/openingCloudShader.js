// Shared angular cloud coordinates keep the visible sky, solar disc and the
// GodRays source mask in step. There is no texture or extra scene render.
export const OPENING_CLOUD_NOISE = /* glsl */ `
  float openingCloudHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float openingCloudNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(openingCloudHash(i), openingCloudHash(i + vec2(1.0, 0.0)), f.x),
      mix(openingCloudHash(i + vec2(0.0, 1.0)), openingCloudHash(i + 1.0), f.x), f.y);
  }
  float openingCloudFbm(vec2 p) {
    return openingCloudNoise(p) * 0.51
      + openingCloudNoise(p * 2.03 + 19.1) * 0.25
      + openingCloudNoise(p * 4.13 + 8.7) * 0.13
      + openingCloudNoise(p * 8.27 + 31.6) * 0.07
      + openingCloudNoise(p * 16.41 + 5.3) * 0.04;
  }
`;

export const OPENING_PASSING_CLOUD = /* glsl */ `
  float openingPassingCloud(vec3 direction, vec3 solarDirection, vec3 horizonNormal, float time) {
    vec2 p = vec2(direction.x - solarDirection.x,
      dot(direction - solarDirection, horizonNormal));
    // A slow drift carries one soft, irregular cloud across the upper disc.
    // The initial phase exposes the sun's lower half from the first frame.
    float drift = 0.18 * sin(time * 0.075 - 0.28);
    float x = p.x - drift;
    // Most sky fragments are outside this small cloud. Avoid evaluating its
    // fine noise over the rest of the full-screen atmosphere.
    if (abs(x) > 0.26 || abs(p.y - 0.025) > 0.05) return 0.0;
    float billows = openingCloudNoise(vec2(x * 28.0 + 7.4, 2.8 + time * 0.018));
    float crest = 0.025 + sin(x * 31.0 + 0.7) * 0.003 + (billows - 0.5) * 0.006;
    float thickness = 0.010 + billows * 0.009;
    float body = 1.0 - smoothstep(thickness * 0.24, thickness, abs(p.y - crest));
    float ends = 1.0 - smoothstep(0.14, 0.25, abs(x));
    float detail = openingCloudNoise(vec2(x * 96.0 + time * 0.016,
      p.y * 245.0 + 9.1));
    float edgeWisps = openingCloudNoise(vec2(x * 57.0 + 23.0, p.y * 183.0 - time * 0.012));
    float feathers = 1.0 - smoothstep(thickness * 0.5, thickness * 1.6,
      abs(p.y - crest + (edgeWisps - 0.5) * 0.008));
    float broken = smoothstep(0.14, 0.74, detail * 0.65 + edgeWisps * 0.35);
    return clamp(ends * (body * (0.27 + broken * 0.46) + feathers * broken * 0.13), 0.0, 0.80);
  }
`;
