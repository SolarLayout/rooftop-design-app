// The series range bar (docs/design/components.md, "Series range bar"; the boards "Studio, Strings lens" and
// "Options and your own"): where the band of the lengths that fit, the ends and the chosen length stand on the
// track, as shares of its width from 0 to 1. Pure; the component draws what it gives.
import type { SeriesRange } from "../api";

/** The band of what fits takes the middle of the track, as the approved board draws 14 to 29. */
const LOW_END = 0.28;
const HIGH_END = 0.72;

export type BarEnd = {
  share: number;
  /** "14 · MPPT minimum", "29 · Voc limit". */
  words: string;
  /** The end the chosen length stands at: its words are brighter. */
  isChosen: boolean;
};

export type SeriesBar = {
  /** The lengths that fit as a band; null when none fits. */
  band: { from: number; to: number } | null;
  /** The chosen option's length; null before an option, or when none fits. */
  marker: number | null;
  ends: [BarEnd, BarEnd];
  /** The words at the right of the section's head: "14 to 29 fit", "None fit". */
  fits: string;
};

const UPPER_WORDS: Record<SeriesRange["upper_limit"], string> = { "Voc limit": "Voc limit", "MPPT max": "MPPT maximum" };

/** The bar of a range, with the length of the chosen option when there is one (plan/phase-07-plan.md, decision 5). */
export function seriesBarOf(range: Pick<SeriesRange, "n_min" | "n_max" | "upper_limit">, chosen: number | null): SeriesBar {
  const { n_min: low, n_max: high, upper_limit: upper } = range;
  const lower = `${low} · MPPT minimum`;
  const higher = `${high} · ${UPPER_WORDS[upper]}`;
  if (high < low) {
    // Nothing fits: the two ends as ticks, the smaller at the left.
    return { band: null, marker: null, ends: [{ share: LOW_END, words: higher, isChosen: false }, { share: HIGH_END, words: lower, isChosen: false }], fits: "None fit" };
  }
  // A range of one length still spans the middle, so that its two ends can be read apart.
  const shareOf = (n: number) => (high === low ? HIGH_END : LOW_END + ((HIGH_END - LOW_END) * (n - low)) / (high - low));
  const marker = chosen === null || chosen < low || chosen > high ? null : shareOf(chosen);
  return {
    band: { from: LOW_END, to: HIGH_END },
    marker,
    ends: [
      { share: LOW_END, words: lower, isChosen: chosen === low && high !== low },
      { share: HIGH_END, words: higher, isChosen: chosen === high },
    ],
    fits: `${low} to ${high} fit`,
  };
}
