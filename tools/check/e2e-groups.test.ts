import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { E2E_DIR, REPO_ROOT } from "../lib/paths.ts";
import { BASE_INPUTS, GROUPS, groupOf, inputsOf, scriptOf, taskOf, type Group } from "./e2e-groups.ts";

const SUITES = readdirSync(join(E2E_DIR, "tests")).filter((name) => name.endsWith(".e2e.ts"));

const ownOf = (group: Group) => group.own;

/**
 * The files of the tree a list of turbo input globs names: the positive patterns scanned, the files any
 * negative pattern matches taken out. Dotfiles count, as they do for turbo.
 */
function filesMatching(patterns: string[]): Set<string> {
  const positive = patterns.filter((pattern) => !pattern.startsWith("!"));
  const negative = patterns.filter((pattern) => pattern.startsWith("!")).map((pattern) => new Bun.Glob(pattern.slice(1)));
  const files = new Set<string>();
  for (const pattern of positive) {
    for (const file of new Bun.Glob(pattern).scanSync({ cwd: REPO_ROOT, dot: true, onlyFiles: true })) {
      if (!negative.some((glob) => glob.match(file))) files.add(file);
    }
  }
  return files;
}

const intersection = <T>(a: Set<T>, b: Set<T>) => [...a].filter((item) => b.has(item));

describe("the groups of the browser tests", () => {
  test("there are six, in the order the check runs them", () => {
    expect(GROUPS.map((group) => group.id)).toEqual(["kit", "find", "studio", "performance", "handover", "shell"]);
  });

  test("every suite in e2e/tests belongs to exactly one group, by its name", () => {
    expect(SUITES.length).toBeGreaterThan(0);
    for (const suite of SUITES) {
      const owners = GROUPS.filter((group) => group.suites.some((pattern) => new Bun.Glob(pattern).match(suite)));
      expect({ suite, owners: owners.map((group) => group.id) }).toEqual({ suite, owners: [groupOf(suite)] });
    }
  });

  test("a suite whose name matches no group is refused, naming the groups", () => {
    expect(() => groupOf("weather-station.e2e.ts")).toThrow(/weather-station\.e2e\.ts.*kit, find, studio, performance, handover, shell/s);
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

  test("shell's own inputs are the union of the others' and every baseline", () => {
    const shell = GROUPS.find((group) => group.id === "shell")!;
    const others = GROUPS.filter((group) => group.id !== "shell").flatMap(ownOf);
    expect(new Set(shell.own)).toEqual(new Set([...others, "e2e/baselines/*/*/*.png"]));
  });

  test("shell sees every file of the web app and of e2e that the browser tests can see", () => {
    const shell = GROUPS.find((group) => group.id === "shell")!;
    const seen = filesMatching(inputsOf(shell));
    const theWeb = filesMatching(["apps/web/**", "!apps/web/node_modules/**", "!apps/web/.next*/**", "!apps/web/*.tsbuildinfo", "!apps/web/next-env.d.ts", "!apps/web/CLAUDE.md"]);
    const theTests = filesMatching(["e2e/**", "!e2e/node_modules/**", "!e2e/test-results/**", "!e2e/playwright-report/**", "!e2e/tests/**"]);
    for (const file of [...theWeb, ...theTests]) expect({ file, seen: seen.has(file) }).toEqual({ file, seen: true });
  });
});

describe("turbo.json and package.json hold the groups", () => {
  const turbo = JSON.parse(readFileSync(join(REPO_ROOT, "turbo.json"), "utf8")) as { tasks: Record<string, { inputs?: string[]; outputs?: string[] }> };
  const root = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };

  test("turbo.json has a task for each group and no other browser task by group", () => {
    const tasks = Object.keys(turbo.tasks).filter((id) => id.startsWith("//#e2e:"));
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
