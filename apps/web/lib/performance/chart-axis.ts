// The axes of Performance's charts (V2 · 8, audit V2-71; guidelines.md, "Charts"): about four steps of 1, 2 or 5 times a
// power of ten, the ends on a tick; from zero for bars, fitted to the values for a line, so that its fall is seen. Pure.

export type Axis = { low: number; high: number; ticks: number[] };

/** About this many steps between the ends. */
const STEPS = 4;

/** The round step at or above a raw one: 1, 2 or 5 times a power of ten. */
function roundStep(raw: number): number {
  const power = 10 ** Math.floor(Math.log10(raw));
  const nice = [1, 2, 5, 10].find((factor) => factor * power >= raw - 1e-9) ?? 10;
  return nice * power;
}

/** Ticks from low to high by step, free of the float's dust. */
function ticksOf(low: number, high: number, step: number): number[] {
  const count = Math.round((high - low) / step);
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  return Array.from({ length: count + 1 }, (_, index) => Number((low + index * step).toFixed(decimals)));
}

export function axisOf(values: readonly number[], { fromZero }: { fromZero: boolean }): Axis {
  const highest = values.length > 0 ? Math.max(...values) : 0;
  const lowest = fromZero ? 0 : values.length > 0 ? Math.min(...values) : 0;
  if (highest <= 0 && fromZero) return { low: 0, high: 1, ticks: [0, 1] };
  if (highest === lowest) {
    const step = roundStep(Math.abs(highest) / 10 || 1);
    return { low: highest - step, high: highest + step, ticks: ticksOf(highest - step, highest + step, step) };
  }
  const step = roundStep((highest - lowest) / STEPS);
  const low = fromZero ? 0 : Math.floor(lowest / step) * step;
  const high = Math.ceil(highest / step) * step;
  return { low, high, ticks: ticksOf(low, high, step) };
}
