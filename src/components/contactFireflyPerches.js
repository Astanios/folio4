import * as THREE from "three";
import { SIGN_PLANK_HEIGHT } from "./contactSignLayout.js";

const cache = new WeakMap();
const plankCache = new WeakMap();
const trunkNames = new Map([
  ["treelowpoly2pCylinder2", "near"],
  ["treelowpoly2tree1", "far"],
  ["treelowpoly2tree1027", "stump"],
]);

// Sample the authored bark/branch triangles once, in exactly the normalized
// coordinates used by FloatingIslandBackgroundModel. No extra visible meshes.
export function getContactFireflyPerches(scene) {
  if (cache.has(scene)) return cache.get(scene);
  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(scene);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 1 / Math.max(size.x, size.y, size.z, 0.001);
  const normalize = new THREE.Matrix4().makeScale(scale, scale, scale)
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
  const faces = { near: [], far: [], stump: [] };
  const transform = new THREE.Matrix4();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const normal = new THREE.Vector3(), edge = new THREE.Vector3();

  scene.traverse((mesh) => {
    if (!mesh.isMesh) return;
    let tree;
    for (let parent = mesh; parent && !tree; parent = parent.parent) {
      tree = trunkNames.get(parent.name.replace(/[^a-zA-Z0-9]/g, ""));
    }
    if (!tree) return;
    const { position } = mesh.geometry.attributes;
    const indices = mesh.geometry.index;
    transform.multiplyMatrices(normalize, mesh.matrixWorld);
    const count = indices?.count ?? position.count;
    for (let i = 0; i < count; i += 3) {
      a.fromBufferAttribute(position, indices ? indices.getX(i) : i).applyMatrix4(transform);
      b.fromBufferAttribute(position, indices ? indices.getX(i + 1) : i + 1).applyMatrix4(transform);
      c.fromBufferAttribute(position, indices ? indices.getX(i + 2) : i + 2).applyMatrix4(transform);
      // Include the lower bark and the short neighboring stump, while keeping
      // every sampled surface above the island's ground and below the canopy.
      const ceiling = tree === "stump" ? 0.225 : 0.345;
      if (Math.min(a.y, b.y, c.y) < 0.18 || Math.max(a.y, b.y, c.y) > ceiling) continue;
      normal.subVectors(b, a).cross(edge.subVectors(c, a));
      const area = normal.length() * 0.5;
      if (area < 1e-10) continue;
      faces[tree].push({ a: a.clone(), b: b.clone(), c: c.clone(), normal: normal.clone().normalize(), area });
    }
  });

  let seed = 27183;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const perches = { near: [], far: [], stump: [] };
  for (const tree of Object.keys(perches)) {
    const totalArea = faces[tree].reduce((sum, face) => sum + face.area, 0);
    if (!totalArea) continue;
    for (let i = 0; i < 96; i++) {
      let choice = random() * totalArea;
      const face = faces[tree].find((candidate) => (choice -= candidate.area) <= 0) ?? faces[tree].at(-1);
      const u = Math.sqrt(random()), v = random();
      const point = face.a.clone().multiplyScalar(1 - u)
        .addScaledVector(face.b, u * (1 - v)).addScaledVector(face.c, u * v)
        .addScaledVector(face.normal, 0.003);
      perches[tree].push(point.toArray());
    }
  }
  cache.set(scene, perches);
  return perches;
}

// Sample the textured front of the actual plank, keeping the inscription area
// free. These points use the same transforms as the sign, in island space.
export function getContactSignFireflyPerches(geometry, layout, islandScale) {
  if (!layout) return [];
  if (!plankCache.has(geometry)) {
    const { position } = geometry.attributes;
    const indices = geometry.index;
    const bounds = new THREE.Box3().setFromBufferAttribute(position);
    const center = bounds.getCenter(new THREE.Vector3());
    const width = bounds.max.x - bounds.min.x;
    const faces = [];
    let area = 0;
    const edge = new THREE.Vector3();
    for (let i = 0, count = indices?.count ?? position.count; i < count; i += 3) {
      const vertices = [0, 1, 2].map((offset) => new THREE.Vector3()
        .fromBufferAttribute(position, indices ? indices.getX(i + offset) : i + offset)
        .sub(center).divideScalar(width));
      const [a, b, c] = vertices;
      const normal = b.clone().sub(a).cross(edge.subVectors(c, a));
      const faceArea = normal.length() * 0.5;
      if (faceArea < 1e-10 || normal.normalize().z < 0.35) continue;
      area += faceArea;
      faces.push({ a, b, c, normal, endArea: area });
    }
    plankCache.set(geometry, { faces, area });
  }
  const { faces, area } = plankCache.get(geometry);
  if (!faces.length) return [];
  const signTransform = new THREE.Matrix4().compose(
    new THREE.Vector3(...layout.position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...layout.rotation)),
    new THREE.Vector3().setScalar(1 / islandScale),
  );
  const perches = [];
  let seed = 83617;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (const board of layout.boards) {
    const boardTransform = new THREE.Matrix4().compose(
      new THREE.Vector3(...board.position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, board.tilt)),
      new THREE.Vector3(layout.width, layout.height / SIGN_PLANK_HEIGHT, layout.width),
    );
    const normalTransform = new THREE.Matrix3().getNormalMatrix(boardTransform);
    let sampled = 0;
    for (let attempt = 0; sampled < 48 && attempt < 768; attempt += 1) {
      const choice = random() * area;
      let low = 0, high = faces.length - 1;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (faces[middle].endArea < choice) low = middle + 1;
        else high = middle;
      }
      const face = faces[low];
      const u = Math.sqrt(random()), v = random();
      const point = face.a.clone().multiplyScalar(1 - u)
        .addScaledVector(face.b, u * (1 - v)).addScaledVector(face.c, u * v);
      if (Math.abs(point.x) < 0.42 && Math.abs(point.y) < SIGN_PLANK_HEIGHT * 0.32) continue;
      const normal = face.normal.clone().applyMatrix3(normalTransform).normalize();
      point.applyMatrix4(boardTransform).addScaledVector(normal, 0.045)
        .applyMatrix4(signTransform);
      perches.push(point.toArray());
      sampled += 1;
    }
  }
  return perches;
}
