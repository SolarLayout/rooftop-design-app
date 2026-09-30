// Runs pytest with pytest-testmon so that only the tests a change can have changed run, and says what ran.
// The task `test` of apps/api (turbo) calls this; `bun check` reads the last line it prints.
//
// Testmon's data (apps/api/.testmondata) is trusted only while its key (pytest-data-key.ts) matches the
// one kept beside it. When the key differs, when there is no data, or when the check runs with --fresh
// (ROOFTOP_CHECK_FRESH=1), the data is deleted and the whole suite runs and is recorded. The sentinel
// (tests/always_run.py) runs in every run whatever testmon selects. Arguments are passed on to pytest
// (`bun run test -- tests/api` in apps/api), for a hand that wants a part of the suite.
//
// With ROOFTOP_CHECK_SELECT=0 there is no selection and no tracing: pytest runs the suite whole, as on
// GitHub, where the task is cached whole by turbo and testmon's data is never kept (decision 4 of
// plan/phase-04b-plan.md).

import { Database } from "bun:sqlite";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { API_DIR } from "../lib/paths.ts";
import { dataKey, readDataKeyInputs } from "./pytest-data-key.ts";
import { FRESH_VARIABLE, REPORT_PREFIX, SELECT_VARIABLE } from "./pytest-selected-report.ts";
import { describePytestRun, parsePytestCounts } from "./pytest-summary.ts";

const DATA = join(API_DIR, ".testmondata");
const KEY = join(API_DIR, ".testmondata.key");

function storedKey(): string | null {
  try {
    return readFileSync(KEY, "utf8").trim();
  } catch {
    return null;
  }
}

/** Why the data cannot be used, or null when it can. */
function reasonToRebuild(key: string): string | null {
  if (process.env[FRESH_VARIABLE] === "1") return "--fresh, testmon's data deleted and rebuilt";
  if (!existsSync(DATA)) return "no testmon data yet, recorded now";
  if (storedKey() !== key) return "a data file, the configuration, the lockfile or the toolchain changed: testmon's data rebuilt";
  return null;
}

function deleteData(): void {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) rmSync(`${DATA}${suffix}`, { force: true });
}

/** How many tests testmon's data knows. Null when the file cannot be read that way. */
function knownTests(): number | null {
  try {
    // Opened plainly and only read: testmon keeps the file in WAL mode, which SQLite refuses to open
    // read-only unless its side files exist.
    const db = new Database(DATA);
    try {
      const row = db.query("SELECT COUNT(DISTINCT test_name) AS n FROM test_execution").get() as { n: number } | null;
      return row?.n ?? null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

/** Runs pytest, streams its output, and gives it back with the exit code. */
function runPytest(selection: string[], args: string[]): Promise<{ output: string; code: number }> {
  return new Promise((resolve, reject) => {
    // -v against the -q of pyproject.toml: verbosity 0, so that testmon's line about what changed is printed.
    const child = spawn("uv", ["run", "--locked", "pytest", ...selection, "-v", ...args], { cwd: API_DIR, stdio: ["ignore", "pipe", "inherit"] });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      process.stdout.write(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ output, code: code ?? 1 }));
  });
}

const selecting = process.env[SELECT_VARIABLE] !== "0";
let rebuilt: string | null = `whole and untraced, without pytest-testmon (${SELECT_VARIABLE}=0)`;
if (selecting) {
  const key = dataKey(readDataKeyInputs());
  rebuilt = reasonToRebuild(key);
  if (rebuilt) {
    deleteData();
    writeFileSync(KEY, `${key}\n`);
    console.log(`pytest-testmon: ${rebuilt}`);
  }
}
const known = rebuilt ? 0 : (knownTests() ?? 0);

const { output, code } = await runPytest(selecting ? ["--testmon"] : ["-p", "no:testmon"], process.argv.slice(2));
// Testmon's "changed files" are the test files whose tests are affected, not the files that changed.
const changed = /^testmon: (changed files: .*?|new DB, .*?|The packages installed .*?)(, environment: default)?$/m
  .exec(output)?.[1]
  ?.replace(/^changed files: /, "test files affected: ") ?? null;
console.log(`${REPORT_PREFIX}${describePytestRun({ counts: parsePytestCounts(output), known, rebuilt, changed })}`);
process.exit(code);
