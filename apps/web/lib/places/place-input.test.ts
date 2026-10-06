import { describe, expect, test } from "bun:test";
import { isAPlace, placeInputOf } from "./place-input";

describe("coordinates", () => {
  test.each([
    ["18.52000, 73.86000", 18.52, 73.86],
    ["18.52 73.86", 18.52, 73.86],
    ["18.52;73.86", 18.52, 73.86],
    ["18.52000° N, 73.86000° E", 18.52, 73.86],
    ["18.52N 73.86E", 18.52, 73.86],
    ["73.86E 18.52N", 18.52, 73.86],
    ["73.86° E, 18.52° N", 18.52, 73.86],
    ["33.87 S, 151.21 E", -33.87, 151.21],
    ["-33.87, 151.21", -33.87, 151.21],
    ["40.7128, -74.0060", 40.7128, -74.006],
    ["40.7128 N 74.0060 W", 40.7128, -74.006],
    ["  18.52 ,  73.86  ", 18.52, 73.86],
  ])("%s is the place %s, %s", (typed, lat, lon) => {
    expect(placeInputOf(typed)).toEqual({ kind: "coordinates", lat, lon });
  });

});

// The board "UI fixes · Coordinates in the search", "What is read": each form is the same place.
describe("coordinates as Google Earth, a GPS and people write them", () => {
  const PLACE = { kind: "coordinates", lat: 12.914094, lon: 77.491989 };
  test.each([
    [`12°54'50.74"N 77°29'31.16"E`],
    ["12°54′50.74″N, 77°29′31.16″E"],
    ["12°54’50.74”N 77°29’31.16”E"],
    [`12°54'50.74''N 77°29'31.16''E`],
    ["12º54'50.74\"N 77º29'31.16\"E"],
    [`N 12°54'50.74" E 77°29'31.16"`],
    ["12 54 50.74 N 77 29 31.16 E"],
    ["12°54.8456'N 77°29.5193'E"],
    [`77°29'31.16"E 12°54'50.74"N`],
    [`12°54'50.74" 77°29'31.16"`],
    ["12 54 50.74 77 29 31.16"],
    ["12.914094N 77.491989E"],
    ["12,914094 77,491989"],
    ["12,914094; 77,491989"],
    [`12°54'50.74"n 77°29'31.16"e`],
  ])("%s is 12.91409° N, 77.49199° E", (typed) => {
    const input = placeInputOf(typed);
    expect(input.kind).toBe("coordinates");
    if (input.kind !== "coordinates") return;
    expect(input.lat).toBeCloseTo(PLACE.lat, 5);
    expect(input.lon).toBeCloseTo(PLACE.lon, 5);
  });

  test("south and west by their letters, or by a minus written in any of its forms", () => {
    expect(placeInputOf(`33°51'24.42"S 151°12'55.07"E`)).toMatchObject({ kind: "coordinates" });
    const south = placeInputOf(`33°51'24.42"S 151°12'55.07"E`);
    if (south.kind === "coordinates") expect(south.lat).toBeCloseTo(-33.856783, 5);
    const west = placeInputOf("−40.7128, −74.0060");
    expect(west).toEqual({ kind: "coordinates", lat: -40.7128, lon: -74.006 });
    expect(placeInputOf("-33.87 S, 151.21 E")).toEqual({ kind: "coordinates", lat: -33.87, lon: 151.21 });
  });
});

// The board, "When it cannot be read": what looks like coordinates is never searched for as words.
describe("what looks like coordinates but cannot be read says why", () => {
  test.each([
    [`12°54'65"N 77°29'31"E`, "Minutes and seconds go up to 59. The latitude has 65″: check where it was copied from."],
    [`12°75'10"N 77°29'31"E`, "Minutes and seconds go up to 59. The latitude has 75′: check where it was copied from."],
    [`12°54'10"N 77°29'60"E`, "Minutes and seconds go up to 59. The longitude has 60″: check where it was copied from."],
    [`95°10'00"N 77°29'31"E`, "A latitude goes up to 90°, and this one is 95.16667°. Check where it was copied from."],
    ["95, 200", "A latitude goes up to 90°, and this one is 95°. Check where it was copied from."],
    ["12.5, 181", "A longitude goes up to 180°, and this one is 181°. Check where it was copied from."],
    [`12°54'50"N 77°29'31"N`, "Both are marked N. The latitude takes N or S, the longitude E or W."],
    ["12.5E 77.5W", "Both are marked E or W. The latitude takes N or S, the longitude E or W."],
    [`12°54'50.74"N`, "Only the latitude is here. Add the longitude after it: 12°54′50.74″N 77°29′31.16″E."],
    ["12.914094", "Only the latitude is here. Add the longitude after it: 12°54′50.74″N 77°29′31.16″E."],
    [`77°29'31.16"E`, "Only the longitude is here. Add the latitude before it: 12°54′50.74″N 77°29′31.16″E."],
    ["-12.914094N 77.491989E", "−12.91409 is marked N, and a minus means south. Keep the minus or the letter, not both."],
    ["12.914094N -77.491989E", "−77.49199 is marked E, and a minus means west. Keep the minus or the letter, not both."],
    [
      `12°54'50.74"N 77°29"31'E`,
      "These look like coordinates, but the longitude cannot be read. Write them as 12°54′50.74″N 77°29′31.16″E, or 12.91409, 77.49199.",
    ],
    [
      `12°54"50'N 77°29'31.16"E`,
      "These look like coordinates, but the latitude cannot be read. Write them as 12°54′50.74″N 77°29′31.16″E, or 12.91409, 77.49199.",
    ],
    [
      "12.5, 77.5, 3.2",
      "These look like coordinates, but they cannot be read. Write them as 12°54′50.74″N 77°29′31.16″E, or 12.91409, 77.49199.",
    ],
  ])("%s", (typed, why) => {
    expect(placeInputOf(typed)).toEqual({ kind: "unreadable", why, offer: null });
  });

  test("the longitude first without letters: the place it may mean is offered, never taken", () => {
    expect(placeInputOf("151.215297, -33.856784")).toEqual({
      kind: "unreadable",
      why: "The latitude comes first, and 151.21530 is more than 90°. Did you mean this?",
      offer: { lat: -33.856784, lon: 151.215297 },
    });
  });
});

