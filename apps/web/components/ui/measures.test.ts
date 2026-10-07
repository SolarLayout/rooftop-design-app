import { describe, expect, test } from "bun:test";
import { measures } from "./measures";

/** The style as the variables it sets. */
const variables = (values: Parameters<typeof measures>[0]): Record<string, unknown> => ({ ...measures(values) });

describe("measures", () => {
  test("numbers of the data become variables that a utility reads", () => {
    expect(variables({ at: 0.286, span: 0.5 })).toEqual({ "--at": "0.286", "--span": "0.5" });
    expect(variables({ at: 0.22, down: 0.381 })).toEqual({ "--at": "0.22", "--down": "0.381" });
  });

  test("a number is written without the noise of the arithmetic", () => {
    expect(variables({ at: 1 / 3 })).toEqual({ "--at": "0.333333" });
    expect(variables({ at: 0.1 + 0.2 })).toEqual({ "--at": "0.3" });
  });

  test("a place on the screen is in pixels", () => {
    expect(variables({ x: 560, y: 364 })).toEqual({ "--x": "560px", "--y": "364px" });
    expect(variables({ x: -12.5 })).toEqual({ "--x": "-12.5px" });
  });

  test("a turn is in degrees, clockwise", () => {
    expect(variables({ turn: -46 })).toEqual({ "--turn": "-46deg" });
    expect(variables({ turn: 0 })).toEqual({ "--turn": "0deg" });
  });

  test("what is no number is refused: the style would be void", () => {
    expect(() => measures({ at: Number.NaN })).toThrow("at is no number");
    expect(() => measures({ span: Number.POSITIVE_INFINITY })).toThrow("span is no number");
  });
});
