import { describe, expect, test } from "bun:test";
import { pytestArguments } from "./pytest-arguments.ts";

describe("the arguments the check gives pytest", () => {
  test("selecting, pytest-testmon runs in one process", () => {
    expect(pytestArguments(true)).toEqual(["--testmon"]);
  });

  test("not selecting (GitHub), the suite runs whole, untraced and over every core", () => {
    const args = pytestArguments(false);
    expect(args).toEqual(["-p", "no:testmon", "-n", "auto"]);
    expect(args).not.toContain("--testmon");
  });
});
