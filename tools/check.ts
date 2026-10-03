// bun check
// Runs every check in a fixed order and stops at the first failure. Each step is one or more turbo tasks:
// a task whose inputs have not changed since a green run is not run again, and the summary says so.
//   bun check                 everything, with the caches
//   bun check --only=pytest   some steps (ids, comma separated)
//   bun check --skip=e2e      everything but some steps
//   bun check --fresh         ignore every cache and rebuild them

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { ensureTestStack } from "./check/e2e-stack.ts";
import { groupNameOf, GROUPS, scriptOf } from "./check/e2e-groups.ts";
import { parseFlags } from "./check/flags.ts";
import { FRESH_VARIABLE, REPORT_PREFIX } from "./check/pytest-selected-report.ts";
import { describeTasks, readRunSummary, type StepState } from "./check/run-summary.ts";
import { readToolchain, TOOLCHAIN_VARIABLE, toolchainString } from "./check/toolchain.ts";
import { turboDryRun } from "./check/turbo-dry-run.ts";
import { envWithNode, nodeMissingMessage, resolveNode } from "./lib/node.ts";
import { API_DIR, packageFile, REPO_ROOT } from "./lib/paths.ts";

type State = StepState | "left out" | "FAILED" | "not run";
type Result = { state: State; detail: string };
type Step = { id: string; name: string; run: () => Result | Promise<Result> };
/** `concurrency`: how many tasks at once (turbo's default otherwise); `names`: what a task id reads as in the summary. */
type TurboOptions = { concurrency?: number; names?: (taskId: string) => string };

const TURBO_RUNS = join(REPO_ROOT, ".turbo", "runs");

const node = resolveNode();
if (!node) {
  console.error(nodeMissingMessage());
  process.exit(1);
}
const toolchain = toolchainString(readToolchain());
const env: NodeJS.ProcessEnv = { ...envWithNode(node), [TOOLCHAIN_VARIABLE]: toolchain };

const STEP_IDS = ["typecheck", "eslint", "ruff", "imports", "pytest", "unit", "e2e", "proofs"];
const flags = parseFlags(process.argv.slice(2), STEP_IDS);
if (!flags.ok) {
  console.error(flags.message);
  process.exit(2);
}
if (flags.fresh) env[FRESH_VARIABLE] = "1";

/** Runs turbo tasks and reads what it did from the run summary it writes. */
function turbo(tasks: string[], filters: string[], options: TurboOptions = {}): Result {
  const bin = packageFile("turbo", "bin/turbo", REPO_ROOT);
  if (!bin) return { state: "FAILED", detail: "turbo is not installed. Run `bun install` first." };
  const before = new Set(existsSync(TURBO_RUNS) ? readdirSync(TURBO_RUNS) : []);
  const args = [
    "run",
    ...tasks,
    ...filters.map((filter) => `--filter=${filter}`),
    "--output-logs=new-only",
    "--summarize",
    "--no-daemon",
    ...(options.concurrency ? [`--concurrency=${options.concurrency}`] : []),
    ...(flags.ok && flags.fresh ? ["--force"] : []),
  ];
  const result = spawnSync(bin, args, { cwd: REPO_ROOT, env, stdio: "inherit" });
  if (result.error) return { state: "FAILED", detail: `turbo: ${result.error.message}` };

  const written = readdirSync(TURBO_RUNS).filter((name) => !before.has(name));
  if (written.length !== 1) {
    return { state: "FAILED", detail: `turbo wrote ${written.length} run summaries where one was expected` };
  }
  const path = join(TURBO_RUNS, written[0]!);
  const results = readRunSummary(readFileSync(path, "utf8"));
  rmSync(path, { force: true });
  for (const task of results.filter((task) => task.cached)) {
    console.log(`cache hit: ${task.taskId} (turbo hash ${task.hash.slice(0, 8)}, made at ${task.madeAt ?? "an earlier run"})`);
  }
  if (result.status !== 0) {
    const failed = results.filter((task) => task.exitCode !== null && task.exitCode !== 0).map((task) => task.taskId);
    return { state: "FAILED", detail: failed.length > 0 ? `failed: ${failed.join(", ")}` : `exit code ${result.status ?? `signal ${result.signal}`}` };
  }
  return describeTasks(results, options.names);
}

/**
 * The browser tests, one turbo task per group (tools/check/e2e-groups.ts), one after the other: six
 * Playwright runs at once would overload the machine. The test stack is started once, before the groups
 * that run, when it is not running; nothing is started when every group is cached.
 */
