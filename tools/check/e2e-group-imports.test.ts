import { describe, expect, test } from "bun:test";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT, WEB_DIR } from "../lib/paths.ts";
import { crossingsOf, importsOf, isWalkedOfTheBase, reachableFrom, resolveImport } from "./e2e-group-imports.ts";
import { BASE_INPUTS, GROUPS, inputsOf } from "./e2e-groups.ts";
import { filesMatching } from "./input-files.ts";

describe("importsOf", () => {
  test("every form of import and re-export, with the ones that bring only types marked", () => {
    const source = [
      'import { useId } from "react";',
      'import type { ReactNode } from "react";',
      'import { Icon, type IconSize } from "./Icon";',
      'import { type A, type B } from "./types";',
      'import Default from "@/lib/thing";',
      'import * as all from "../all";',
      'import "./globals.css";',
      'export { energy, specificYield } from "./vitals";',
      'export * from "./everything";',
      'export type { Box } from "./box";',
      'const Scene = dynamic(() => import("@/components/scene/Scene").then((module) => module.Scene), { ssr: false });',
      "import {",
      "  one,",
      "  two,",
      '} from "./several";',
      'export function nothing() { return "from \\"not an import\\""; }',
    ].join("\n");
    expect(importsOf(source)).toEqual([
      { specifier: "react", typeOnly: false },
      { specifier: "react", typeOnly: true },
      { specifier: "./Icon", typeOnly: false },
      { specifier: "./types", typeOnly: true },
      { specifier: "@/lib/thing", typeOnly: false },
      { specifier: "../all", typeOnly: false },
      { specifier: "./globals.css", typeOnly: false },
      { specifier: "./vitals", typeOnly: false },
      { specifier: "./everything", typeOnly: false },
      { specifier: "./box", typeOnly: true },
      { specifier: "@/components/scene/Scene", typeOnly: false },
      { specifier: "./several", typeOnly: false },
    ]);
  });
});

describe("resolveImport", () => {
  const files = new Set(["components/ui/Icon.tsx", "lib/api/index.ts", "lib/routes.ts", "lib/data.json", "components/scene/Scene.tsx"]);
  const isFile = (path: string) => files.has(path);

  test("@/ is the root of the web app; a relative path is from the importing file; .ts, .tsx and index files are tried", () => {
    expect(resolveImport("@/components/ui/Icon", "components/handover/Preview.tsx", isFile)).toBe("components/ui/Icon.tsx");
    expect(resolveImport("./Icon", "components/ui/StatusMark.tsx", isFile)).toBe("components/ui/Icon.tsx");
    expect(resolveImport("../../lib/routes", "components/shell/TabBar.tsx", isFile)).toBe("lib/routes.ts");
    expect(resolveImport("@/lib/api", "components/ApiStatus.tsx", isFile)).toBe("lib/api/index.ts");
    expect(resolveImport("@/lib/data.json", "lib/routes.ts", isFile)).toBe("lib/data.json");
  });

  test("a package, a stylesheet or an asset is not a file of the app: null", () => {
    expect(resolveImport("react", "components/ui/Icon.tsx", isFile)).toBeNull();
    expect(resolveImport("@react-three/fiber", "components/scene/Scene.tsx", isFile)).toBeNull();
    expect(resolveImport("./globals.css", "app/layout.tsx", isFile)).toBeNull();
    expect(resolveImport("maplibre-gl/dist/maplibre-gl.css", "components/find/RoofMap.tsx", isFile)).toBeNull();
    expect(resolveImport("./logo.svg", "components/shell/TopBar.tsx", isFile)).toBeNull();
  });

  test("a path of the app that is no file is an error, not a silent gap", () => {
    expect(() => resolveImport("@/lib/missing", "lib/routes.ts", isFile)).toThrow(/@\/lib\/missing.*lib\/routes\.ts/);
  });
});

describe("reachableFrom", () => {
  test("walks the imports transitively, each file reached with the file that first imported it; the starts are not reached", () => {
    const graph: Record<string, string[]> = { a: ["b", "c"], b: ["c", "d"], c: [], d: ["a"] };
    expect(reachableFrom(["a"], (file) => graph[file] ?? [])).toEqual(new Map([["b", "a"], ["c", "a"], ["d", "b"]]));
    expect(reachableFrom(["a", "b"], (file) => graph[file] ?? [])).toEqual(new Map([["c", "a"], ["d", "b"]]));
  });
});

