import { describe, expect, test } from "bun:test";
import { seriesBarOf } from "./series-bar";

const AT_1500 = { n_min: 14, n_max: 29, upper_limit: "Voc limit" } as const;

describe("the series range bar (components.md, \"Series range bar\")", () => {
  test("the band of what fits takes the middle of the track, as the approved board draws 14 to 29", () => {
    const bar = seriesBarOf(AT_1500, 29);
    expect(bar.band).toEqual({ from: 0.28, to: 0.72 });
    expect(bar.ends.map((end) => [end.share, end.words])).toEqual([
      [0.28, "14 · MPPT minimum"],
      [0.72, "29 · Voc limit"],
    ]);
    expect(bar.fits).toBe("14 to 29 fit");
  });

  test("the marker stands at the chosen option's length, and its end is the brighter", () => {
    expect(seriesBarOf(AT_1500, 29).marker).toBeCloseTo(0.72);
    expect(seriesBarOf(AT_1500, 29).ends[1].isChosen).toBe(true);
    expect(seriesBarOf(AT_1500, 26).marker).toBeCloseTo(0.28 + (0.44 * 12) / 15);
    expect(seriesBarOf(AT_1500, 26).ends.some((end) => end.isChosen)).toBe(false);
  });

  test("before an option, and for a length outside the range, there is no marker", () => {
    expect(seriesBarOf(AT_1500, null).marker).toBeNull();
    expect(seriesBarOf(AT_1500, 35).marker).toBeNull();
  });

  test("the upper end says what sets it", () => {
    expect(seriesBarOf({ n_min: 14, n_max: 19, upper_limit: "MPPT max" }, 19).ends[1].words).toBe("19 · MPPT maximum");
  });

  test("when no length fits there is no band and no marker: the two ends as ticks, the smaller at the left", () => {
    const bar = seriesBarOf({ n_min: 14, n_max: 11, upper_limit: "Voc limit" }, null);
    expect(bar.band).toBeNull();
    expect(bar.marker).toBeNull();
    expect(bar.ends.map((end) => end.words)).toEqual(["11 · Voc limit", "14 · MPPT minimum"]);
    expect(bar.fits).toBe("None fit");
  });

  test("a range of one length is a band across the middle, its two ends apart", () => {
    const bar = seriesBarOf({ n_min: 20, n_max: 20, upper_limit: "Voc limit" }, 20);
    expect(bar.band).toEqual({ from: 0.28, to: 0.72 });
    expect(bar.ends.map((end) => end.share)).toEqual([0.28, 0.72]);
    expect(bar.marker).toBeCloseTo(0.72);
  });
});
