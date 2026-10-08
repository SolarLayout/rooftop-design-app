// How far a clip has played (Phase 15): the share of the line at its foot, from 0 to 1.

/** Its time over its length; nothing while the length is not known yet. */
export function clipShareOf(time: number, length: number): number {
  if (!Number.isFinite(length) || length <= 0) return 0;
  return Math.min(1, Math.max(0, time / length));
}
