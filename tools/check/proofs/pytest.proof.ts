// Proofs of the selection of the Python tests (pytest-testmon, the runner tools/check/pytest-selected.ts
// and the sentinel tests/always_run.py), in a worktree of the repo, on a subset of the suite. Run last by
// `bun check` as the task //#proofs.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { API_DIR } from "../../lib/paths.ts";
import { FRESH_VARIABLE, REPORT_PREFIX, SELECT_VARIABLE } from "../pytest-selected-report.ts";
import { makeWorktree, type Worktree } from "./worktree.ts";

// Quick leaf tests, and the roof-from-map tests of the API, which go through geo.py; the sentinel of the
// proofs is the health test, so that a run costs seconds and not the demo's shading.
const SUBSET = ["tests/api/test_roof_map.py", "tests/engine/test_sunpath.py", "tests/engine/test_keepout_parts.py", "tests/test_health.py"];
const SENTINEL = "tests/test_health.py";
const THROUGH_GEO = "tests/api/test_roof_map.py";

let worktree: Worktree;
let api: string;

/** A run of pytest is seconds, not the milliseconds bun gives a test by default. */
const A_RUN = 300_000;

type Run = { code: number; report: string; ran: string[]; output: string };

/**
 * The runner in the worktree, on the subset, with the proofs' own sentinel. The worktree has no Python
 * environment of its own: uv runs the environment of the repo without syncing it, and the worktree's
 * `src` stands first on the path, so its modules are the ones imported and measured. Nothing is
 * installed and nothing is fetched.
 */
function run(env: Record<string, string> = {}): Run {
  // A second -v (the runner gives one): one line per test, so that what ran can be read.
  const result = spawnSync("bun", ["tools/check/pytest-selected.ts", "-v", "-o", `always_run=${SENTINEL}`, ...SUBSET], {
    cwd: worktree.path,
    encoding: "utf8",
    maxBuffer: 64 << 20,
    env: {
      ...process.env,
      UV_PROJECT_ENVIRONMENT: join(API_DIR, ".venv"),
      UV_NO_SYNC: "1",
      PYTHONPATH: join(api, "src"),
      ...env,
    },
  });
  const output = `${result.stdout}${result.stderr}`;
  const report = output.split("\n").findLast((line) => line.startsWith(REPORT_PREFIX))?.slice(REPORT_PREFIX.length) ?? "";
  // One process writes "tests/x.py::test PASSED"; a worker of pytest-xdist (the run without selection) "[gw0] [ 50%] PASSED tests/x.py::test".
  const ran = [...output.matchAll(/^(?:(tests\/\S+::\S+) (?:PASSED|FAILED|ERROR)|\[gw\d+\] \[\s*\d+%\] (?:PASSED|FAILED|ERROR) (tests\/\S+::\S+))/gm)].map((match) => (match[1] ?? match[2])!);
  return { code: result.status ?? 1, report, ran, output };
}

const files = (ran: string[]) => [...new Set(ran.map((id) => id.split("::")[0]!))].sort();

/** A real change in a file of the worktree (a statement, not a comment: testmon reads the syntax tree), undone after. */
function withChange<T>(file: string, change: (text: string) => string, body: () => T): T {
  const path = join(api, file);
  const original = readFileSync(path, "utf8");
  writeFileSync(path, change(original));
  try {
    return body();
  } finally {
    writeFileSync(path, original);
  }
}

beforeAll(() => {
  worktree = makeWorktree();
  api = join(worktree.path, "apps/api");
}, A_RUN);

afterAll(() => {
  worktree?.remove();
});