describe("isWalkedOfTheBase", () => {
  test("a source of the web app is walked; a page, a test, a stylesheet or an asset is not", () => {
    expect(isWalkedOfTheBase("components/shell/Shell.tsx")).toBe(true);
    expect(isWalkedOfTheBase("lib/stores/view-store.ts")).toBe(true);
    expect(isWalkedOfTheBase("app/(workspaces)/studio/[lens]/page.tsx")).toBe(false);
    expect(isWalkedOfTheBase("lib/stores/view-store.test.ts")).toBe(false);
    expect(isWalkedOfTheBase("app/globals.css")).toBe(false);
    expect(isWalkedOfTheBase("public/logo.svg")).toBe(false);
  });
});

describe("crossingsOf", () => {
  test("each import that lands outside, with the file that made it, in the files' order", () => {
    const graph: Record<string, string[]> = { a: ["b", "x"], b: ["y", "c"], c: [] };
    const outside = new Set(["x", "y"]);
    expect(crossingsOf(["a", "b", "c"], (file) => graph[file] ?? [], (file) => outside.has(file))).toEqual([
      { importer: "a", imported: "x" },
      { importer: "b", imported: "y" },
    ]);
  });
});

// The files of the base, an input of every group (BASE_INPUTS), and what a file of the web app imports by value.
const base = filesMatching(BASE_INPUTS, REPO_ROOT);
const isFile = (path: string) => {
  try {
    return statSync(join(WEB_DIR, path)).isFile();
  } catch {
    return false;
  }
};
const valueImportsOf = (file: string): string[] =>
  importsOf(readFileSync(join(WEB_DIR, file), "utf8"))
    .filter((found) => !found.typeOnly)
    .map((found) => resolveImport(found.specifier, file, isFile))
    .filter((resolved): resolved is string => resolved !== null);

describe("what the groups' own folders import", () => {
  // The walk stops at the base, an input of every group; what a file of the base imports is held by the test below.
  const importsOfFile = (file: string): string[] => (base.has(`apps/web/${file}`) ? [] : valueImportsOf(file));

  for (const group of GROUPS) {
    test(`every file the own folders of ${group.id} reach through value imports, up to the base, is an input of ${group.id}`, () => {
      const ownWeb = group.own.filter((pattern) => pattern.startsWith("apps/web/"));
      const starts = [...filesMatching(ownWeb, REPO_ROOT)].filter((file) => /\.tsx?$/.test(file)).map((file) => file.slice("apps/web/".length));
      expect(starts.length).toBeGreaterThan(0);
      const inputs = filesMatching(inputsOf(group), REPO_ROOT);
      const crossings = [...reachableFrom(starts, importsOfFile)]
        .filter(([imported]) => !inputs.has(`apps/web/${imported}`))
        .map(([imported, importer]) => ({ group: group.id, importer: `apps/web/${importer}`, imported: `apps/web/${imported}` }));
      expect(crossings).toEqual([]);
    });
  }
});

describe("what the base imports", () => {
  // A change to a file of the base runs every group, since every group lists the base; a change to a file of a group's
  // own folder runs that group and the groups that cross into it. So a value import from the base into a group's own
  // folder would let a change to that file run its folder's groups alone while every page reaches it through the base,
  // and the walk above could not see it, since it stops at the base. The pages (app/**) are the workspaces' entry points
  // and import their workspace's component; the tests are run by bun and reach no page (plan/phase-11-plan.md, decision 4).
  test("no file of the base, the pages and the tests apart, imports a value from a group's own folder", () => {
    const walked = [...base]
      .filter((file) => file.startsWith("apps/web/"))
      .map((file) => file.slice("apps/web/".length))
      .filter(isWalkedOfTheBase)
      .sort();
    expect(walked.length).toBeGreaterThan(50);
    const ownOfTheGroups = filesMatching(GROUPS.flatMap((group) => group.own.filter((pattern) => pattern.startsWith("apps/web/"))), REPO_ROOT);
    const crossings = crossingsOf(walked, valueImportsOf, (file) => ownOfTheGroups.has(`apps/web/${file}`)).map(({ importer, imported }) => ({
      importer: `apps/web/${importer}`,
      imported: `apps/web/${imported}`,
    }));
    expect(crossings).toEqual([]);
  });
});
