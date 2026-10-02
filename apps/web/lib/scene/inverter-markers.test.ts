import { describe, expect, test } from "bun:test";
import { INVERTER_BOX, inverterMarkersOf } from "./inverter-markers";

// The inverters on the roof (plan/phase-07-plan.md, step 14, decision 13; the board "Strings on the roof"): a small
// box at each place the engine gives, standing on the roof there, its chip over its top.

describe("the inverters' markers", () => {
  test("stand at the engine's places, on the roof, with the box's middle and its top", () => {
    const heightAt = ([x]: readonly [number, number]) => x / 10;
    const markers = inverterMarkersOf(
      [
        { label: "INV-1", position: [27.37, 1.0] },
        { label: "INV-2", position: [36.92, 39.0] },
      ],
      heightAt,
    );

    expect(markers).toEqual([
      { label: "INV-1", middle: [27.37, 1.0, 2.737 + INVERTER_BOX.height / 2], top: [27.37, 1.0, 2.737 + INVERTER_BOX.height] },
      { label: "INV-2", middle: [36.92, 39.0, 3.692 + INVERTER_BOX.height / 2], top: [36.92, 39.0, 3.692 + INVERTER_BOX.height] },
    ]);
  });

  test("a marker, not the inverter's size: 2 m along the edge, 1 m across, 1.2 m high, as the board draws it", () => {
    expect(INVERTER_BOX).toEqual({ east: 2, north: 1, height: 1.2 });
  });
});
