import { describe, expect, test } from "bun:test";
import { sizeOf, type Size } from "./use-size";

// The size of the screen, from the breakpoint tokens (plan/phase-05-plan.md, decision 9): the inspector is
// mounted once, in the container of the size; before the page is in a browser the size is not known.

const matching = (queries: readonly string[]) => (query: string) => ({ matches: queries.includes(query) }) as MediaQueryList;

describe("the size of the screen", () => {
  test("desktop from 1101, tablet from 640, phone below", () => {
    expect(sizeOf(matching(["(min-width: 1101px)", "(min-width: 640px)"]))).toBe<Size>("desktop");
    expect(sizeOf(matching(["(min-width: 640px)"]))).toBe<Size>("tablet");
    expect(sizeOf(matching([]))).toBe<Size>("phone");
  });
});