describe("what pytest re-runs", () => {
  let all: number;

  test("without data everything runs and is recorded", () => {
    const first = run();
    expect(first.code).toBe(0);
    expect(first.report).toMatch(/^ran all \d+ tests: no testmon data yet, recorded now$/);
    expect(files(first.ran)).toEqual([...SUBSET].sort());
    expect(existsSync(join(api, ".testmondata"))).toBe(true);
    expect(existsSync(join(api, ".testmondata.key"))).toBe(true);
    all = first.ran.length;
  }, A_RUN);

  test("unchanged: the sentinel runs and nothing else, and the summary says how many were not run", () => {
    const again = run();
    expect(again.code).toBe(0);
    expect(files(again.ran)).toEqual([SENTINEL]);
    const unchangedFiles = /unchanged files: (\d+)/.exec(again.output)?.[1];
    expect(again.report).toBe(
      `ran ${again.ran.length} of ${all} tests, the sentinel among them; ${all - again.ran.length} not run, unaffected by the change (pytest-testmon: test files affected: 0, unchanged files: ${unchangedFiles})`,
    );
  }, A_RUN);

  test("a statement inside one function of the engine: the tests that execute it, and the sentinel", () => {
    const result = withChange(
      "src/rooftop_core/geo.py",
      (text) => text.replace(/(def lonlat_to_local\([^)]*\)[^:]*:\n)/, "$1    _changed_by_the_proofs = 1\n"),
      () => run(),
    );
    expect(result.code).toBe(0);
    expect(files(result.ran)).toEqual([THROUGH_GEO, SENTINEL].sort());
    expect(result.ran.length).toBeLessThan(all);
    expect(result.report).toMatch(
      /^ran \d+ of \d+ tests, the sentinel among them; \d+ not run, unaffected by the change \(pytest-testmon: test files affected: tests\/api\/test_roof_map\.py, /,
    );
  }, A_RUN);

  test("undoing a change is a change: the same tests once more, then the sentinel alone", () => {
    expect(files(run().ran)).toEqual([THROUGH_GEO, SENTINEL].sort());
    expect(files(run().ran)).toEqual([SENTINEL]);
  }, A_RUN);

  test("a statement at module level of a conftest: everything", () => {
    const result = withChange("tests/conftest.py", (text) => `${text}\n_changed_by_the_proofs = 1\n`, () => run());
    expect(files(result.ran)).toEqual([...SUBSET].sort());
    expect(result.report).toMatch(/^ran \d+ of \d+ tests, the sentinel among them; 0 not run/);
  }, A_RUN);

  test("a data file the tests read, or pyproject.toml: the data is rebuilt and everything runs", () => {
    const rebuilt = /^ran all \d+ tests: a data file, the configuration, the lockfile or the toolchain changed: testmon's data rebuilt$/;
    const fixture = withChange("tests/fixtures/equipment/README.md", (text) => `${text}\nchanged by the proofs\n`, () => run());
    expect(fixture.report).toMatch(rebuilt);
    expect(files(fixture.ran)).toEqual([...SUBSET].sort());
    const config = withChange("pyproject.toml", (text) => `${text}\n# changed by the proofs\n`, () => run());
    expect(config.report).toMatch(rebuilt);
    // Undone is a different key again: rebuilt once more, and settled.
    expect(run().report).toMatch(rebuilt);
  }, A_RUN);

  test("a test that failed runs again although nothing changed", () => {
    const failing = withChange(
      "tests/engine/test_keepout_parts.py",
      (text) => text.replace(/^(def test_\w+\([^)]*\):\n)/m, "$1    assert False, 'made to fail by the proofs'\n"),
      () => run(),
    );
    expect(failing.code).not.toBe(0);
    expect(failing.report).toMatch(/1 failed/);
    const undone = run();
    expect(undone.code).toBe(0);
    expect(files(undone.ran)).toEqual(["tests/engine/test_keepout_parts.py", SENTINEL].sort());
  }, A_RUN);

  test("without selection (GitHub): everything runs, untraced, and the data is left alone", () => {
    const whole = run({ [SELECT_VARIABLE]: "0" });
    expect(whole.code).toBe(0);
    expect(whole.report).toBe(`ran all ${all} tests: whole and untraced, without pytest-testmon (${SELECT_VARIABLE}=0)`);
    expect(files(whole.ran)).toEqual([...SUBSET].sort());
    expect(whole.output).not.toContain("testmon:");
    expect(files(run().ran)).toEqual([SENTINEL]);
  }, A_RUN);

  test("--fresh: the data is deleted and everything runs", () => {
    const fresh = run({ [FRESH_VARIABLE]: "1" });
    expect(fresh.report).toMatch(/^ran all \d+ tests: --fresh, testmon's data deleted and rebuilt$/);
    expect(files(fresh.ran)).toEqual([...SUBSET].sort());
  }, A_RUN);
});
