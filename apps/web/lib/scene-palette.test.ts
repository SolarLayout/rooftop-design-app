import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PALETTE } from "./scene-palette";

// The 3D palette is written twice, as the tokens are: for people in the document, for three.js in
// scene-palette.ts. This holds the two equal.

const DOCUMENT = path.resolve(import.meta.dir, "../../../docs/design/design-tokens.md");

function paletteOfDocument(): Record<string, string> {
  const markdown = readFileSync(DOCUMENT, "utf8");
  const section = markdown.slice(markdown.indexOf("## 3D scene palette")).split("\n## ")[0] ?? "";
  const rows = [...section.matchAll(/^\| `([a-zA-Z]+)` \| `(#[0-9A-F]{6}(?:[0-9A-F]{2})?)` \|/gm)];
  return Object.fromEntries(rows.map(([, name, value]) => [name, value]));
}

test("the palette of the scene is that of the document, and no other", () => {
  const documented = paletteOfDocument();

  expect(Object.keys(documented).length).toBeGreaterThan(20);
  expect<Record<string, string>>({ ...PALETTE }).toEqual(documented);
});
