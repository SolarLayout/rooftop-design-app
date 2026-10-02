import { describe, expect, test } from "bun:test";
import { oncePerFrame } from "./pointer";

// The string under the pointer is read at most once a frame (plan/phase-07-plan.md, step 15): of the moves between
// two frames the last is taken, on the frame.

describe("once a frame", () => {
  function frames() {
    const waiting: Array<() => void> = [];
    return { schedule: (run: () => void) => void waiting.push(run), draw: () => waiting.splice(0).forEach((run) => run()), waiting };
  }

  test("of the moves between two frames, the last is taken on the frame, and once", () => {
    const { schedule, draw, waiting } = frames();
    const taken: Array<number | null> = [];
    const told = oncePerFrame<number | null>((value) => taken.push(value), schedule);

    told(3);
    told(4);
    told(5);
    expect(taken).toEqual([]);
    expect(waiting).toHaveLength(1);
    draw();
    expect(taken).toEqual([5]);

    told(null);
    draw();
    expect(taken).toEqual([5, null]);
  });

  test("nothing told, nothing taken", () => {
    const { draw } = frames();
    const taken: number[] = [];
    oncePerFrame<number>((value) => taken.push(value), () => undefined);
    draw();
    expect(taken).toEqual([]);
  });
});
