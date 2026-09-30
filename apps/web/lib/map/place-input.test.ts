import { describe, expect, test } from "bun:test";
import { placeInputOf } from "./place-input";

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

  test("a latitude beyond 90 or a longitude beyond 180 is no place: it is searched for as words", () => {
    expect(placeInputOf("91, 73.86")).toEqual({ kind: "words", query: "91, 73.86" });
    expect(placeInputOf("18.52, 181")).toEqual({ kind: "words", query: "18.52, 181" });
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
  });

  test("nothing typed is nothing", () => {
    expect(placeInputOf("   ")).toEqual({ kind: "nothing" });
  });
});
