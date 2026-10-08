import { MathUtils } from "three";

// One motion sample drives both the visible insect and its surface light. Keep
// the original flight/rest curves, but evaluate this small flock once on CPU.
export function sampleContactFirefly(particles, index, elapsed, speed, positions, glow, landing) {
  const p = index * 3, s = index * 4;
  const { position, spread, seed, size, perch, restCycle } = particles;
  const time = elapsed * speed * seed[s + 2];
  const turn = time * 0.34 + seed[s];
  const bend = Math.sin(time * 0.46 + seed[s + 1]) * 0.42;
  const dart = (0.5 + 0.5 * Math.sin(time * 0.23 + seed[s + 1])) ** 8 * 0.004;
  const period = restCycle[s];
  const cycle = MathUtils.euclideanModulo(elapsed * speed + restCycle[s + 1], period);
  const landStart = period - restCycle[s + 2] - 2.2 - 1.8;
  const landed = MathUtils.smoothstep(cycle, landStart, landStart + 2.2)
    * (1 - MathUtils.smoothstep(cycle, period - 1.8, period)) * restCycle[s + 3];
  positions[p] = MathUtils.lerp(position[p] + Math.cos(turn + bend) * spread[p]
    + Math.sin(time * 3.4) * dart, perch[p], landed);
  positions[p + 1] = MathUtils.lerp(position[p + 1]
    + (Math.sin(time * 0.74 + seed[s + 1]) + Math.sin(time * 1.73 + seed[s]) * 0.24) * spread[p + 1]
    + Math.cos(time * 2.7) * dart, perch[p + 1], landed);
  positions[p + 2] = MathUtils.lerp(position[p + 2]
    + Math.sin(turn * 0.91 + seed[s + 1] * 0.25) * spread[p + 2]
    + Math.sin(time * 2.1) * dart, perch[p + 2], landed);
  const sizeVariation = 1 + 0.3 * Math.sin(elapsed * 0.55 + seed[s]);
  const sizeGlow = MathUtils.lerp(0.85, 1.2,
    MathUtils.clamp((size[index] * sizeVariation - 0.0098) / 0.0305, 0, 1));
  const pulse = 0.5 + 0.5 * Math.sin(elapsed * seed[s + 3] + seed[s + 1]);
  const restingGlow = 0.58 + 0.08 * Math.sin(elapsed * 0.9 + seed[s + 1]);
  glow[p] = MathUtils.lerp(0.25 + 0.75 * pulse * pulse, restingGlow, landed);
  glow[p + 1] = sizeVariation;
  glow[p + 2] = sizeGlow;
  landing[index] = landed;
}

// Keep a fixed number of Three lights. Change their insect assignments only
// after fading out, so a pool slot never visibly jumps between two locations.
export function advanceFireflyLight(slot, delta) {
  if (slot.index < 0 && slot.target < 0) { slot.weight = 0; return; }
  slot.weight = MathUtils.damp(slot.weight, slot.index === slot.target ? 1 : 0, 7, delta);
  if (slot.index !== slot.target && slot.weight < 0.015) {
    slot.weight = 0;
    slot.index = slot.target;
  }
}

export function assignFireflyLights(slots, scores, order) {
  // Small preference for current assignments avoids swapping at every pulse.
  for (const slot of slots) {
    if (slot.target >= 0 && scores[slot.target] > 0) scores[slot.target] *= 1.35;
  }
  order.sort((a, b) => scores[b] - scores[a]);
  const wanted = order.filter((index) => scores[index] > 0).slice(0, slots.length);
  for (const slot of slots) {
    const keep = wanted.indexOf(slot.target);
    if (keep >= 0) wanted.splice(keep, 1);
    else slot.target = -1;
  }
  for (const slot of slots) {
    if (slot.target === -1) slot.target = wanted.shift() ?? -1;
  }
}
