import * as THREE from "three";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Batch each platform separately, and share its geometry across every instance.
// The cached GLTF and its original geometry remain untouched.
const partsByScene = new WeakMap();

export function getFloatingIslandParts(scene, satelliteRoots) {
  const signature = satelliteRoots.join("|");
  const cached = partsByScene.get(scene);
  if (cached?.has(signature)) return cached.get(signature);

  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(scene);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 1 / Math.max(size.x, size.y, size.z, 0.001);
  const normalize = new THREE.Matrix4().makeScale(scale, scale, scale)
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
  const parts = [{ id: "main", position: [0, 0, 0], groups: new Map(), batchIndices: [] }];
  const roots = new Map();
  satelliteRoots.forEach((name, index) => {
    const root = scene.getObjectByName(name);
    if (!root) return;
    const pivot = new THREE.Box3().setFromObject(root).applyMatrix4(normalize)
      .getCenter(new THREE.Vector3());
    const part = { id: `satellite-${index + 1}`, position: pivot.toArray(), groups: new Map(), batchIndices: [] };
    parts.push(part);
    roots.set(root, part);
  });

  scene.traverse((mesh) => {
    if (!mesh.isMesh) return;
    let ancestor = mesh;
    while (ancestor && !roots.has(ancestor)) ancestor = ancestor.parent;
    const part = roots.get(ancestor) ?? parts[0];
    const geometry = mesh.geometry.clone();
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(normalize, mesh.matrixWorld));
    geometry.translate(-part.position[0], -part.position[1], -part.position[2]);
    const attributes = Object.entries(geometry.attributes)
      .map(([name, attribute]) => `${name}:${attribute.itemSize}:${attribute.normalized}:${attribute.array.constructor.name}`)
      .sort().join("|");
    const key = `${mesh.material.uuid}:${!!geometry.index}:${attributes}`;
    if (!part.groups.has(key)) part.groups.set(key, { material: mesh.material, geometries: [] });
    part.groups.get(key).geometries.push(geometry);
  });

  const batches = [];
  parts.forEach((part) => {
    part.groups.forEach(({ material, geometries }) => {
      const merged = mergeBufferGeometries(geometries);
      const output = merged ? [merged] : geometries;
      output.forEach((geometry) => {
        geometry.computeBoundingSphere();
        part.batchIndices.push(batches.length);
        batches.push({ geometry, material });
      });
      if (merged) geometries.forEach((geometry) => geometry.dispose());
    });
    delete part.groups;
  });

  const result = { parts, batches };
  const cache = cached ?? new Map();
  cache.set(signature, result);
  partsByScene.set(scene, cache);
  return result;
}
