import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { createTour } from "./create-tour";

// Nothing of Present asks the API (plan/phase-10-plan.md, step 20, decision 8): once a design is loaded the tour runs
// from the results kept in the stores, so that it works with the API offline. Held here by reading the code: no fetch
// in Present's own folders, and the files they reach through value imports, up to the shell's shared parts, never
// include the API's client; and by the tour's making, which takes no api.

const WEB = path.resolve(import.meta.dir, "../..");
const OWN = ["components/present", "lib/present"];

/** The shared parts every page uses (tools/check/e2e-groups.ts, BASE_INPUTS): reached, but not walked into. */
const BASE = ["app/", "components/shell/", "components/ui/", "lib/api/", "lib/stores/", "lib/flow/", "lib/format/", "lib/device/"];
const isBase = (file: string) => BASE.some((folder) => file.startsWith(folder)) || /^(components|lib)\/[^/]+\.tsx?$/.test(file);

const isSource = (file: string) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file);

function filesOf(folder: string): string[] {
  return readdirSync(path.join(WEB, folder))
    .filter(isSource)
    .map((file) => `${folder}/${file}`)
    .sort();
}

/** The specifiers a file imports by value: `import type` and `export type` bring no code. */
function valueImportsOf(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(/^(import|export)\s+(type\s+)?[\s\S]*?from\s+["']([^"']+)["']|import\(["']([^"']+)["']\)/gm)) {
    if (match[2]) continue;
    found.push(match[3] ?? match[4]!);
  }
  return found;
}

/** A specifier as a file of the web app; null for a package or an asset. */
function resolveImport(specifier: string, from: string): string | null {
  const bare = specifier.startsWith("@/") ? specifier.slice(2) : specifier.startsWith(".") ? path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier)) : null;
  if (bare === null) return null;
  for (const candidate of [bare, `${bare}.ts`, `${bare}.tsx`, `${bare}/index.ts`]) {
    const full = path.join(WEB, candidate);
    if (existsSync(full) && statSync(full).isFile()) return candidate;
  }
  throw new Error(`${specifier}, imported by ${from}, is no file of the web app.`);
}

/** Every file reached from the starts through value imports, the base reached but not walked into. */
function reachableFrom(starts: string[]): Set<string> {
  const reached = new Set<string>();
  const queue = [...starts];
  while (queue.length > 0) {
    const file = queue.shift()!;
    for (const specifier of valueImportsOf(readFileSync(path.join(WEB, file), "utf8"))) {
      const imported = resolveImport(specifier, file);
      if (imported === null || reached.has(imported) || starts.includes(imported)) continue;
      reached.add(imported);
      if (!isBase(imported)) queue.push(imported);
    }
  }
  return reached;
}

describe("Present's own code", () => {
  const own = OWN.flatMap(filesOf);

  test("is there, in both folders", () => {
    expect(own.some((file) => file.startsWith("components/present/"))).toBe(true);
    expect(own.some((file) => file.startsWith("lib/present/"))).toBe(true);
  });

  test("calls fetch nowhere and imports nothing of the API's client", () => {
    for (const file of own) {
      const source = readFileSync(path.join(WEB, file), "utf8");
      expect({ file, fetches: /\bfetch\s*\(/.test(source) }).toEqual({ file, fetches: false });
      expect({ file, api: valueImportsOf(source).filter((specifier) => /(^|\/)lib\/api(\/|$)|(^|\/)api$/.test(specifier)) }).toEqual({ file, api: [] });
    }
  });

  test("reaches, through value imports up to the shell's shared parts, nothing of the API's client", () => {
    const reached = reachableFrom(own);
    expect(reached.size).toBeGreaterThan(10);
    expect([...reached].filter((file) => file.startsWith("lib/api/"))).toEqual([]);
  });

  test("the ways of valueImportsOf: type imports bring no code, dynamic imports do", () => {
    expect(valueImportsOf(['import type { A } from "./a";', 'import { b, type C } from "./b";', 'export type { D } from "./d";', 'const S = dynamic(() => import("@/components/scene/Scene"));'].join("\n"))).toEqual(["./b", "@/components/scene/Scene"]);
  });
});

describe("the tour's making", () => {
  test("takes the view, the clock, the day's hours and the motion setting, and no api", () => {
    type Options = Parameters<typeof createTour>[0];
    const takesNoApi: "api" extends keyof Options ? false : true = true;
    expect(takesNoApi).toBe(true);
    expect(Object.keys({ view: 0, clock: 0, hoursOf: 0, isReduced: 0 } satisfies Record<keyof Options, 0>).sort()).toEqual(["clock", "hoursOf", "isReduced", "view"]);
  });
});
