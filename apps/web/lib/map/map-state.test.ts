import { describe, expect, test } from "bun:test";
import { mapStateOf } from "./map-state";

describe("the state of the map", () => {
  test("with a key, WebGL and tiles that come, it is shown", () => {
    expect(mapStateOf({ hasKey: true, hasWebGL: true, tilesFailed: false })).toEqual({ kind: "ready" });
  });

  test("without a key it says so, and that the roof can be entered by its measurements", () => {
    expect(mapStateOf({ hasKey: false, hasWebGL: true, tilesFailed: false })).toEqual({
      kind: "no-key",
      title: "The map is not available",
      reason: "This app has no key for the imagery. The roof can still be entered by its measurements.",
    });
  });

  test("without WebGL it says so", () => {
    expect(mapStateOf({ hasKey: true, hasWebGL: false, tilesFailed: false })).toMatchObject({
      kind: "no-webgl",
      title: "This browser cannot draw the map",
    });
  });

  test("when the tiles do not come it says so", () => {
    expect(mapStateOf({ hasKey: true, hasWebGL: true, tilesFailed: true })).toMatchObject({
      kind: "offline",
      title: "The imagery does not load",
      reason: "Check the connection and try again, or enter the roof by its measurements.",
    });
  });

  test("the first thing in the way is the one said: no key before no WebGL", () => {
    expect(mapStateOf({ hasKey: false, hasWebGL: false, tilesFailed: true }).kind).toBe("no-key");
  });
});