async function browserTests(): Promise<Result> {
  const scripts = GROUPS.map(scriptOf);
  let toRun: string[];
  if (flags.ok && flags.fresh) {
    toRun = GROUPS.map((group) => group.id);
  } else {
    try {
      toRun = turboDryRun(REPO_ROOT, scripts, toolchain, ["//"])
        .filter((task) => !task.cached)
        .map((task) => groupNameOf(task.taskId));
    } catch (error) {
      return { state: "FAILED", detail: (error as Error).message };
    }
  }
  if (toRun.length === 0) return turbo(scripts, ["//"], { names: groupNameOf });
  console.log(`groups to run: ${toRun.join(", ")}`);
  const stack = await ensureTestStack();
  if (!stack.ok) return { state: "FAILED", detail: stack.message };
  console.log(stack.note);
  try {
    return turbo(scripts, ["//"], { concurrency: 1, names: groupNameOf });
  } finally {
    stack.stop();
  }
}

/** When pytest ran, its own account of what ran (tools/check/pytest-selected.ts) is the detail. */
function withPytestReport(result: Result): Result {
  if (result.state !== "ok") return result;
  try {
    const log = readFileSync(join(API_DIR, ".turbo", "turbo-test.log"), "utf8");
    const line = log.split("\n").findLast((line) => line.includes(REPORT_PREFIX));
    return line ? { ...result, detail: line.slice(line.indexOf(REPORT_PREFIX) + REPORT_PREFIX.length).trim() } : result;
  } catch {
    return result;
  }
}

const STEPS: Step[] = [
  { id: "typecheck", name: "typecheck (web, tools, e2e)", run: () => turbo(["typecheck", "typecheck:tools"], []) },
  { id: "eslint", name: "eslint (web)", run: () => turbo(["lint"], ["@rooftop/web"]) },
  { id: "ruff", name: "ruff check and format (api)", run: () => turbo(["lint"], ["@rooftop/api"]) },
  { id: "imports", name: "import-linter (api)", run: () => turbo(["imports"], ["@rooftop/api"]) },
  { id: "pytest", name: "pytest (api)", run: () => withPytestReport(turbo(["test"], ["@rooftop/api"])) },
  { id: "unit", name: "bun test (web, tools)", run: () => turbo(["test", "test:tools"], ["@rooftop/web", "//"]) },
  { id: "e2e", name: "Playwright (phone, tablet, desktop)", run: browserTests },
  { id: "proofs", name: "proofs of the caching (in a worktree)", run: () => turbo(["proofs"], ["//"]) },
];

type Outcome = { step: Step; result: Result; seconds: number };
const outcomes: Outcome[] = [];
let failed: Outcome | null = null;

console.log(`bun check: ${toolchain}; caches ${flags.fresh ? "ignored and rebuilt (--fresh)" : "on"}`);

for (const step of STEPS) {
  if ((flags.only && !flags.only.includes(step.id)) || flags.skip.includes(step.id)) {
    outcomes.push({ step, result: { state: "left out", detail: "on request" }, seconds: 0 });
    continue;
  }
  if (failed) {
    outcomes.push({ step, result: { state: "not run", detail: "" }, seconds: 0 });
    continue;
  }
  console.log(`\n=== ${step.name} ===`);
  const began = performance.now();
  const result = await step.run();
  const outcome = { step, result, seconds: (performance.now() - began) / 1000 };
  outcomes.push(outcome);
  if (result.state === "FAILED") failed = outcome;
}

console.log("\n=== bun check: summary ===");
for (const { step, result, seconds } of outcomes) {
  const time = result.state === "left out" || result.state === "not run" ? "" : `${seconds.toFixed(1)} s`;
  console.log(`  ${result.state.padEnd(8)} ${step.name.padEnd(36)} ${time.padStart(8)}  ${result.detail}`.trimEnd());
}
const skipped = outcomes.filter((outcome) => outcome.result.state === "skipped").length;
const leftOut = outcomes.filter((outcome) => outcome.result.state === "left out").length;
if (failed) {
  console.log(`\nFAILED at: ${failed.step.name}. Later steps were not run.`);
  process.exit(1);
}
const notes = [
  skipped > 0 ? `${skipped} skipped, their inputs unchanged since they were cached` : "",
  leftOut > 0 ? `${leftOut} left out on request` : "",
].filter(Boolean);
console.log(notes.length > 0 ? `\nAll steps that ran are green; ${notes.join("; ")}.` : "\nAll green.");
