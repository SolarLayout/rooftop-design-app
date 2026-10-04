import { describe, expect, test } from "bun:test";
import { bearingOf, dateOf, dayOfChoice, sunAtOf, sunCalloutOf, sunLineOf, sunPathLineOf, dayOfYearOf, daysOf, designDayLineOf, heldHourOf, partsOf, readOutOf, ticksOf, timeOfKey } from "./sun-time";

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

const PUNE_DEC = { from: 6.75, to: 17.25, sky: "rises and sets" } as const;
const SUN_DEC = { sunriseH: 6.557, sunsetH: 17.443 };
const WINDOW = { from: 9, to: 16 };

describe("the ticks of the timeline", () => {
  test("stand at sunrise, the window's ends, noon and sunset, at the ends of the track", () => {
    expect(ticksOf(PUNE_DEC, SUN_DEC, WINDOW)).toEqual([
      { hour: 6.75, words: "06:33 sunrise", end: { clock: "06:33", word: "sunrise" } },
      { hour: 9, words: "09:00" },
      { hour: 12, words: "12:00" },
      { hour: 16, words: "16:00" },
      { hour: 17.25, words: "sunset 17:27", end: { clock: "17:27", word: "sunset" } },
    ]);
  });

  test("a window's end outside the day has no tick", () => {
    const short = { from: 9.25, to: 15.75, sky: "rises and sets" } as const;
    expect(ticksOf(short, { sunriseH: 9.1, sunsetH: 15.9 }, WINDOW).map((tick) => tick.words)).toEqual(["09:06 sunrise", "12:00", "sunset 15:54"]);
  });

  test("a day the sun stays up or down runs from midnight to midnight", () => {
    expect(ticksOf({ from: 0, to: 24, sky: "stays down" }, { sunriseH: null, sunsetH: null }, WINDOW).map((tick) => tick.words)).toEqual(["00:00", "09:00", "12:00", "16:00", "24:00"]);
  });
});

describe("an hour held to the day", () => {
  test.each([
    [10.5, 10.5],
    [10.6, 10.5],
    [10.63, 10.75],
    [5, 6.75],
    [18, 17.25],
  ])("%d is %d", (hour, held) => {
    expect(heldHourOf(hour, PUNE_DEC)).toBe(held);
  });
});

describe("the days to choose", () => {
  test("are 21 Dec, 21 Mar and 21 Jun; in the north the design day is 21 Dec", () => {
    expect(daysOf(null, 18.52)).toEqual([
      { label: "21 Dec", dayOfYear: 355, isDesignDay: true },
      { label: "21 Mar", dayOfYear: 80, isDesignDay: false },
      { label: "21 Jun", dayOfYear: 172, isDesignDay: false },
    ]);
  });

  test("in the south the design day is 21 Jun", () => {
    expect(daysOf(null, -33.9).find((day) => day.isDesignDay)?.label).toBe("21 Jun");
  });

  test("an array's own design day is the design day", () => {
    expect(daysOf(80, 18.52).find((day) => day.isDesignDay)?.label).toBe("21 Mar");
  });

  test("the line says which day is the design day", () => {
    expect(designDayLineOf(null, 18.52)).toBe("21 December is the design day: the winter solstice for this hemisphere");
    expect(designDayLineOf(172, 18.52)).toBe("21 June is the design day of the array");
  });

  test("the day a chip sets: the design day as such, so that it follows the array", () => {
    expect(dayOfChoice(355, null, 18.52)).toBe("design_day");
    expect(dayOfChoice(172, null, 18.52)).toBe(172);
  });
});

describe("a date of a day and a month", () => {
  test.each([
    [1, 1, 1],
    [4, 2, 35],
    [21, 12, 355],
    [31, 2, 59],
  ])("day %d of month %d is day %d of the year (a day past the month's end is its last)", (day, month, dayOfYear) => {
    expect(dayOfYearOf(day, month)).toBe(dayOfYear);
  });

  test("and back", () => {
    expect(partsOf(35)).toEqual({ day: 4, month: 2 });
    expect(partsOf(355)).toEqual({ day: 21, month: 12 });
  });
});

describe("the keys of the time", () => {
  const at = (hour: number, day: number | "design_day" = "design_day") => ({ day, hour });

  test(", and . move an hour, held to the day", () => {
    expect(timeOfKey(",", at(10.5), 355, PUNE_DEC)).toEqual(at(9.5));
    expect(timeOfKey(".", at(10.5), 355, PUNE_DEC)).toEqual(at(11.5));
    expect(timeOfKey(",", at(7), 355, PUNE_DEC)).toEqual(at(6.75));
    expect(timeOfKey(".", at(16.75), 355, PUNE_DEC)).toEqual(at(17.25));
  });

  test("[ and ] move a day, round the year", () => {
    expect(timeOfKey("[", at(10.5), 355, PUNE_DEC)).toEqual(at(10.5, 354));
    expect(timeOfKey("]", at(10.5), 365, PUNE_DEC)).toEqual(at(10.5, 1));
    expect(timeOfKey("[", at(10.5, 1), 1, PUNE_DEC)).toEqual(at(10.5, 365));
  });

  test("other keys are none of the time's", () => {
    expect(timeOfKey("a", at(10.5), 355, PUNE_DEC)).toBeNull();
  });
});

