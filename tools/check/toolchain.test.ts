import { describe, expect, test } from "bun:test";
import { parseUvVersion, toolchainString, type Toolchain } from "./toolchain.ts";

const machine: Toolchain = { node: "26.10.0", bun: "1.3.14", uv: "0.11.26", python: "3.12.13", platform: "darwin-arm64" };

describe("toolchainString", () => {
  test("holds every version and the platform, in a fixed order", () => {
    expect(toolchainString(machine)).toBe("node 26.10.0; bun 1.3.14; uv 0.11.26; python 3.12.13; darwin-arm64");
  });

  test("a different version of any tool gives a different string", () => {
    for (const key of Object.keys(machine) as (keyof Toolchain)[]) {
      const changed = { ...machine, [key]: `${machine[key]}-other` };
      expect(toolchainString(changed)).not.toBe(toolchainString(machine));
    }
  });
});

describe("parseUvVersion", () => {
  test("reads the version out of uv's own line", () => {
    expect(parseUvVersion("uv 0.11.26 (Homebrew 2026-06-30 aarch64-apple-darwin)\n")).toBe("0.11.26");
    expect(parseUvVersion("uv 0.9.0")).toBe("0.9.0");
  });

  test("refuses a line that is not uv's", () => {
    expect(() => parseUvVersion("")).toThrow(/uv --version/);
    expect(() => parseUvVersion("command not found")).toThrow(/uv --version/);
  });
});
