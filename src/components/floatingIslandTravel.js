// Solve the left/right frustum planes in the island parent's coordinate space.
// Include the full island radius, so wrapping happens only after it clears view.
export function getIslandWrapBounds(matrix, y, z, radius, bounds) {
  const m = matrix.elements;
  const leftX = m[0] + m[3], leftY = m[4] + m[7], leftZ = m[8] + m[11];
  const rightX = m[3] - m[0], rightY = m[7] - m[4], rightZ = m[11] - m[8];
  if (Math.abs(leftX) < 0.00001 || Math.abs(rightX) < 0.00001) return false;
  const left = -(leftY * y + leftZ * z + m[12] + m[15]
    + radius * Math.hypot(leftX, leftY, leftZ)) / leftX;
  const right = -(rightY * y + rightZ * z + m[15] - m[12]
    + radius * Math.hypot(rightX, rightY, rightZ)) / rightX;
  const middle = (left + right) * 0.5;
  if (m[3] * middle + m[7] * y + m[11] * z + m[15] <= 0 || right <= left) return false;
  bounds.min = left;
  bounds.max = right;
  return true;
}

export function wrapIslandX(x, direction, min, max) {
  const width = max - min;
  if (width <= 0) return x;
  if (direction > 0 && x > max) return min + (x - max) % width;
  if (direction < 0 && x < min) return max - (min - x) % width;
  return x;
}
