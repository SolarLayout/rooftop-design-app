// Proofs of the caching of the TypeScript and Python tasks: what turbo re-runs after one change, in a
// worktree of the repo (never the working tree). Run last by `bun check` as the task `//#proofs`.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "../../lib/paths.ts";
import { GROUPS, taskOf } from "../e2e-groups.ts";
import { changedTasks, turboHashes } from "./turbo-hashes.ts";
import { makeWorktree, registeredProofWorktrees, type Worktree } from "./worktree.ts";

const TOOLCHAIN = "node 26.10.0; bun 1.3.14; uv 0.11.26; python 3.12.13; proof";

const WEB = ["@rooftop/web#typecheck", "@rooftop/web#lint", "@rooftop/web#test"];
const E2E = ["@rooftop/e2e#typecheck", "@rooftop/e2e#test"];
/** The browser tests, one task per group (tools/check/e2e-groups.ts). */
const BROWSER = GROUPS.map(taskOf);
const browser = (...groups: string[]) => groups.map((id) => `//#e2e:${id}`);
const API_TYPES = ["@rooftop/api-types#typecheck"];
const API = ["@rooftop/api#lint", "@rooftop/api#imports", "@rooftop/api#test"];
const TOOLS = ["//#typecheck:tools", "//#test:tools"];
const PROOFS = ["//#proofs"];
const EVERYTHING = [...WEB, ...E2E, ...BROWSER, ...API_TYPES, ...API, ...TOOLS].sort();

