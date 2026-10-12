import { describe, expect, test } from "bun:test";
import { mapStateOf } from "./map-state";

describe("the state of the map", () => {
  test("with a key, WebGL and tiles that come, it is shown", () => {
    expect(mapStateOf({ hasKey: true, hasWebGL: true, tilesFailed: false })).toEqual({ kind: "ready" });
  });

  test("without a key it says so, and that the roof can be entered by hand", () => {
    expect(mapStateOf({ hasKey: false, hasWebGL: true, tilesFailed: false })).toEqual({
      kind: "no-key",
      title: "The map is not available",
      reason: "Enter the roof by hand instead.",
    });
  });

  test("without WebGL it says so", () => {
    expect(mapStateOf({ hasKey: true, hasWebGL: false, tilesFailed: false })).toMatchObject({
      kind: "no-webgl",
      title: "This browser cannot draw the map",
      reason: "Try another browser, or enter the roof by hand.",
    });
  });

  test("when the tiles do not come it says so", () => {
    expect(mapStateOf({ hasKey: true, hasWebGL: true, tilesFailed: true })).toMatchObject({
      kind: "offline",
      title: "The imagery does not load",
      reason: "Check your connection and try again, or enter the roof by hand.",
    });
  });

  test("the first thing in the way is the one said: no key before no WebGL", () => {
    expect(mapStateOf({ hasKey: false, hasWebGL: false, tilesFailed: true }).kind).toBe("no-key");
  });
});
