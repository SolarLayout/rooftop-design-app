import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Glob } from "bun";
import { findingsOf, stringsOf } from "@/lib/words/voice-scan";

// One name per thing on every screen (V2 · 12, D108; plan/v2/voice.md §6, §7): no word that never appears, no old name of
// board 12, no "(s)", in any string of a page, a component or the logic that words what they show. The help's topics are
// rewritten with V2 · 11 (#219); the docs' headings are the docs site's own.

const WEB = path.resolve(import.meta.dir, "..");

/** Files whose strings are not the app's words on a screen, each with why. */
const LEFT_OUT: Readonly<Record<string, string>> = {
  "lib/help/manifest.gen.ts": "written from the help's topics, which V2 · 11 (#219) rewrites",
  "lib/docs/docs.ts": "the headings of the docs site, another repository's words",
  "lib/words/voice-scan.ts": "the scan itself names the words it forbids",
};

const isLeftOut = (file: string) => /\.test\.tsx?$|test-fixtures\.ts$|^components\/kit\/|^app\/kit\//.test(file) || file in LEFT_OUT;

test("no page, component or wording logic says a word the voice forbids", () => {
  const files = [...new Glob("{app,components,lib}/**/*.{ts,tsx}").scanSync(WEB)].filter((file) => !isLeftOut(file)).sort();
  const found = files.flatMap((file) => stringsOf(readFileSync(path.join(WEB, file), "utf8")).flatMap((said) => findingsOf(said).map(({ why }) => `${file}: ${why}: ${said.slice(0, 100)}`)));
  expect(found).toEqual([]);
});

describe("what is left out", () => {
  test("each file named is there", () => {
    for (const file of Object.keys(LEFT_OUT)) expect([file, readFileSync(path.join(WEB, file), "utf8").length > 0]).toEqual([file, true]);
  });
});
