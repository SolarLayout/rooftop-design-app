import { describe, expect, test } from "bun:test";
import { askCountry, countryInHeader, countryOf, createCountry, defaultVoltageOf, FALLBACK_COUNTRY, nameOfCountry } from "./country";

describe("the country of a request's header", () => {
  test("is the code Vercel sends, in capitals", () => {
    expect(countryInHeader("IN")).toBe("IN");
    expect(countryInHeader("us")).toBe("US");
  });

  test("is none when the header is missing or is not a country", () => {
    expect(countryInHeader(null)).toBeNull();
    expect(countryInHeader("")).toBeNull();
    expect(countryInHeader("XYZ")).toBeNull();
    expect(countryInHeader("1A")).toBeNull();
  });
});

describe("the user's country", () => {
  test("is the request's first", () => {
    expect(countryOf({ answered: "DE", timeZone: "Asia/Calcutta" })).toBe("DE");
  });

  test("else the browser's time zone, under the name a browser gives it", () => {
    expect(countryOf({ answered: null, timeZone: "Asia/Calcutta" })).toBe("IN");
    expect(countryOf({ answered: null, timeZone: "America/Toronto" })).toBe("CA");
  });

  test("else India (the owner, session 22)", () => {
    expect(FALLBACK_COUNTRY).toBe("IN");
    expect(countryOf({ answered: null, timeZone: "Mars/Olympus_Mons" })).toBe("IN");
    expect(countryOf({ answered: null, timeZone: null })).toBe("IN");
  });
});

describe("the default system voltage (D87)", () => {
  test("is 600 V in the United States, its territories under the NEC, and Canada", () => {
    for (const country of ["US", "CA", "PR", "GU", "VI", "AS", "MP"]) expect(defaultVoltageOf(country)).toBe(600);
  });

  test("is 1000 V everywhere else", () => {
    for (const country of ["IN", "DE", "AU", "GB", "MX"]) expect(defaultVoltageOf(country)).toBe(1000);
  });
});

describe("a country's name in a sentence", () => {
  const names: Record<string, string> = { US: "United States", IN: "India", NL: "Netherlands" };
  const nameOf = (country: string) => names[country] ?? country;

  test("takes the article where English gives it one", () => {
    expect(nameOfCountry("US", nameOf)).toBe("the United States");
    expect(nameOfCountry("NL", nameOf)).toBe("the Netherlands");
  });

  test("is the plain name otherwise", () => {
    expect(nameOfCountry("IN", nameOf)).toBe("India");
  });
});

describe("the country of the visit", () => {
  test("is the time zone's until the request's answer comes, then the answer's", async () => {
    let answer: (country: string | null) => void = () => {};
    const country = createCountry({ ask: () => new Promise((resolve) => (answer = resolve)), timeZone: () => "America/New_York" });

    expect(country.current()).toBe("US");
    const learnt = country.learn();
    answer("IN");
    await learnt;

    expect(country.current()).toBe("IN");
  });

  test("asks once, however often it is told to learn", async () => {
    let asked = 0;
    const country = createCountry({ ask: async () => (asked++, "DE"), timeZone: () => null });

    await Promise.all([country.learn(), country.learn()]);
    await country.learn();

    expect(asked).toBe(1);
    expect(country.current()).toBe("DE");
  });

  test("keeps the time zone's when the request cannot answer", async () => {
    const country = createCountry({ ask: async () => Promise.reject(new Error("offline")), timeZone: () => "America/Toronto" });

    await country.learn();

    expect(country.current()).toBe("CA");
  });
});

describe("asking the web app for the request's country", () => {
  const answering = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status });

  test("reads the country it answers", async () => {
    expect(await askCountry(answering(200, { country: "IN" }))).toBe("IN");
    expect(await askCountry(answering(200, { country: null }))).toBeNull();
  });

  test("fails in words when the web app does not answer as it should", async () => {
    expect(askCountry(answering(500, {}))).rejects.toThrow("The country of the request could not be asked: 500.");
    expect(askCountry(answering(200, { country: 7 }))).rejects.toThrow("The country of the request came back in a shape it does not have.");
  });
});
