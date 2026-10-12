import { describe, expect, test } from "bun:test";
import { placeInputOf } from "../places/place-input";
import { entryAfterPlace, EXAMPLES, WAYS } from "./first-step";

// Find's first step (V2 · 4, D98; before it D85): the search first, its examples in its list while it is empty, and the
// two other ways under it.

describe("the examples in the search's list", () => {
  const read = (what: string) => placeInputOf(EXAMPLES.find((example) => example.what === what)?.text ?? "");

  test("an address, coordinates and a maps link, as the board names them", () => {
    expect(EXAMPLES.map(({ what }) => what)).toEqual(["An address", "Coordinates", "A maps link"]);
  });

  test("an address is words, for the geocoder", () => {
    expect(read("An address").kind).toBe("words");
  });

  test("coordinates and a maps link are each read as the same place", () => {
    for (const what of ["Coordinates", "A maps link"]) {
      const input = read(what);
      if (input.kind !== "coordinates" && input.kind !== "link") throw new Error(`${what} is read as ${input.kind}`);
      expect(input.lat).toBeCloseTo(18.53621, 4);
      expect(input.lon).toBeCloseTo(73.8938, 4);
    }
  });

  test("a maps link is shown without its scheme; the others as they are put into the search", () => {
    const link = EXAMPLES.find((example) => example.what === "A maps link");
    expect(placeInputOf(link?.text ?? "").kind).toBe("link");
    expect(link?.shown.startsWith("http")).toBe(false);
    for (const example of EXAMPLES.filter((one) => one !== link)) expect(example.shown).toBe(example.text);
  });
});

describe("the two other ways, under the search", () => {
  test("my location, and the roof by hand, each with what it is for", () => {
    expect(WAYS).toEqual([
      { way: "locate", title: "Use my location", words: "When you are at the building" },
      { way: "hand", title: "Enter the roof by hand", words: "Type its length and width" },
    ]);
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
