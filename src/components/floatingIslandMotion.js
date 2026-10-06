// Amplitudes use normalized model units; rotation amplitudes use radians.
// Override any field through satelliteMotion / focusedSatelliteMotion props.
export const FLOATING_ISLAND_MOTION = {
  drift: {
    mode: "drift", speed: 0.65,
    amplitude: [0.055, 0.075, 0.045], rotation: [0.06, 0.14, 0.08], phase: 0,
  },
  levitate: {
    mode: "levitate", speed: 0.8,
    amplitude: [0, 0.012, 0], rotation: [0, 0, 0], phase: 0,
  },
};

const STILL = { mode: "levitate", speed: 0, amplitude: [0, 0, 0], rotation: [0, 0, 0], phase: 0 };

export function resolveIslandMotion(settings, defaultMode = "drift") {
  if (settings === false) return STILL;
  const mode = settings?.mode ?? defaultMode;
  return { ...FLOATING_ISLAND_MOTION[mode], ...settings, mode };
}

// Write into reusable vectors so the render loop allocates no objects.
export function sampleIslandMotion(time, phase, settings, position, rotation) {
  const p = phase + settings.phase;
  const { amplitude, rotation: tilt } = settings;
  position.set(0, Math.sin(time + p) * amplitude[1], 0);
  rotation.set(0, 0, 0);
  if (settings.mode === "levitate") return;
  position.x = (Math.sin(time * 0.71 + p) * 0.7 + Math.sin(time * 1.19 + p * 1.7) * 0.3) * amplitude[0];
  position.z = (Math.cos(time * 0.63 + p * 0.9) * 0.7 + Math.sin(time * 1.11 + p) * 0.3) * amplitude[2];
  rotation.set(Math.sin(time * 0.57 + p) * tilt[0],
    Math.sin(time * 0.43 + p * 1.3) * tilt[1], Math.cos(time * 0.61 + p) * tilt[2]);
}
