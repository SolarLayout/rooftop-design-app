import { describe, expect, test } from "bun:test";
import { bearingOf, dateOf, readOutOf } from "./sun-time";

describe("the date of a day of the year", () => {
  test.each([
    [1, "1 Jan", "1 January"],
    [80, "21 Mar", "21 March"],
    [172, "21 Jun", "21 June"],
    [355, "21 Dec", "21 December"],
    [365, "31 Dec", "31 December"],
  ])("day %d is %s", (day, short, long) => {
    expect(dateOf(day)).toEqual({ short, long });
  });

  test("day 366 is the last of the year too: solar time knows no leap year", () => {
    expect(dateOf(366).short).toBe("31 Dec");
  });
});

describe("the bearing of the sun", () => {
  test.each([
    [236.642, "56.6° W of south"],
    [151.498, "28.5° E of south"],
    [180, "due south"],
    [0, "due north"],
    [20, "20.0° E of north"],
    [340, "20.0° W of north"],
    [90, "due east"],
    [270, "due west"],
  ])("%d° from north is %s", (azimuthDeg, words) => {
    expect(bearingOf(azimuthDeg)).toBe(words);
  });
});

describe("the read-out of the time", () => {
  test("says the day, the time, the sun's height and its bearing", () => {
    expect(readOutOf(355, 16, { elevationDeg: 17.972, azimuthDeg: 236.642 })).toBe("21 Dec, 16:00 solar time, sun 18.0° high, 56.6° W of south");
  });

  test("says when the sun is down", () => {
    expect(readOutOf(355, 6, { elevationDeg: -5.5, azimuthDeg: 113 })).toBe("21 Dec, 06:00 solar time, the sun is down");
    expect(readOutOf(355, 6, null)).toBe("21 Dec, 06:00 solar time, the sun is down");
  });
});
