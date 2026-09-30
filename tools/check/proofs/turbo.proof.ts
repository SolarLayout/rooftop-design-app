// Proofs of the caching of the TypeScript and Python tasks: what turbo re-runs after one change, in a
// worktree of the repo (never the working tree). Run last by `bun check` as the task `//#proofs`.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { changedTasks, turboHashes } from "./turbo-hashes.ts";
import { makeWorktree, registeredProofWorktrees, type Worktree } from "./worktree.ts";

const TOOLCHAIN = "node 26.10.0; bun 1.3.14; uv 0.11.26; python 3.12.13; proof";

const WEB = ["@rooftop/web#typecheck", "@rooftop/web#lint", "@rooftop/web#test"];
const E2E = ["@rooftop/e2e#typecheck", "@rooftop/e2e#test"];
const API_TYPES = ["@rooftop/api-types#typecheck"];
const API = ["@rooftop/api#lint", "@rooftop/api#imports", "@rooftop/api#test"];
const TOOLS = ["//#typecheck:tools", "//#test:tools"];
const PROOFS = ["//#proofs"];
const EVERYTHING = [...WEB, ...E2E, ...API_TYPES, ...API, ...TOOLS].sort();

let worktree: Worktree;
let before: Map<string, string>;

beforeAll(() => {
  worktree = makeWorktree();
  before = turboHashes(worktree.path, TOOLCHAIN);
});

afterAll(() => {
  worktree?.remove();
});

/** The tasks whose hash changed, the proofs' own task left aside: it is keyed on the files these proofs change. */
function changed(after: Map<string, string>): string[] {
  return changedTasks(before, after).filter((id) => !PROOFS.includes(id));
}

/** Applies one change to a file of the worktree, reads the hashes, and puts the file back. */
function after(file: string, change: (text: string) => string): string[] {
  const path = join(worktree.path, file);
  const original = readFileSync(path, "utf8");
  const text = change(original);
  if (text === original) throw new Error(`the proof did not change ${file}`);
  writeFileSync(path, text);
  try {
    return changed(turboHashes(worktree.path, TOOLCHAIN));
  } finally {
    writeFileSync(path, original);
  }
}

const aComment = (text: string) => `${text}\n// changed by the proofs of the check\n`;
const aPythonComment = (text: string) => `${text}\n# changed by the proofs of the check\n`;

describe("what turbo re-runs", () => {
  test("every task of the repo is keyed", () => {
    expect([...before.keys()].sort()).toEqual([...EVERYTHING, ...PROOFS].sort());
  });

  test("an unchanged tree changes nothing", () => {
    expect(changed(turboHashes(worktree.path, TOOLCHAIN))).toEqual([]);
  });

  test("a module of the web app: the web app's tasks, and the browser tests that import it", () => {
    expect(after("apps/web/lib/outline/snap.ts", aComment)).toEqual([...E2E.slice(0, 1), ...WEB].sort());
  });

  test("a component of Find: the same", () => {
    expect(after("apps/web/components/find/RoofMap.tsx", aComment)).toEqual([...E2E.slice(0, 1), ...WEB].sort());
  });

  test("a module of the tools: the tools' tasks only", () => {
    expect(after("tools/lib/ports.ts", aComment)).toEqual(TOOLS.sort());
  });

  test("the generated types of the API: their typecheck, and the typechecks that depend on them", () => {
    expect(after("packages/api-types/src/index.ts", aComment)).toEqual([...API_TYPES, "@rooftop/web#typecheck", "@rooftop/e2e#typecheck"].sort());
  });

  test("a module of the engine: the Python tasks only", () => {
    expect(after("apps/api/src/rooftop_core/geo.py", aPythonComment)).toEqual(API.sort());
  });

  test("a fixture of the Python tests, or pyproject.toml: the Python tasks", () => {
    expect(after("apps/api/tests/fixtures/weather/README.md", aComment)).toEqual(API.sort());
    expect(after("apps/api/pyproject.toml", aPythonComment)).toEqual(API.sort());
  });

  test("a browser test or its fixtures: the browser tests", () => {
    expect(after("e2e/tests/find.e2e.ts", aComment)).toEqual(E2E.sort());
    expect(after("e2e/fixtures/geocode-nothing.json", (text) => text.replace("{", "{ "))).toEqual(E2E.sort());
  });

  test("a document: nothing", () => {
    expect(after("plan/README.md", aComment)).toEqual([]);
    expect(after("CLAUDE.md", aComment)).toEqual([]);
  });

  test("the lockfile, turbo.json, the check's own code: everything", () => {
    expect(after("bun.lock", (text) => text.replaceAll("openapi-typescript@7.13.0", "openapi-typescript@7.13.1"))).toEqual(EVERYTHING);
    expect(after("turbo.json", (text) => text.replace('"globalDependencies": [', '"globalDependencies": ["package.json", '))).toEqual(EVERYTHING);
    expect(after("tools/check.ts", aComment)).toEqual(EVERYTHING);
    expect(after("tools/check/run-summary.ts", aComment)).toEqual(EVERYTHING);
  });

  test("a different toolchain: everything", () => {
    expect(changed(turboHashes(worktree.path, `${TOOLCHAIN}, other`))).toEqual(EVERYTHING);
  });

  test("the proofs themselves re-run when a file they change changes", () => {
    const path = join(worktree.path, "apps/api/src/rooftop_core/geo.py");
    const original = readFileSync(path, "utf8");
    writeFileSync(path, aPythonComment(original));
    try {
      expect(changedTasks(before, turboHashes(worktree.path, TOOLCHAIN))).toContain("//#proofs");
    } finally {
      writeFileSync(path, original);
    }
  });

  test("the worktree is the only one of ours, and it goes when the proofs end", () => {
    expect(registeredProofWorktrees()).toEqual([worktree.path]);
  });
});
