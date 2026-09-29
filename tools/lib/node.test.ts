import { describe, expect, test } from "bun:test";
import { compareVersions, envWithNode, parseVersion, pickNode, satisfiesMinimum } from "./node.ts";

describe("versions", () => {
  test("parses with and without the leading v", () => {
    expect(parseVersion("v20.20.2")).toEqual([20, 20, 2]);
    expect(parseVersion("22.1.0\n")).toEqual([22, 1, 0]);
    expect(parseVersion("lts/iron")).toBeNull();
  });

  test("compares by number, not by text", () => {
    expect(compareVersions("20.10.0", "20.9.0")).toBeGreaterThan(0);
    expect(compareVersions("18.20.8", "20.9.0")).toBeLessThan(0);
    expect(compareVersions("v20.9.0", "20.9.0")).toBe(0);
  });

  test("Next needs 20.9.0 or newer", () => {
    expect(satisfiesMinimum("20.9.0")).toBe(true);
    expect(satisfiesMinimum("20.8.1")).toBe(false);
    expect(satisfiesMinimum("18.20.8")).toBe(false);
    expect(satisfiesMinimum("not a version")).toBe(false);
  });
});

describe("pickNode", () => {
  const node16 = { path: "/opt/homebrew/opt/node@16/bin/node", version: "16.20.2" };
  const node18 = { path: "/opt/homebrew/opt/node@18/bin/node", version: "18.20.8" };
  const node20 = { path: "/opt/homebrew/opt/node@20/bin/node", version: "20.20.2" };
  const node22 = { path: "/usr/local/bin/node", version: "22.22.3" };

  test("nothing new enough gives null", () => {
    expect(pickNode([node16, node18], "20.20.2")).toBeNull();
    expect(pickNode([], "20.20.2")).toBeNull();
  });

  test("the version of .nvmrc wins over a newer one", () => {
    expect(pickNode([node22, node20, node18], "20.20.2")).toEqual(node20);
  });

  test("the same major as .nvmrc wins over a newer major", () => {
    const node20old = { path: "/somewhere/node", version: "20.11.0" };
    expect(pickNode([node22, node20old], "20.20.2")).toEqual(node20old);
  });

  test("without .nvmrc the newest wins", () => {
    expect(pickNode([node20, node22], null)).toEqual(node22);
  });

  test("of two equal versions the earlier place wins", () => {
    const onPath = { path: "/first/node", version: "20.20.2" };
    expect(pickNode([onPath, node20], "20.20.2")).toEqual(onPath);
  });
});

describe("envWithNode", () => {
  test("puts the directory of Node first and does not repeat it", () => {
    const env = envWithNode(
      { path: "/opt/node/bin/node", binDir: "/opt/node/bin", version: "20.20.2" },
      { PATH: "/usr/bin:/opt/node/bin:/bin", HOME: "/Users/someone" },
    );
    expect(env.PATH).toBe("/opt/node/bin:/usr/bin:/bin");
    expect(env.HOME).toBe("/Users/someone");
  });
});