describe("a maps link", () => {
  test.each([
    ["https://www.google.com/maps/@18.5204,73.8567,19z", 18.5204, 73.8567],
    ["https://www.google.com/maps/place/Pune/@18.5204,73.8567,17.5z/data=!3m1", 18.5204, 73.8567],
    ["https://maps.google.com/?q=18.5204,73.8567", 18.5204, 73.8567],
    ["https://www.google.com/maps/search/?api=1&query=18.5204%2C73.8567", 18.5204, 73.8567],
    ["https://www.openstreetmap.org/#map=19/18.5204/73.8567", 18.5204, 73.8567],
    ["https://www.openstreetmap.org/?mlat=18.5204&mlon=73.8567#map=19/18.5204/73.8567", 18.5204, 73.8567],
    ["https://maps.apple.com/?ll=18.5204,73.8567&z=19", 18.5204, 73.8567],
    ["https://www.bing.com/maps?cp=18.5204~73.8567&lvl=19", 18.5204, 73.8567],
  ])("%s holds the place", (typed, lat, lon) => {
    expect(placeInputOf(typed)).toEqual({ kind: "link", lat, lon });
  });

  test("a link without coordinates is searched for as words", () => {
    expect(placeInputOf("https://maps.app.goo.gl/AbCdEf")).toEqual({ kind: "words", query: "https://maps.app.goo.gl/AbCdEf" });
  });

  test("an @ in words is not a link", () => {
    expect(placeInputOf("cafe @18.52,73.86")).toEqual({ kind: "words", query: "cafe @18.52,73.86" });
  });
});

describe("words and nothing", () => {
  test("words are for the geocoder, trimmed", () => {
    expect(placeInputOf("  Hinjewadi Phase 2  ")).toEqual({ kind: "words", query: "Hinjewadi Phase 2" });
  });

  test("an address with numbers in it is words", () => {
    expect(placeInputOf("12 MG Road, Pune 411001")).toEqual({ kind: "words", query: "12 MG Road, Pune 411001" });
    expect(placeInputOf("130, 5th Cross, Vijayshreee Layout")).toEqual({ kind: "words", query: "130, 5th Cross, Vijayshreee Layout" });
  });

  test("whole numbers with spaces alone between them are words, as a postcode is; with a comma they are coordinates", () => {
    expect(placeInputOf("411001")).toEqual({ kind: "words", query: "411001" });
    expect(placeInputOf("560 076")).toEqual({ kind: "words", query: "560 076" });
    expect(placeInputOf("18, 73")).toEqual({ kind: "coordinates", lat: 18, lon: 73 });
  });

  test("words that are made of the letters of the compass are still words", () => {
    expect(placeInputOf("news 24")).toEqual({ kind: "words", query: "news 24" });
  });

  test("nothing typed is nothing", () => {
    expect(placeInputOf("   ")).toEqual({ kind: "nothing" });
  });
});

describe("a place to go to as it stands", () => {
  test("coordinates and a maps link are; words, nothing and what cannot be read are not", () => {
    expect(isAPlace(placeInputOf("12.914094, 77.491989"))).toBe(true);
    expect(isAPlace(placeInputOf("https://www.google.com/maps/@18.5204,73.8567,19z"))).toBe(true);
    expect(isAPlace(placeInputOf("MG Road"))).toBe(false);
    expect(isAPlace(placeInputOf(""))).toBe(false);
    expect(isAPlace(placeInputOf("95, 200"))).toBe(false);
  });
});
