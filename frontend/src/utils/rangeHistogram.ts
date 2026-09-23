/**
 * Build normalized bucket heights (0–1) for histogram range sliders.
 */

export function buildRangeHistogram(
  values: number[],
  min: number,
  max: number,
  bucketCount = 48
): number[] {
  const buckets = new Array<number>(bucketCount).fill(0);
  const span = max - min;
  if (span <= 0 || bucketCount <= 0) {
    return buckets;
  }

  for (const value of values) {
    if (!Number.isFinite(value) || value < min || value > max) continue;
    const ratio = (value - min) / span;
    const index = Math.min(bucketCount - 1, Math.floor(ratio * bucketCount));
    buckets[index] += 1;
  }

  const peak = Math.max(...buckets, 1);
  return buckets.map(count => count / peak);
}
