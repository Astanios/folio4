import * as THREE from "three";

const randomBetween = (min, max) => min + Math.random() * (max - min);

// Subdivide with progressively smaller, uneven bends instead of repeating a
// sinusoid. The first and last point stay anchored to the rim and screen edge.
function jaggedPath(start, end, levels, displacement) {
  let points = [start, end];
  for (let level = 0; level < levels; level++) {
    const next = [points[0]];
    for (let index = 1; index < points.length; index++) {
      const a = points[index - 1];
      const b = points[index];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.max(Math.hypot(dx, dy), 0.001);
      const bend = randomBetween(-1, 1) * displacement;
      const middle = a.clone().lerp(b, randomBetween(0.38, 0.62));
      middle.x += -dy / length * bend;
      middle.y += dx / length * bend;
      next.push(middle, b);
    }
    points = next;
    displacement *= 0.52;
  }
  return points;
}

function screenEdge(start, direction, halfWidth, halfHeight) {
  const xDistance = Math.abs(direction.x) > 0.001
    ? ((direction.x > 0 ? halfWidth : -halfWidth) - start.x) / direction.x : Infinity;
  const yDistance = Math.abs(direction.y) > 0.001
    ? ((direction.y > 0 ? halfHeight : -halfHeight) - start.y) / direction.y : Infinity;
  const distance = Math.max(30, Math.min(xDistance, yDistance));
  return start.clone().add(new THREE.Vector3(direction.x * distance, direction.y * distance, 0));
}

export function createPortalLightning({ camera, matrixWorld, width, height, centerY, viewport, focused }) {
  const halfWidth = viewport.width * 0.5;
  const halfHeight = viewport.height * 0.5;
  const inverse = matrixWorld.clone().invert();
  const project = (point) => {
    const ndc = point.clone().applyMatrix4(matrixWorld).project(camera);
    return new THREE.Vector3(ndc.x * halfWidth, ndc.y * halfHeight, ndc.z);
  };
  const unproject = (point) => new THREE.Vector3(point.x / halfWidth, point.y / halfHeight, point.z)
    .unproject(camera).applyMatrix4(inverse);
  const center = project(new THREE.Vector3(0, centerY, 0.085));
  const segments = [];
  const tips = [];
  const boltCount = 1 + Math.floor(Math.random() * 4);
  let flashAngle = 0;
  let lightPosition;

  const addPath = (points, strength, taper) => {
    const local = points.map(unproject);
    for (let index = 1; index < local.length; index++) {
      segments.push({ start: local[index - 1], end: local[index],
        startStrength: strength * (1 - taper * (index - 1) / (local.length - 1)),
        endStrength: strength * (1 - taper * index / (local.length - 1)) });
    }
  };

  for (let bolt = 0; bolt < boltCount; bolt++) {
    const angle = Math.random() * Math.PI * 2;
    const startLocal = new THREE.Vector3(Math.cos(angle) * width * 0.455,
      Math.sin(angle) * height * 0.455 + centerY, 0.085);
    const start = project(startLocal);
    if (bolt === 0) { flashAngle = angle; lightPosition = startLocal; }
    const directionAngle = Math.atan2(start.y - center.y, start.x - center.x) + randomBetween(-0.45, 0.45);
    const direction = new THREE.Vector2(Math.cos(directionAngle), Math.sin(directionAngle));
    const end = focused ? screenEdge(start, direction, halfWidth * 1.08, halfHeight * 1.08)
      : project(startLocal.clone().sub(new THREE.Vector3(0, centerY, 0))
        .multiplyScalar(randomBetween(1.7, 3.1)).add(new THREE.Vector3(0, centerY, 0)));
    const length = start.distanceTo(end);
    const path = jaggedPath(start, end, focused ? 5 : 4, length * randomBetween(0.10, 0.21));
    addPath(path, randomBetween(0.8, 1.2), 0.25);
    tips.push(unproject(end));

    const branchCount = 2 + Math.floor(Math.random() * 6);
    for (let branch = 0; branch < branchCount; branch++) {
      const index = 2 + Math.floor(Math.random() * (path.length - 4));
      const fork = path[index];
      const tangent = path[index + 1].clone().sub(path[index - 1]);
      const branchAngle = Math.atan2(tangent.y, tangent.x)
        + (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.45, 1.25);
      const reach = length * randomBetween(0.12, 0.42);
      const branchEnd = fork.clone().add(new THREE.Vector3(
        Math.cos(branchAngle) * reach, Math.sin(branchAngle) * reach, 0));
      const branchPath = jaggedPath(fork, branchEnd, 3, reach * 0.20);
      addPath(branchPath, randomBetween(0.3, 0.65), 0.75);
      if (Math.random() < 0.45) {
        const split = branchPath[3];
        const splitAngle = branchAngle + randomBetween(-1.1, 1.1);
        const splitEnd = split.clone().add(new THREE.Vector3(
          Math.cos(splitAngle) * reach * 0.5, Math.sin(splitAngle) * reach * 0.5, 0));
        addPath(jaggedPath(split, splitEnd, 2, reach * 0.07), 0.28, 0.85);
      }
    }
  }
  return { segments, tips, boltCount, flashAngle, lightPosition };
}
