import { describe, expect, test } from "bun:test";
import { measures } from "./measures";

/** The style as the variables it sets. */
const variables = (values: Parameters<typeof measures>[0]): Record<string, unknown> => ({ ...measures(values) });

describe("measures", () => {
  test("numbers of the data become variables that a utility reads", () => {
    expect(variables({ at: 0.286, span: 0.5 })).toEqual({ "--at": "0.286", "--span": "0.5" });
  });

  test("a number is written without the noise of the arithmetic", () => {
    expect(variables({ at: 1 / 3 })).toEqual({ "--at": "0.333333" });
    expect(variables({ at: 0.1 + 0.2 })).toEqual({ "--at": "0.3" });
  });

  test("what is no number is refused: the style would be void", () => {
    expect(() => measures({ at: Number.NaN })).toThrow("at is no number");
    expect(() => measures({ span: Number.POSITIVE_INFINITY })).toThrow("span is no number");
  });
});
