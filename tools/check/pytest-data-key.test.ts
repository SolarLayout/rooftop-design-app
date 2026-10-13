import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dataKey, e2eWeatherFixtures, isDataInput, lockedVersion, webFilesOfPytest, type DataKeyInputs } from "./pytest-data-key.ts";

const inputs: DataKeyInputs = {
  files: [
    { path: "tests/fixtures/weather/pvgis-over-the-sea.json", bytes: new TextEncoder().encode('{"a": 1}') },
    { path: "pyproject.toml", bytes: new TextEncoder().encode("[project]\n") },
  ],
  python: "3.12.13",
  testmon: "2.2.0",
  coverage: "7.16.2",
  platform: "darwin-arm64",
};

describe("isDataInput", () => {
  test("every file of apps/api that is not Python code counts: fixtures, samples, configuration, the lockfile", () => {
    for (const path of [
      "tests/fixtures/equipment/Test.PAN",
      "tests/fixtures/weather/pvgis-tmy-pune.json.gz",
      "src/rooftop_core/samples/pune_weather.json",
      "pyproject.toml",
      "uv.lock",
      ".python-version",
    ]) {
      expect(isDataInput(path)).toBe(true);
    }
  });

  test("Python code does not: testmon tracks it itself", () => {
    expect(isDataInput("src/rooftop_core/geo.py")).toBe(false);
    expect(isDataInput("tests/conftest.py")).toBe(false);
  });
});

describe("dataKey", () => {
  test("is the same for the same inputs", () => {
    expect(dataKey(inputs)).toBe(dataKey({ ...inputs, files: [...inputs.files] }));
    expect(dataKey(inputs)).toMatch(/^[0-9a-f]{64}$/);
  });

  test("changes with the bytes of a data file, its path, or a file added", () => {
    const changedBytes = { ...inputs, files: [{ ...inputs.files[0]!, bytes: new TextEncoder().encode('{"a": 2}') }, inputs.files[1]!] };
    const renamed = { ...inputs, files: [{ ...inputs.files[0]!, path: "tests/fixtures/weather/other.json" }, inputs.files[1]!] };
    const added = { ...inputs, files: [...inputs.files, { path: "tests/fixtures/new.csv", bytes: new Uint8Array() }] };
    for (const other of [changedBytes, renamed, added]) expect(dataKey(other)).not.toBe(dataKey(inputs));
  });

  test("changes with the Python, testmon or coverage version and the platform", () => {
    for (const key of ["python", "testmon", "coverage", "platform"] as const) {
      expect(dataKey({ ...inputs, [key]: "other" })).not.toBe(dataKey(inputs));
    }
  });

  test("does not depend on the order the files are listed in", () => {
    expect(dataKey({ ...inputs, files: [inputs.files[1]!, inputs.files[0]!] })).toBe(dataKey(inputs));
  });
});

describe("e2eWeatherFixtures", () => {
  test("the weather fixtures of e2e/fixtures, named from the root, sorted; nothing else of the directory", () => {
    const e2eDir = mkdtempSync(join(tmpdir(), "e2e-"));
    mkdirSync(join(e2eDir, "fixtures"));
    writeFileSync(join(e2eDir, "fixtures", "weather-pvgis-pune.json"), "{}");
    writeFileSync(join(e2eDir, "fixtures", "weather-nasa-pune.json"), "[]");
    writeFileSync(join(e2eDir, "fixtures", "geocode-nothing.json"), "{}");
    writeFileSync(join(e2eDir, "fixtures", "imagery-tile.png"), "");

    expect(e2eWeatherFixtures(e2eDir)).toEqual([
      { path: "e2e/fixtures/weather-nasa-pune.json", bytes: new TextEncoder().encode("[]") },
      { path: "e2e/fixtures/weather-pvgis-pune.json", bytes: new TextEncoder().encode("{}") },
    ]);
  });
});

describe("webFilesOfPytest", () => {
  test("the web app's files a pytest holds to the engine, named from the root: the library's catalog (D118), Home's demo figures (D120)", () => {
    const webDir = mkdtempSync(join(tmpdir(), "web-"));
    mkdirSync(join(webDir, "public", "equipment"), { recursive: true });
    mkdirSync(join(webDir, "lib", "home"), { recursive: true });
    writeFileSync(join(webDir, "public", "equipment", "catalog.json"), '{"inverters": []}');
    writeFileSync(join(webDir, "lib", "home", "home-view.ts"), 'kwp: "348.00"');

    expect(webFilesOfPytest(webDir)).toEqual([
      { path: "apps/web/public/equipment/catalog.json", bytes: new TextEncoder().encode('{"inverters": []}') },
      { path: "apps/web/lib/home/home-view.ts", bytes: new TextEncoder().encode('kwp: "348.00"') },
    ]);
  });
});

describe("lockedVersion", () => {
  const lock = '[[package]]\nname = "pytest"\nversion = "9.1.1"\n\n[[package]]\nname = "pytest-testmon"\nversion = "2.2.0"\nsource = { registry = "x" }\n';

  test("reads a package's version out of uv.lock", () => {
    expect(lockedVersion(lock, "pytest-testmon")).toBe("2.2.0");
    expect(lockedVersion(lock, "pytest")).toBe("9.1.1");
  });

  test("refuses a package that is not locked", () => {
    expect(() => lockedVersion(lock, "coverage")).toThrow(/coverage.*uv\.lock/);
  });
});
