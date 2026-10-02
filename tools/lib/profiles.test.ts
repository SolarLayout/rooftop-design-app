import { describe, expect, test } from "bun:test";
import { apiEnvOf, choosePair, mapKeyNote, pairsOf, PROFILES, rangeOf, roleOf, selectProfiles, urlsOf } from "./profiles.ts";

const { dev, test: testProfile } = PROFILES;
const busy = (...ports: number[]) => new Set(ports);

describe("pairs and ranges", () => {
  test("dev has five pairs from 4700, test five from 4710", () => {
    expect(pairsOf(dev)).toEqual([
      { web: 4700, api: 4701 },
      { web: 4702, api: 4703 },
      { web: 4704, api: 4705 },
      { web: 4706, api: 4707 },
      { web: 4708, api: 4709 },
    ]);
    expect(pairsOf(testProfile)[0]).toEqual({ web: 4710, api: 4711 });
    expect(pairsOf(testProfile)[4]).toEqual({ web: 4718, api: 4719 });
  });

  test("the ranges do not overlap", () => {
    expect(rangeOf(dev)).toEqual({ first: 4700, last: 4709 });
    expect(rangeOf(testProfile)).toEqual({ first: 4710, last: 4719 });
  });

  test("even offsets are web, odd are api, outside is neither", () => {
    expect(roleOf(dev, 4700)).toBe("web");
    expect(roleOf(dev, 4703)).toBe("api");
    expect(roleOf(dev, 4710)).toBeNull();
    expect(roleOf(testProfile, 4710)).toBe("web");
    expect(roleOf(testProfile, 4709)).toBeNull();
  });

  test("each profile has its own build directory", () => {
    expect(dev.distDir).toBe(".next");
    expect(testProfile.distDir).toBe(".next-test");
  });
});

describe("choosePair", () => {
  test("all free: the preferred pair", () => {
    expect(choosePair(dev, busy())).toEqual({ ok: true, pair: { web: 4700, api: 4701 }, passedOver: [] });
    expect(choosePair(testProfile, busy())).toEqual({ ok: true, pair: { web: 4710, api: 4711 }, passedOver: [] });
  });

  test("web busy: the next pair, and the reason", () => {
    expect(choosePair(dev, busy(4700))).toEqual({
      ok: true,
      pair: { web: 4702, api: 4703 },
      passedOver: [{ pair: { web: 4700, api: 4701 }, busy: [4700] }],
    });
  });

  test("api busy: the pair is unusable although its web port is free", () => {
    expect(choosePair(testProfile, busy(4711))).toEqual({
      ok: true,
      pair: { web: 4712, api: 4713 },
      passedOver: [{ pair: { web: 4710, api: 4711 }, busy: [4711] }],
    });
  });

  test("first two pairs busy: the third", () => {
    expect(choosePair(dev, busy(4700, 4701, 4703))).toEqual({
      ok: true,
      pair: { web: 4704, api: 4705 },
      passedOver: [
        { pair: { web: 4700, api: 4701 }, busy: [4700, 4701] },
        { pair: { web: 4702, api: 4703 }, busy: [4703] },
      ],
    });
  });

  test("only the last pair free: the last pair", () => {
    const choice = choosePair(dev, busy(4700, 4702, 4704, 4706));
    expect(choice.ok && choice.pair).toEqual({ web: 4708, api: 4709 });
  });

  test("whole range busy: a refusal that names every pair", () => {
    const choice = choosePair(dev, busy(4700, 4703, 4704, 4705, 4707, 4708));
    expect(choice.ok).toBe(false);
    expect(choice.passedOver).toEqual([
      { pair: { web: 4700, api: 4701 }, busy: [4700] },
      { pair: { web: 4702, api: 4703 }, busy: [4703] },
      { pair: { web: 4704, api: 4705 }, busy: [4704, 4705] },
      { pair: { web: 4706, api: 4707 }, busy: [4707] },
      { pair: { web: 4708, api: 4709 }, busy: [4708] },
    ]);
  });

  test("never leaves the range of the profile", () => {
    const everything = busy(...Array.from({ length: 10 }, (_, index) => 4700 + index));
    expect(choosePair(dev, everything).ok).toBe(false);
    expect(choosePair(testProfile, everything)).toEqual({ ok: true, pair: { web: 4710, api: 4711 }, passedOver: [] });
  });

  test("busy ports of the other profile do not matter", () => {
    expect(choosePair(dev, busy(4710, 4711))).toEqual({ ok: true, pair: { web: 4700, api: 4701 }, passedOver: [] });
  });
});

describe("urlsOf", () => {
  test("web on localhost, api on 127.0.0.1", () => {
    expect(urlsOf({ web: 4702, api: 4703 })).toEqual({
      web: "http://localhost:4702",
      api: "http://127.0.0.1:4703",
      apiHealth: "http://127.0.0.1:4703/health",
    });
  });
});

describe("apiEnvOf", () => {
  test("the test stack's API has downloads of weather off", () => {
    expect(apiEnvOf(testProfile)).toEqual({ ROOFTOP_WEATHER_DOWNLOADS: "off" });
  });

  test("the dev stack's API is told nothing", () => {
    expect(apiEnvOf(dev)).toEqual({});
  });
});

describe("mapKeyNote", () => {
  test("no note on the port the key accepts", () => {
    expect(mapKeyNote(dev, 4700)).toBeNull();
  });

  test("a note on any other dev port, naming both ports", () => {
    const note = mapKeyNote(dev, 4702);
    expect(note).toContain("4702");
    expect(note).toContain("http://localhost:4700");
    expect(note).toContain("Esri");
  });

  test("never a note for the test profile", () => {
    expect(mapKeyNote(testProfile, 4710)).toBeNull();
    expect(mapKeyNote(testProfile, 4712)).toBeNull();
  });
});

describe("selectProfiles", () => {
  test("dev without flag or environment", () => {
    expect(selectProfiles(["--detach"], {})).toEqual({ ok: true, names: ["dev"] });
  });

  test("the flag, in both spellings", () => {
    expect(selectProfiles(["--detach", "--profile", "test"], {})).toEqual({ ok: true, names: ["test"] });
    expect(selectProfiles(["--profile=test"], {})).toEqual({ ok: true, names: ["test"] });
  });

  test("the environment, and the flag wins over it", () => {
    expect(selectProfiles([], { ROOFTOP_PROFILE: "test" })).toEqual({ ok: true, names: ["test"] });
    expect(selectProfiles(["--profile", "dev"], { ROOFTOP_PROFILE: "test" })).toEqual({ ok: true, names: ["dev"] });
  });

  test("--all is every profile", () => {
    expect(selectProfiles(["--all"], {})).toEqual({ ok: true, names: ["dev", "test"] });
  });

  test("an unknown or missing name is an error that lists the profiles", () => {
    const unknown = selectProfiles(["--profile", "prod"], {});
    expect(unknown.ok).toBe(false);
    expect(!unknown.ok && unknown.error).toContain("dev, test");
    expect(selectProfiles(["--profile"], {}).ok).toBe(false);
    expect(selectProfiles([], { ROOFTOP_PROFILE: "staging" }).ok).toBe(false);
  });
});
