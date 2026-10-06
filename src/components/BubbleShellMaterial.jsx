import { forwardRef, useMemo } from "react";
import { FrontSide, NormalBlending } from "three";

const VERTEX_SHADER = `
  attribute float aBurst;
  attribute float aSeed;

  uniform float uTime;

  varying vec3 vViewPosition;
  varying vec3 vViewNormal;
  varying vec3 vLocalNormal;
  varying float vBurst;
  varying float vSeed;

  void main() {
    vBurst = aBurst;
    vSeed = aSeed;
    vLocalNormal = normal;

    // A small, volume-preserving wobble keeps the film alive without pulsing
    // the whole bubble. It also leaves the rupture anchored to the shell.
    float sway = sin(uTime * 1.1 + aSeed * 6.2831853) * 0.025;
    vec3 stretch = vec3(1.0 + sway, 1.0 - sway * 0.7, 1.0 - sway * 0.3);
    vec4 p = vec4(position * stretch, 1.0);
    vec3 n = normal / stretch;

    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
      mat3 m = mat3(instanceMatrix);
      n /= max(vec3(dot(m[0], m[0]), dot(m[1], m[1]), dot(m[2], m[2])), vec3(0.00001));
      n = m * n;
    #endif

    vec4 viewPosition = modelViewMatrix * p;
    vViewPosition = -viewPosition.xyz;
    vViewNormal = normalMatrix * n;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uOpacity;

  varying vec3 vViewPosition;
  varying vec3 vViewNormal;
  varying vec3 vLocalNormal;
  varying float vBurst;
  varying float vSeed;

  void main() {
    if (vBurst >= 1.0) discard;

    vec3 n = normalize(vViewNormal);
    vec3 localNormal = normalize(vLocalNormal);
    vec3 viewDirection = normalize(vViewPosition);
    float facing = clamp(dot(n, viewDirection), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 3.0);
    float outerRim = pow(1.0 - facing, 9.0);

    // Broad environment reflections provide curved highlights without an
    // environment-map lookup. The film itself stays almost clear head-on.
    vec3 reflection = reflect(-viewDirection, n);
    float upperArc = exp(-pow((reflection.y - 0.68) * 7.5, 2.0))
      * (1.0 - smoothstep(-0.12, 0.65, reflection.x));
    float lowerArc = exp(-pow((reflection.y + 0.72) * 10.0, 2.0))
      * smoothstep(-0.6, 0.45, reflection.x);
    float glint = pow(max(dot(reflection, normalize(vec3(-0.55, 0.75, 0.8))), 0.0), 180.0);

    float filmPhase = facing * 12.0 + localNormal.y * 3.0
      + sin(localNormal.x * 4.0 + uTime * 0.35 + vSeed * 13.0) * 0.55;
    vec3 interference = 0.5 + 0.5 * cos(filmPhase + vec3(0.0, 2.1, 4.2));
    vec3 pearl = mix(vec3(0.53, 0.64, 0.86), vec3(0.98, 0.88, 0.65), n.y * 0.5 + 0.5);
    vec3 filmColor = mix(pearl, interference * 0.78 + 0.22, 0.28);
    vec3 color = filmColor * (0.72 + fresnel * 0.18)
      + vec3(0.24, 0.21, 0.15) * upperArc
      + vec3(0.12, 0.17, 0.24) * lowerArc;
    float alpha = 0.014 + fresnel * 0.34 + outerRim * 0.19
      + upperArc * 0.29 + lowerArc * 0.13;

    // Only this small specular point reaches the scene's bloom threshold.
    color += vec3(2.5, 2.35, 1.95) * glint;
    alpha += glint * 0.66;

    if (vBurst >= 0.0) {
      float progress = clamp(vBurst, 0.0, 1.0);
      float angle = vSeed * 19.7392088;
      vec3 puncture = normalize(vec3(cos(angle) * 0.7, sin(angle) * 0.7, 1.0));
      float distanceFromPuncture = dot(localNormal, puncture);

      // A cap retracts across the actual spherical surface. This reveals a
      // crescent of surviving film instead of inflating/fading a whole sphere.
      float boundary = 1.0 - 2.0 * pow(progress, 0.72);
      float raggedness = sin(localNormal.x * 27.0 + angle)
        * sin(localNormal.y * 23.0 - angle) * 0.018
        * sin(progress * 3.14159265);
      float cut = boundary + raggedness;
      if (distanceFromPuncture > cut) discard;

      float rimWidth = mix(0.055, 0.025, progress);
      float retractingRim = smoothstep(cut - rimWidth, cut, distanceFromPuncture);
      float breaks = 0.45 + 0.55 * smoothstep(-0.45, 0.65,
        sin(localNormal.x * 31.0 + localNormal.y * 19.0 + angle));
      retractingRim *= breaks * (1.0 - smoothstep(0.65, 1.0, progress));
      color = mix(color, vec3(1.0, 0.91, 0.72), retractingRim * 0.85);
      alpha += retractingRim * 0.62;
      alpha *= 1.0 - smoothstep(0.82, 1.0, progress);
    }

    alpha = clamp(alpha * uOpacity, 0.0, 0.92);
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

// Sphere geometry must supply InstancedBufferAttributes aBurst and aSeed.
// aBurst = -1 keeps the film intact; 0..1 advances the rupture; 1 hides it.
// The parent advances uniforms.uTime and uniforms.uOpacity without rerenders.
const BubbleShellMaterial = forwardRef(function BubbleShellMaterial(props, ref) {
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uOpacity: { value: 1 } }),
    [],
  );

  return (
    <shaderMaterial
      ref={ref}
      uniforms={uniforms}
      vertexShader={VERTEX_SHADER}
      fragmentShader={FRAGMENT_SHADER}
      transparent
      depthWrite={false}
      depthTest
      side={FrontSide}
      blending={NormalBlending}
      toneMapped={false}
      {...props}
    />
  );
});

export default BubbleShellMaterial;