/** Every file a proof changed: each must be an input of the proofs' task, so that a change to it re-runs them. */
const touched = new Set<string>();

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
  touched.add(file);
  const path = join(worktree.path, file);
  // latin1 in and out: every byte comes back as it was, so a baseline (PNG) can be changed as well.
  const original = readFileSync(path, "latin1");
  const text = change(original);
  if (text === original) throw new Error(`the proof did not change ${file}`);
  writeFileSync(path, text, "latin1");
  try {
    return changed(turboHashes(worktree.path, TOOLCHAIN));
  } finally {
    writeFileSync(path, original, "latin1");
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

  test("a module of Find: the web app's tasks, and the groups that see Find (find, and the Studio, Performance, Home and the shell, which cross into it)", () => {
    const reached = [...E2E.slice(0, 1), ...WEB, ...browser("find", "studio", "performance", "home", "shell")].sort();
    expect(after("apps/web/lib/outline/snap.ts", aComment)).toEqual(reached);
    expect(after("apps/web/components/find/RoofMap.tsx", aComment)).toEqual(reached);
  });

  test("a module of the Studio's scene: the web app's tasks, and studio, performance and shell", () => {
    expect(after("apps/web/lib/scene/pick.ts", aComment)).toEqual([...E2E.slice(0, 1), ...WEB, ...browser("studio", "performance", "shell")].sort());
  });

  test("a component of Handover: the web app's tasks, and handover and shell alone", () => {
    expect(after("apps/web/components/handover/Handover.tsx", aComment)).toEqual([...E2E.slice(0, 1), ...WEB, ...browser("handover", "shell")].sort());
  });

  test("a component of Home, whose dialog the switcher opens on every page but whose suites alone test it: the web app's tasks, and home and shell alone", () => {
    expect(after("apps/web/components/home/OpenProject.tsx", aComment)).toEqual([...E2E.slice(0, 1), ...WEB, ...browser("home", "shell")].sort());
    expect(after("apps/web/lib/home/open-project.ts", aComment)).toEqual([...E2E.slice(0, 1), ...WEB, ...browser("home", "shell")].sort());
  });

  test("a component of ui, which every page uses: the web app's tasks, and every group", () => {
    expect(after("apps/web/components/ui/Button.tsx", aComment)).toEqual([...E2E.slice(0, 1), ...WEB, ...BROWSER].sort());
  });

  test("a module of the device, whose designs the shell saves and opens on every page: the web app's tasks, and every group", () => {
    expect(after("apps/web/lib/device/saving.ts", aComment)).toEqual([...E2E.slice(0, 1), ...WEB, ...BROWSER].sort());
  });

  test("a module of the tools: the tools' tasks, and every group, whose stack the tools start", () => {
    expect(after("tools/lib/ports.ts", aComment)).toEqual([...TOOLS, ...BROWSER].sort());
    expect(after("tools/footprints.ts", aComment)).toEqual(TOOLS.sort());
  });

  test("the generated types of the API: their typecheck, the typechecks that depend on them, and every group", () => {
    expect(after("packages/api-types/src/index.ts", aComment)).toEqual([...API_TYPES, "@rooftop/web#typecheck", "@rooftop/e2e#typecheck", ...BROWSER].sort());
  });

  test("a module of the engine or a route of the API: the Python tasks, and every group", () => {
    expect(after("apps/api/src/rooftop_core/geo.py", aPythonComment)).toEqual([...API, ...BROWSER].sort());
    expect(after("apps/api/src/rooftop_api/routers/roof.py", aPythonComment)).toEqual([...API, ...BROWSER].sort());
  });

  test("a fixture of the Python tests: the Python tasks; pyproject.toml: those and every group", () => {
    expect(after("apps/api/tests/fixtures/weather/README.md", aComment)).toEqual(API.sort());
    expect(after("apps/api/pyproject.toml", aPythonComment)).toEqual([...API, ...BROWSER].sort());
  });

  test("a browser suite: e2e's tasks, and its own group alone", () => {
    expect(after("e2e/tests/find.e2e.ts", aComment)).toEqual([...E2E, ...browser("find")].sort());
    expect(after("e2e/tests/kit-buttons.e2e.ts", aComment)).toEqual([...E2E, ...browser("kit")].sort());
    expect(after("e2e/tests/screens.e2e.ts", aComment)).toEqual([...E2E, ...browser("shell")].sort());
  });

  test("a fixture of the browser tests, which every suite may read: e2e's tasks, and every group", () => {
    expect(after("e2e/fixtures/geocode-nothing.json", (text) => text.replace("{", "{ "))).toEqual([...E2E, ...BROWSER].sort());
  });

  test("a baseline: e2e's tasks, and the group of the suite that takes the picture (kit's are the kit suite's, every other the screens suite's)", () => {
    expect(after("e2e/baselines/darwin/desktop/find.png", (bytes) => `${bytes}x`)).toEqual([...E2E, ...browser("shell")].sort());
    expect(after("e2e/baselines/darwin/desktop/kit.png", (bytes) => `${bytes}x`)).toEqual([...E2E, ...browser("kit")].sort());
  });

  test("a document: nothing", () => {
    expect(after("plan/README.md", aComment)).toEqual([]);
    expect(after("CLAUDE.md", aComment)).toEqual([]);
  });

  test("a document of the web app: the package's own tasks, which key on every file of the package, and no browser group", () => {
    expect(after("apps/web/CLAUDE.md", aComment)).toEqual([...E2E.slice(0, 1), ...WEB].sort());
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
    const original = readFileSync(path, "latin1");
    writeFileSync(path, aPythonComment(original));
    try {
      expect(changedTasks(before, turboHashes(worktree.path, TOOLCHAIN))).toContain("//#proofs");
    } finally {
      writeFileSync(path, original);
    }
  });

  test("every file these proofs change is an input of the proofs' task", () => {
    const turbo = JSON.parse(readFileSync(join(REPO_ROOT, "turbo.json"), "utf8")) as { tasks: Record<string, { inputs?: string[] }> };
    const inputs = (turbo.tasks["//#proofs"]?.inputs ?? []).map((pattern) => new Bun.Glob(pattern));
    expect(touched.size).toBeGreaterThan(20);
    for (const file of touched) expect({ file, listed: inputs.some((glob) => glob.match(file)) }).toEqual({ file, listed: true });
  });

  test("the worktree is the only one of ours, and it goes when the proofs end", () => {
    expect(registeredProofWorktrees()).toEqual([worktree.path]);
  });
});
