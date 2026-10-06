// Solve the projected X limits at a fixed local Y/Z. This also accounts for
// the camera's tilt and the scroll wrapper's world transform.
export function horizontalRange(result, clipMatrix, y, z, edge) {
  const m = clipMatrix.elements;
  const clipX = m[4] * y + m[8] * z + m[12];
  const clipW = m[7] * y + m[11] * z + m[15];
  if (clipW <= 0) return false;
  const left = (-edge * clipW - clipX) / (m[0] + edge * m[3]);
  const right = (edge * clipW - clipX) / (m[0] - edge * m[3]);
  result.set(Math.min(left, right), Math.max(left, right));
  return Number.isFinite(left) && Number.isFinite(right);
}

export function confinePhrase(group, text, camera, width, padding, scratch) {
  const bounds = text.geometry.boundingBox;
  if (!bounds || bounds.isEmpty()) return;
  const { clipMatrix, textMatrix, corner, safeRange } = scratch;
  group.parent.updateWorldMatrix(true, false);
  clipMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    .multiply(group.parent.matrixWorld);
  const edge = 1 - 2 * padding / width;
  // Check glyph corners after scale/rotation and drift. Only unusually narrow
  // viewports need to shrink the text; its reveal, float and fade stay intact.
  for (let attempt = 0; attempt < 3; attempt++) {
    group.updateMatrix();
    text.updateMatrix();
    textMatrix.multiplyMatrices(group.matrix, text.matrix);
    let left = -Infinity;
    let right = Infinity;
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        corner.set(x ? bounds.max.x : bounds.min.x, y ? bounds.max.y : bounds.min.y, 0)
          .applyMatrix4(textMatrix);
        if (horizontalRange(safeRange, clipMatrix, corner.y, corner.z, edge)) {
          const offsetX = corner.x - group.position.x;
          left = Math.max(left, safeRange.x - offsetX);
          right = Math.min(right, safeRange.y - offsetX);
        }
      }
    }
    if (left <= right) {
      group.position.x = Math.min(right, Math.max(left, group.position.x));
      return;
    }
    const textWidth = (bounds.max.x - bounds.min.x) * group.scale.x;
    group.scale.multiplyScalar(Math.max(0.1, 1 - (left - right) / Math.max(textWidth, 0.001) - 0.02));
  }
}
