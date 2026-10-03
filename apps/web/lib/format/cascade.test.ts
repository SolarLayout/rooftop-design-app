import { describe, expect, test } from "bun:test";
import type { LossStep } from "../api";
import { cascadeOf, endsOf, isNothing, type Mark } from "./cascade";
import { STEPS, STEPS_REAR_OFF } from "../performance/test-fixtures";

// The track of the board (Performance.dc.html): 232 wide, 10 free at the left and 7 at the right.
const TRACK = 232;
const PAD_LEFT = 10;
const PAD_RIGHT = 7;
const px = (share: number) => Math.round(PAD_LEFT + share * (TRACK - PAD_LEFT - PAD_RIGHT));

const at = (marks: Mark[], label: string) => marks[STEPS.findIndex((step) => step.label === label)]!;
const bar = (mark: Mark) => {
  if (mark.kind !== "bar") throw new Error(`No bar: ${JSON.stringify(mark)}`);
  return mark;
};

describe("the running totals in percent of the GHI (plan/phase-08-plan.md, decision 10)", () => {
  const ends = endsOf(STEPS);

  test("one end for each step: the running total before it and after it", () => {
    expect(ends).toHaveLength(STEPS.length);
    expect(ends[0]).toEqual([100, 100]);
  });

  test("an irradiance step is its value against the GHI: the transposition a gain of 9.60 %", () => {
    const [before, after] = ends[1]!;

    expect(before).toBe(100);
    expect(after).toBeCloseTo(109.6, 1);
    expect(after - before).toBeCloseTo(9.6, 1);
  });

  test("the energy steps continue from where the irradiance ended, scaled by the array's nominal energy", () => {
    const afterTheRearGain = ends[6]![1];
    const nominal = ends[7]!;
    const irradianceLevel = ends[8]!;

    expect(nominal).toEqual([afterTheRearGain, afterTheRearGain]);
    expect(irradianceLevel[0]).toBe(afterTheRearGain);
    expect(irradianceLevel[1]).toBeCloseTo(afterTheRearGain * (703.007957862582 / 706.4017718286254), 9);
  });

  test("the grid's end is 5.1 % under the GHI", () => {
    const [, end] = ends[STEPS.length - 1]!;

    expect(100 - end).toBeCloseTo(5.1, 1);
  });

  test("a step of nothing changes nothing: the running total stays", () => {
    const [before, after] = ends[11]!;

    expect(STEPS[11]!.label).toBe("Module quality");
    expect(after).toBe(before);
  });
});

describe("the bars on one relative scale fitted to the run's extremes", () => {
  const marks = cascadeOf(STEPS);

  test("a mark for each step; a bar for a step, a marker for a total", () => {
    expect(marks).toHaveLength(STEPS.length);
    expect(marks.map((mark) => mark.kind)).toEqual(STEPS.map((step) => (step.kind === "irr" || step.kind === "energy" ? "bar" : "marker")));
  });

  test("the transposition's bar is where the board draws it: from 85 to 225 on the track of 232", () => {
    const transposition = bar(at(marks, "Transposition to plane (15°)"));

    expect(transposition.look).toBe("gain");
    expect(px(transposition.from)).toBe(85);
    expect(px(transposition.to)).toBe(225);
    expect(Math.round((transposition.to - transposition.from) * (TRACK - PAD_LEFT - PAD_RIGHT))).toBe(140);
  });

  test("the extremes are the ends of the scale: the highest after the transposition, the lowest the grid's end", () => {
    expect(bar(at(marks, "Transposition to plane (15°)")).to).toBe(1);
    expect(bar(at(marks, "Availability")).to).toBe(0);
    expect(at(marks, "Energy to grid")).toEqual({ kind: "marker", at: 0 });
  });

  test("a loss runs from the running total before to the one after, orange", () => {
    const iam = bar(at(marks, "IAM"));

    expect(iam.look).toBe("loss");
    expect(iam.from).toBeGreaterThan(iam.to);
    expect(iam.from).toBe(bar(at(marks, "Near shading, linear")).to);
  });

  test("a step of nothing is a tick of data-zero where the chain stands", () => {
    const quality = bar(at(marks, "Module quality"));

    expect(quality.look).toBe("zero");
    expect(quality.from).toBe(quality.to);
    expect(quality.from).toBe(bar(at(marks, "Electrical shading")).to);
  });

  test("a change under half a hundredth of a percent is nothing: the night consumption", () => {
    expect(isNothing(-0.0034)).toBe(true);
    expect(isNothing(0.005)).toBe(false);
    expect(isNothing(-0.0107)).toBe(false);
    expect(bar(at(marks, "Night consumption")).look).toBe("zero");
    expect(bar(at(marks, "Far shading, horizon")).look).toBe("loss");
  });

  test("the totals' markers stand at their running total", () => {
    expect(at(marks, "Global horizontal irradiation")).toEqual({ kind: "marker", at: bar(at(marks, "Transposition to plane (15°)")).from });
    expect(at(marks, "Array nominal energy at STC")).toEqual({ kind: "marker", at: bar(at(marks, "Bifacial rear gain")).to });
  });

  test("fitted to each run's own extremes: with the rear gain off the GHI's marker moves right", () => {
    const rearOff = cascadeOf(STEPS_REAR_OFF);

    expect(bar(rearOff[6]!).look).toBe("zero");
    expect((rearOff[0] as { at: number }).at).toBeGreaterThan((marks[0] as { at: number }).at);
    expect(bar(rearOff[1]!).to).toBe(1);
  });

  test("a chain of one total alone stands at the start of the track", () => {
    const alone: LossStep[] = [STEPS[0]!];

    expect(cascadeOf(alone)).toEqual([{ kind: "marker", at: 0 }]);
  });
});
