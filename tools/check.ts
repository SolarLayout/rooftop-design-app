// bun check
// Runs every check in a fixed order and stops at the first failure.
//   bun check                 everything
//   bun check --only=pytest   some steps (ids, comma separated)
//   bun check --skip=e2e      everything but some steps

import { spawnSync } from "node:child_process";
import { envWithNode, nodeMissingMessage, resolveNode } from "./lib/node.ts";
import { API_DIR, E2E_DIR, packageFile, REPO_ROOT, WEB_DIR } from "./lib/paths.ts";

type Command = { command: string; args: string[]; cwd: string };
type Step = { id: string; name: string; needsNode: boolean; commands: () => Command[] };

const node = resolveNode();
const env = node ? envWithNode(node) : process.env;
const bun = process.execPath;

const STEPS: Step[] = [
  {
    id: "typecheck",
    name: "typecheck (web, tools, e2e)",
    needsNode: true,
    commands: () => [
      { command: bun, args: ["run", "typecheck"], cwd: WEB_DIR },
      { command: bun, args: ["run", "typecheck:tools"], cwd: REPO_ROOT },
      { command: bun, args: ["run", "typecheck"], cwd: E2E_DIR },
    ],
  },
  {
    id: "eslint",
    name: "eslint (web)",
    needsNode: true,
    commands: () => [{ command: bun, args: ["run", "lint"], cwd: WEB_DIR }],
  },
  {
    id: "ruff",
    name: "ruff check and format (api)",
    needsNode: false,
    commands: () => [
      { command: "uv", args: ["run", "--locked", "ruff", "check", "."], cwd: API_DIR },
      { command: "uv", args: ["run", "--locked", "ruff", "format", "--check", "."], cwd: API_DIR },
    ],
  },
  {
    id: "imports",
    name: "import-linter (api)",
    needsNode: false,
    commands: () => [{ command: "uv", args: ["run", "--locked", "lint-imports"], cwd: API_DIR }],
  },
  {
    id: "pytest",
    name: "pytest (api)",
    needsNode: false,
    commands: () => [{ command: "uv", args: ["run", "--locked", "pytest"], cwd: API_DIR }],
  },
  {
    id: "unit",
    name: "bun test (TypeScript unit tests)",
    needsNode: false,
    commands: () => [{ command: bun, args: ["test"], cwd: REPO_ROOT }],
  },
  {
    id: "e2e",
    name: "Playwright smoke (phone, tablet, desktop)",
    needsNode: true,
    commands: () => [
      {
        command: node!.path,
        args: [packageFile("@playwright/test", "cli.js", E2E_DIR) ?? "@playwright/test is not installed", "test"],
        cwd: E2E_DIR,
      },
    ],
  },
];

function listOf(flag: string): string[] | null {
  const found = process.argv.slice(2).find((argument) => argument.startsWith(`--${flag}=`));
  return found ? found.slice(flag.length + 3).split(",").filter(Boolean) : null;
}

const only = listOf("only");
const skip = listOf("skip") ?? [];
const unknown = [...(only ?? []), ...skip].filter((id) => !STEPS.some((step) => step.id === id));
if (unknown.length > 0) {
  console.error(`Unknown step: ${unknown.join(", ")}. Steps: ${STEPS.map((step) => step.id).join(", ")}.`);
  process.exit(2);
}

type Outcome = { step: Step; state: "ok" | "FAILED" | "not run" | "skipped"; seconds: number; detail: string };
const outcomes: Outcome[] = [];
let failed: Outcome | null = null;

for (const step of STEPS) {
  if ((only && !only.includes(step.id)) || skip.includes(step.id)) {
    outcomes.push({ step, state: "skipped", seconds: 0, detail: "left out on request" });
    continue;
  }
  if (failed) {
    outcomes.push({ step, state: "not run", seconds: 0, detail: "" });
    continue;
  }

  console.log(`\n=== ${step.name} ===`);
  const began = performance.now();
  let detail = "";

  if (step.needsNode && !node) {
    console.error(nodeMissingMessage());
    detail = "Node.js not found";
  } else {
    for (const { command, args, cwd } of step.commands()) {
      const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
      if (result.error) detail = `${command}: ${result.error.message}`;
      else if (result.status !== 0) detail = `exit code ${result.status ?? `signal ${result.signal}`}`;
      if (detail) break;
    }
  }

  const outcome: Outcome = { step, state: detail ? "FAILED" : "ok", seconds: (performance.now() - began) / 1000, detail };
  outcomes.push(outcome);
  if (detail) failed = outcome;
}

console.log("\n=== bun check: summary ===");
for (const outcome of outcomes) {
  const time = outcome.state === "ok" || outcome.state === "FAILED" ? `${outcome.seconds.toFixed(1)} s` : "";
  console.log(`  ${outcome.state.padEnd(8)} ${outcome.step.name.padEnd(44)} ${time.padStart(8)}  ${outcome.detail}`.trimEnd());
}
const left = outcomes.filter((outcome) => outcome.state === "skipped").length;
if (failed) {
  console.log(`\nFAILED at: ${failed.step.name}. Later steps were not run.`);
  process.exit(1);
}
console.log(left > 0 ? `\nAll steps that ran are green; ${left} left out on request.` : "\nAll green.");