describe("the tiles of the sun at the time", () => {
  test("say its height and its bearing, the number apart from its words", () => {
    expect(sunAtOf({ elevationDeg: 17.972, azimuthDeg: 236.642 })).toEqual({ height: { value: "18.0", unit: "°" }, bearing: { value: "56.6", unit: "° W of south" } });
  });

  test("on the line, the bearing is its words", () => {
    expect(sunAtOf({ elevationDeg: 48, azimuthDeg: 180 })?.bearing).toEqual({ value: "due south", unit: "" });
  });

  test("none while the sun is down", () => {
    expect(sunAtOf({ elevationDeg: -2, azimuthDeg: 114 })).toBeNull();
    expect(sunAtOf(null)).toBeNull();
  });
});

describe("the line under the Sun lens's title", () => {
  const WINDOW_9_16 = { from: 9, to: 16 };

  test("says the day, what it is, and the shade-free window", () => {
    expect(sunLineOf(355, 18.52, WINDOW_9_16)).toBe("21 December · winter solstice · shade-free from 09:00 to 16:00");
    expect(sunLineOf(172, 18.52, WINDOW_9_16)).toBe("21 June · summer solstice · shade-free from 09:00 to 16:00");
    expect(sunLineOf(80, 18.52, WINDOW_9_16)).toBe("21 March · equinox · shade-free from 09:00 to 16:00");
  });

  test("south of the equator the solstices change places", () => {
    expect(sunLineOf(172, -33.9, WINDOW_9_16)).toBe("21 June · winter solstice · shade-free from 09:00 to 16:00");
  });

  test("any other day is its date alone", () => {
    expect(sunLineOf(35, 18.52, { from: 9.25, to: 15.5 })).toBe("4 February · shade-free from 09:15 to 15:30");
  });
});

// The callout of the sun's marker (the board "Studio, Sun lens"): the time, and at an end of the shade-free
// window which end it is; the sun's height and bearing under it.
describe("the callout of the sun's marker", () => {
  const WINDOW_9_16 = { from: 9, to: 16 };
  const AT_16 = { elevationDeg: 17.972, azimuthDeg: 236.642 };

  test("at the window's end it says so", () => {
    expect(sunCalloutOf(16, AT_16, WINDOW_9_16)).toEqual({ title: "16:00 · end of the shade-free window", detail: "Sun 18.0° high, 56.6° W of south" });
  });

  test("at the window's start it says so", () => {
    expect(sunCalloutOf(9, { elevationDeg: 28, azimuthDeg: 133 }, WINDOW_9_16)).toEqual({ title: "09:00 · start of the shade-free window", detail: "Sun 28.0° high, 47.0° E of south" });
  });

  test("at any other hour the time alone", () => {
    expect(sunCalloutOf(10.5, { elevationDeg: 42.6, azimuthDeg: 151.5 }, WINDOW_9_16)).toEqual({ title: "10:30", detail: "Sun 42.6° high, 28.5° E of south" });
  });

  test("none while the sun is down or not known", () => {
    expect(sunCalloutOf(6.5, { elevationDeg: -0.7, azimuthDeg: 114.5 }, WINDOW_9_16)).toBeNull();
    expect(sunCalloutOf(10.5, null, WINDOW_9_16)).toBeNull();
  });
});

// The text equivalent of the sun path, for a screen reader and the tests.
describe("the words of the sun path", () => {
  const DEC = { lat: 18.52, lon: 73.86, day: "design_day" as const, dayOfYear: 355, sunriseH: 6.557, sunsetH: 17.443, positions: [{ hour: 12, elevationDeg: 48, azimuthDeg: 180 }] };

  test("the day, from sunrise to sunset, and the window drawn thicker", () => {
    expect(sunPathLineOf(DEC, { from: 9, to: 16 })).toBe("Sun path of 21 Dec from 06:33 to 17:27, the shade-free window from 09:00 to 16:00 thicker");
  });

  test("without the window, the day alone", () => {
    expect(sunPathLineOf(DEC, null)).toBe("Sun path of 21 Dec from 06:33 to 17:27");
  });

  test("a day the sun stays up runs the whole day; one it stays down has no path", () => {
    expect(sunPathLineOf({ ...DEC, sunriseH: null, sunsetH: null }, null)).toBe("Sun path of 21 Dec, the sun up the whole day");
    expect(sunPathLineOf({ ...DEC, sunriseH: null, sunsetH: null, positions: [{ hour: 12, elevationDeg: -5, azimuthDeg: 180 }] }, null)).toBeNull();
  });
});
