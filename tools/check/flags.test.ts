import { describe, expect, test } from "bun:test";
import { parseFlags } from "./flags.ts";

const STEPS = ["typecheck", "eslint", "pytest", "e2e"];

describe("parseFlags", () => {
  test("nothing asked: every step, with the caches", () => {
    expect(parseFlags([], STEPS)).toEqual({ ok: true, only: null, skip: [], fresh: false });
  });

  test("--only and --skip name steps by id, comma separated", () => {
    expect(parseFlags(["--only=pytest,e2e"], STEPS)).toMatchObject({ only: ["pytest", "e2e"], skip: [] });
    expect(parseFlags(["--skip=e2e"], STEPS)).toMatchObject({ only: null, skip: ["e2e"] });
  });

  test("--fresh ignores the caches and rebuilds them", () => {
    expect(parseFlags(["--fresh"], STEPS)).toMatchObject({ fresh: true });
  });

  test("an unknown step or flag is refused with the list of steps", () => {
    const unknown = parseFlags(["--only=ruff"], STEPS);
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) expect(unknown.message).toMatch(/Unknown step: ruff.*Steps: typecheck, eslint, pytest, e2e/);
    const flag = parseFlags(["--force"], STEPS);
    expect(flag.ok).toBe(false);
    if (!flag.ok) expect(flag.message).toMatch(/Unknown flag: --force/);
  });
});
