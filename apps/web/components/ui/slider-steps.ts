// The numbers of a slider: where a value is on the track, which value is at a position of the pointer,
// where a key leads, and how far a handle of a range may go (Slider, RangeSlider).

export type Scale = {
  min: number;
  max: number;
  /** What one step changes. Every value is a whole number of steps from the lowest, or the highest itself. */
  step: number;
  /** What Page Up and Page Down change; without it, a tenth of the scale in whole steps. */
  page?: number;
};

/** How far a handle may go. One handle has the whole scale; the handles of a range stop before each other. */
export type Limits = { min: number; max: number };

const NEARLY = 1e-9;

const decimalsOf = (value: number) => (String(value).split(".")[1] ?? "").length;

/** Without the noise of the arithmetic: 0.7, not 0.7000000000000001. */
function exact(value: number, scale: Scale): number {
  const decimals = Math.min(6, Math.max(decimalsOf(scale.step), decimalsOf(scale.min), decimalsOf(scale.max)));
  const result = Number(value.toFixed(decimals));
  return Object.is(result, -0) ? 0 : result;
}

const within = (value: number, limits: Limits) => Math.min(limits.max, Math.max(limits.min, value));

/** How many steps a value is from the lowest; a whole number when it is on a step. */
function stepsOf(value: number, scale: Scale): number {
  const steps = (value - scale.min) / scale.step;
  const whole = Math.round(steps);
  return Math.abs(steps - whole) < NEARLY ? whole : steps;
}

/** Where a value is on the track: 0 at the lowest, 1 at the highest. */
export function shareOf(value: number, scale: Scale): number {
  if (scale.max <= scale.min) return 0;
  return (within(value, scale) - scale.min) / (scale.max - scale.min);
}

/** Where the pointer is on a track that begins at `left` and is `width` wide: 0 at its start, 1 at its end. */
export function shareAt(pointer: number, left: number, width: number): number {
  if (width <= 0) return 0;
  return Math.min(1, Math.max(0, (pointer - left) / width));
}

/** The value at a position of the pointer, which is a share of the track: the nearest step inside the limits. */
export function valueAt(share: number, scale: Scale, limits: Limits = scale): number {
  const pointed = within(scale.min + share * (scale.max - scale.min), limits);
  const onAStep = within(scale.min + Math.round(stepsOf(pointed, scale)) * scale.step, limits);
  // An end that is no whole step from the lowest can be reached as well.
  const nearest = [onAStep, limits.min, limits.max].reduce((best, candidate) =>
    Math.abs(candidate - pointed) < Math.abs(best - pointed) ? candidate : best,
  );
  return exact(nearest, scale);
}

function pageOf(scale: Scale): number {
  if (scale.page !== undefined) return scale.page;
  const tenth = Math.round((scale.max - scale.min) / 10 / scale.step) * scale.step;
  return Math.max(scale.step, tenth);
}

/** The value a key leads to, or null when the key is none of the slider. */
export function valueAfterKey(value: number, key: string, scale: Scale, limits: Limits = scale): number | null {
  const steps = stepsOf(value, scale);
  const to = (() => {
    switch (key) {
      case "ArrowRight":
      case "ArrowUp":
        return scale.min + (Math.floor(steps) + 1) * scale.step;
      case "ArrowLeft":
      case "ArrowDown":
        return scale.min + (Math.ceil(steps) - 1) * scale.step;
      case "PageUp":
        return value + pageOf(scale);
      case "PageDown":
        return value - pageOf(scale);
      case "Home":
        return limits.min;
      case "End":
        return limits.max;
      default:
        return null;
    }
  })();
  return to === null ? null : exact(within(to, limits), scale);
}

/** How far the handle at `index` may go: `apart` is what stays between two handles at least. */
export function limitsOf(values: readonly number[], index: number, scale: Scale, apart: number): Limits {
  const before = values[index - 1];
  const after = values[index + 1];
  return {
    min: before === undefined ? scale.min : exact(before + apart, scale),
    max: after === undefined ? scale.max : exact(after - apart, scale),
  };
}

/** The values after the handle at `index` was sent to `to`. It never passes its neighbour. */
export function moved(values: readonly number[], index: number, to: number, scale: Scale, apart: number): number[] {
  const next = exact(within(to, limitsOf(values, index, scale, apart)), scale);
  return values.map((value, at) => (at === index ? next : value));
}

/**
 * The handle that a press on the track moves: the nearest. Of two that are as near, the lower; the
 * higher when both are below the press, because the lower could not go there.
 */
export function nearestHandle(values: readonly number[], pressed: number): number {
  const distances = values.map((value) => Math.abs(value - pressed));
  const least = Math.min(...distances);
  const asNear = distances.flatMap((distance, index) => (distance - least < NEARLY ? [index] : []));
  const last = asNear[asNear.length - 1] ?? 0;
  return pressed > (values[last] ?? pressed) ? last : (asNear[0] ?? 0);
}
