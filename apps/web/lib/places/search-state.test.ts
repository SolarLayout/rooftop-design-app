import { describe, expect, test } from "bun:test";
import { afterKey, IDLE, searchStateAfter, type SearchState } from "./search-state";
import type { Place } from "./provider";

const PLACES: Place[] = [
  { label: "Hinjewadi Phase 2, Pune, Maharashtra", kind: "Locality", lon: 73.7124, lat: 18.5954 },
  { label: "Hinjewadi Phase 2 Rd, Hinjewadi, Pune", kind: "Street", lon: 73.7101, lat: 18.5921 },
  { label: "Phase 2, Rajiv Gandhi Infotech Park, Pune", kind: "Place", lon: 73.7059, lat: 18.5889 },
];

describe("the states of the search", () => {
  test("it begins idle", () => {
    expect(IDLE).toEqual({ kind: "idle" });
  });

  test("coordinates that cannot be read: refused, with why and the place they may mean; any search in flight is forgotten", () => {
    const searching = searchStateAfter(IDLE, { type: "asked", query: "Hinjewadi" });
    const offer = { lat: -33.856784, lon: 151.215297 };
    const refused = searchStateAfter(searching, { type: "refused", why: "Did you mean this?", offer });

    expect(refused).toEqual({ kind: "refused", why: "Did you mean this?", offer });
    expect(searchStateAfter(refused, { type: "found", query: "Hinjewadi", places: PLACES })).toBe(refused);
    expect(searchStateAfter(refused, { type: "closed" })).toEqual(IDLE);
  });

  test("words asked for: searching, with the words", () => {
    expect(searchStateAfter(IDLE, { type: "asked", query: "Hinjewadi Phase 2" })).toEqual({ kind: "searching", query: "Hinjewadi Phase 2" });
  });

  test("places found: the list, the first marked", () => {
    const searching = searchStateAfter(IDLE, { type: "asked", query: "Hinjewadi" });

    expect(searchStateAfter(searching, { type: "found", query: "Hinjewadi", places: PLACES })).toEqual({
      kind: "found",
      query: "Hinjewadi",
      places: PLACES,
      marked: 0,
    });
  });

  test("nothing found says so, with the words", () => {
    const searching = searchStateAfter(IDLE, { type: "asked", query: "xq9 street" });

    expect(searchStateAfter(searching, { type: "found", query: "xq9 street", places: [] })).toEqual({ kind: "nothing", query: "xq9 street" });
  });

  test("an answer to words that are no longer asked for is dropped", () => {
    const searching = searchStateAfter(IDLE, { type: "asked", query: "Pune" });

    expect(searchStateAfter(searching, { type: "found", query: "Mumbai", places: PLACES })).toBe(searching);
  });

  test("a search that failed says why", () => {
    const searching = searchStateAfter(IDLE, { type: "asked", query: "Pune" });

    expect(searchStateAfter(searching, { type: "failed", query: "Pune", message: "The search cannot be reached." })).toEqual({
      kind: "failed",
      query: "Pune",
      message: "The search cannot be reached.",
    });
  });

  test("closed: idle again, whatever it was", () => {
    const found: SearchState = { kind: "found", query: "Pune", places: PLACES, marked: 1 };

    expect(searchStateAfter(found, { type: "closed" })).toEqual(IDLE);
  });

  test("a place taken: idle again", () => {
    const found: SearchState = { kind: "found", query: "Pune", places: PLACES, marked: 1 };

    expect(searchStateAfter(found, { type: "taken" })).toEqual(IDLE);
  });
});

describe("the keyboard in the list", () => {
  const found: SearchState = { kind: "found", query: "Pune", places: PLACES, marked: 0 };

  test("the arrows mark the next and the one before, and stop at the ends", () => {
    expect(afterKey(found, "ArrowDown")).toEqual({ ...found, marked: 1 });
    expect(afterKey({ ...found, marked: 2 }, "ArrowDown")).toEqual({ ...found, marked: 2 });
    expect(afterKey({ ...found, marked: 2 }, "ArrowUp")).toEqual({ ...found, marked: 1 });
    expect(afterKey(found, "ArrowUp")).toEqual(found);
  });

  test("Home and End go to the first and the last", () => {
    expect(afterKey({ ...found, marked: 1 }, "Home")).toEqual({ ...found, marked: 0 });
    expect(afterKey(found, "End")).toEqual({ ...found, marked: 2 });
  });

  test("a key is an event of the search too", () => {
    expect(searchStateAfter(found, { type: "key", key: "End" })).toEqual({ ...found, marked: 2 });
  });

  test("another key, or no list, changes nothing", () => {
    expect(afterKey(found, "a")).toBe(found);
    expect(afterKey(IDLE, "ArrowDown")).toBe(IDLE);
  });
});
