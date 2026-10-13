import { describe, expect, test } from "bun:test";
import { PLACE_NAME_MOST, placeNameOf, placeNameOfBuild } from "./place-name";

// The design's place name (D114), set by Find when it builds a roof (issue 238): the place's own name, the first part of
// the label of a place found by words; empty for coordinates typed, a maps link, Use my location or a file.

const PUNE = { lat: 18.52, lon: 73.86, label: "Pune, Maharashtra, India", byWords: true };

describe("a place's own name", () => {
  test("the first part of the search's label, before its first comma", () => {
    expect(placeNameOf("Pune, Maharashtra, India")).toBe("Pune");
    expect(placeNameOf("Koregaon Park, Pune, Maharashtra, IND")).toBe("Koregaon Park");
  });

  test("a label of one part is the name; spaces round it go", () => {
    expect(placeNameOf("  Hinjewadi  ")).toBe("Hinjewadi");
  });

  test("at most 200 characters, as the project takes", () => {
    expect(PLACE_NAME_MOST).toBe(200);
    expect(Array.from(placeNameOf("é".repeat(250))).length).toBe(200);
  });
});

describe("the name a roof is built with", () => {
  test("a place found by words: its name", () => {
    expect(placeNameOfBuild(PUNE, null)).toBe("Pune");
  });

  test("coordinates typed, a maps link, Use my location: no name", () => {
    expect(placeNameOfBuild({ ...PUNE, label: "18.52000° N, 73.86000° E", byWords: false }, null)).toBe("");
    expect(placeNameOfBuild(null, null)).toBe("");
  });

  test("by hand, the name of the place found while the fields still hold it; another place typed there has none", () => {
    expect(placeNameOfBuild(PUNE, { lat: 18.52, lon: 73.86 })).toBe("Pune");
    expect(placeNameOfBuild(PUNE, { lat: 18.53681, lon: 73.89428 })).toBe("");
  });
});
