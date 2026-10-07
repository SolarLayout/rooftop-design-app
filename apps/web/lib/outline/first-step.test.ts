import { describe, expect, test } from "bun:test";
import { placeInputOf } from "../places/place-input";
import { entryAfterPlace, EXAMPLES, firstStepOf } from "./first-step";

// Find's first step (D85): the ways to start, what the search understands, the three steps; without a map, by hand alone.

describe("the examples of what the search understands", () => {
  const read = (what: string) => placeInputOf(EXAMPLES.find((example) => example.what === what)?.text ?? "");

  test("an address is words, for the geocoder", () => {
    expect(read("Address").kind).toBe("words");
  });

  test("coordinates, degrees and a maps link are each read as the same place", () => {
    for (const what of ["Coordinates", "Degrees", "Maps link"]) {
      const input = read(what);
      if (input.kind !== "coordinates" && input.kind !== "link") throw new Error(`${what} is read as ${input.kind}`);
      expect(input.lat).toBeCloseTo(18.53621, 4);
      expect(input.lon).toBeCloseTo(73.8938, 4);
    }
  });

  test("a maps link is read from a link, and shown without its scheme", () => {
    const link = EXAMPLES.find((example) => example.what === "Maps link");
    expect(placeInputOf(link?.text ?? "").kind).toBe("link");
    expect(link?.shown.startsWith("http")).toBe(false);
  });

  test("every other example is shown as it is put into the search", () => {
    for (const example of EXAMPLES.filter((one) => one.what !== "Maps link")) expect(example.shown).toBe(example.text);
  });
});

describe("the panel of the first step", () => {
  test("with a map: search, my location and by hand, the examples, the steps of the map", () => {
    const step = firstStepOf(true);
    expect(step.ways.map(({ way }) => way)).toEqual(["search", "locate", "hand"]);
    expect(step.ways.map(({ title }) => title)).toEqual(["Search for the building", "Use my location", "Enter dimensions by hand"]);
    expect(step.examples).toBe(true);
    expect(step.steps.map(({ name }) => name)).toEqual(["Find", "Outline", "Build"]);
    expect(step.steps[0].words).toContain("map");
  });

  test("without a map: by hand alone, no examples, the steps in its words", () => {
    const step = firstStepOf(false);
    expect(step.ways.map(({ way }) => way)).toEqual(["hand"]);
    expect(step.ways[0].words).toContain("length");
    expect(step.examples).toBe(false);
    expect(step.lead).toContain("cannot be shown");
    expect(step.steps.map(({ name }) => name)).toEqual(["Find", "Outline", "Build"]);
    expect(step.steps.some(({ words }) => words.includes("map"))).toBe(false);
  });
});

describe("a place found", () => {
  test("with a map, the roof is outlined on it", () => {
    expect(entryAfterPlace(true)).toBe("map");
  });

  test("without a map, the roof is entered by hand at the place, never outlined on a map that is not there", () => {
    expect(entryAfterPlace(false)).toBe("hand");
  });
});
