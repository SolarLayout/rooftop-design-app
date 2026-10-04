import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { E2E_DIR, REPO_ROOT } from "../lib/paths.ts";
import { BASE_INPUTS, baselinesOf, GROUPS, groupById, groupOf, groupOfBaseline, inputsOf, isBaselines, scriptOf, suitesOf, taskOf, type Group } from "./e2e-groups.ts";
import { filesMatching as filesOf } from "./input-files.ts";

const filesMatching = (patterns: string[]) => filesOf(patterns, REPO_ROOT);

const SUITES = readdirSync(join(E2E_DIR, "tests")).filter((name) => name.endsWith(".e2e.ts"));
const BASELINES = [...filesMatching(["e2e/baselines/*/*/*.png"])].sort();

const ownOf = (group: Group) => group.own;

const intersection = <T>(a: Set<T>, b: Set<T>) => [...a].filter((item) => b.has(item));

describe("the groups of the browser tests", () => {
  test("there are eight, in the order the check runs them", () => {
    expect(GROUPS.map((group) => group.id)).toEqual(["kit", "find", "studio", "performance", "handover", "home", "present", "shell"]);
  });

  test("every suite in e2e/tests belongs to exactly one group, by its name", () => {
    expect(SUITES.length).toBeGreaterThan(0);
    for (const suite of SUITES) {
      const owners = GROUPS.filter((group) => group.suites.some((pattern) => new Bun.Glob(pattern).match(suite)));
      expect({ suite, owners: owners.map((group) => group.id) }).toEqual({ suite, owners: [groupOf(suite)] });
    }
  });

  test("a suite whose name matches no group is refused, naming the groups", () => {
    expect(() => groupOf("weather-station.e2e.ts")).toThrow(/weather-station\.e2e\.ts.*kit, find, studio, performance, handover, home, present, shell/s);
  });

  test("every pattern of suites matches a file: no pattern is dead", () => {
    for (const group of GROUPS) {
      for (const pattern of group.suites) {
        expect({ group: group.id, pattern, matches: SUITES.some((suite) => new Bun.Glob(pattern).match(suite)) }).toEqual({
          group: group.id,
          pattern,
          matches: true,
        });
      }
    }
  });

  test("the task and the script of a group carry its name", () => {
    expect(taskOf(GROUPS[0]!)).toBe("//#e2e:kit");
    expect(scriptOf(GROUPS[0]!)).toBe("e2e:kit");
  });

  test("groupById gives the group, or null for a name that is none", () => {
    expect(groupById("kit")?.id).toBe("kit");
    expect(groupById("weather")).toBeNull();
  });

  test("suitesOf lists the group's files of e2e/tests as Playwright takes them, sorted by name", () => {
    const files = ["kit.e2e.ts", "array-lens.e2e.ts", "kit-dialog.e2e.ts", "shell.e2e.ts", "README.md"];
    expect(suitesOf(groupById("kit")!, files)).toEqual(["tests/kit-dialog.e2e.ts", "tests/kit.e2e.ts"]);
    expect(suitesOf(groupById("shell")!, files)).toEqual(["tests/shell.e2e.ts"]);
    expect(suitesOf(groupById("handover")!, files)).toEqual([]);
    expect(suitesOf(groupById("home")!, ["home-open-project.e2e.ts", "home.e2e.ts", "shell.e2e.ts"])).toEqual(["tests/home-open-project.e2e.ts", "tests/home.e2e.ts"]);
  });

  test("suitesOf refuses a suite no group claims, so that a stray file never runs unnoticed", () => {
    expect(() => suitesOf(groupById("kit")!, ["stray.e2e.ts"])).toThrow(/stray\.e2e\.ts belongs to no group/);
  });

  test("a group's inputs are the base, its own suites, then its own inputs", () => {
    const kit = GROUPS[0]!;
    expect(inputsOf(kit)).toEqual([...BASE_INPUTS, "e2e/tests/kit.e2e.ts", "e2e/tests/kit-*.e2e.ts", ...kit.own]);
  });

  test("the own inputs of every group name files, and none the base names too", () => {
    const base = filesMatching(BASE_INPUTS);
    expect(base.size).toBeGreaterThan(100);
    for (const group of GROUPS) {
      const own = filesMatching(ownOf(group));
      expect({ group: group.id, files: own.size > 0 }).toEqual({ group: group.id, files: true });
      expect({ group: group.id, shared: intersection(base, own) }).toEqual({ group: group.id, shared: [] });
    }
  });

  test("a group's suites are inputs of that group alone", () => {
    for (const suite of SUITES) {
      const owner = groupOf(suite);
      const keyedBy = GROUPS.filter((group) => filesMatching(inputsOf(group)).has(`e2e/tests/${suite}`)).map((group) => group.id);
      expect({ suite, keyedBy }).toEqual({ suite, keyedBy: [owner] });
    }
  });

  test("shell's own inputs are the union of the others' folders and the shell's own pictures, shell*.png", () => {
    const shell = GROUPS.find((group) => group.id === "shell")!;
    const others = GROUPS.filter((group) => group.id !== "shell").flatMap(ownOf);
    expect(new Set(shell.own)).toEqual(new Set([...others.filter((pattern) => !isBaselines(pattern)), baselinesOf("shell")]));
    const files = filesMatching(shell.own);
    expect(files.has("e2e/baselines/darwin/desktop/shell-saved-on-this-device.png")).toBe(true);
    expect(files.has("e2e/baselines/darwin/desktop/find.png")).toBe(false);
    expect(files.has("e2e/baselines/darwin/desktop/kit.png")).toBe(false);
  });

  test("a group's own inputs name its pictures by its name, <group>*.png, and no other group's", () => {
    for (const group of GROUPS) {
      expect({ group: group.id, baselines: group.own.filter(isBaselines) }).toEqual({ group: group.id, baselines: [baselinesOf(group.id)] });
    }
  });

  test("every baseline on disk belongs to exactly one group, by the name its file begins with", () => {
    expect(BASELINES.length).toBeGreaterThan(100);
    const ownFiles = new Map(GROUPS.map((group) => [group.id, filesMatching(ownOf(group))]));
    for (const baseline of BASELINES) {
      const owners = GROUPS.filter((group) => ownFiles.get(group.id)!.has(baseline)).map((group) => group.id);
      expect({ baseline, owners }).toEqual({ baseline, owners: [groupOfBaseline(baseline)] });
    }
  });

  test("a baseline whose name begins with no group's is refused, naming the groups", () => {
    expect(() => groupOfBaseline("e2e/baselines/darwin/desktop/weather-station.png")).toThrow(
      /weather-station\.png belongs to no group.*kit, find, studio, performance, handover, home, present, shell/s,
    );
    expect(() => groupOfBaseline("e2e/baselines/darwin/desktop/open-project.png")).toThrow(/open-project\.png belongs to no group/);
    expect(groupOfBaseline("e2e/baselines/darwin/desktop/home-open-project.png")).toBe("home");
    expect(groupOfBaseline("e2e/baselines/darwin/phone/studio-obstacle-handles.png")).toBe("studio");
    expect(groupOfBaseline("e2e/baselines/darwin/tablet/kit-part-2.png")).toBe("kit");
  });

  test("some group sees every file of the web app and of e2e that the browser tests can see", () => {
    const seen = new Set(GROUPS.flatMap((group) => [...filesMatching(inputsOf(group))]));
    // What is left out is what the base leaves out: the build's and turbo's own files, the modules, the suites (each its group's).
    const theWeb = filesMatching(["apps/web/**", "!apps/web/node_modules/**", "!apps/web/.next*/**", "!apps/web/.turbo/**", "!apps/web/*.tsbuildinfo", "!apps/web/next-env.d.ts", "!apps/web/CLAUDE.md"]);
    const theTests = filesMatching(["e2e/**", "!e2e/node_modules/**", "!e2e/.turbo/**", "!e2e/test-results/**", "!e2e/playwright-report/**", "!e2e/tests/**"]);
    for (const file of [...theWeb, ...theTests]) expect({ file, seen: seen.has(file) }).toEqual({ file, seen: true });
  });
});

describe("turbo.json and package.json hold the groups", () => {
  const turbo = JSON.parse(readFileSync(join(REPO_ROOT, "turbo.json"), "utf8")) as { tasks: Record<string, { inputs?: string[]; outputs?: string[] }> };
  const root = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };

  test("turbo.json has a task for each group and no other browser task by group", () => {
    const tasks = Object.keys(turbo.tasks).filter((id) => id.startsWith("//#e2e"));
    expect(tasks).toEqual(GROUPS.map(taskOf));
  });

  test("each task's inputs are the group's, and it has no outputs", () => {
    for (const group of GROUPS) {
      expect(turbo.tasks[taskOf(group)]?.inputs).toEqual(inputsOf(group));
      expect(turbo.tasks[taskOf(group)]?.outputs).toEqual([]);
    }
  });

  test("package.json has a script for each group, running the group's runner, and no other beginning e2e:", () => {
    const scripts = Object.keys(root.scripts).filter((name) => name.startsWith("e2e:"));
    expect(scripts).toEqual(GROUPS.map(scriptOf));
    for (const group of GROUPS) expect(root.scripts[scriptOf(group)]).toBe(`bun tools/e2e-group.ts ${group.id}`);
  });
});
