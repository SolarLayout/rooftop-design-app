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
  const rows = [...section.matchAll(/^\| `([a-zA-Z][a-zA-Z0-9]*)` \| `(#[0-9A-F]{6}(?:[0-9A-F]{2})?)` \|/gm)];
  return Object.fromEntries(rows.map(([, name, value]) => [name, value]));
}

test("the palette of the scene is that of the document, and no other", () => {
  const documented = paletteOfDocument();

  expect(Object.keys(documented).length).toBeGreaterThan(20);
  expect<Record<string, string>>({ ...PALETTE }).toEqual(documented);
});

const STYLESHEET = path.resolve(import.meta.dir, "../app/globals.css");

// The sun's marker is DOM over the stage (plan/phase-06-plan.md, decision 10), drawn with CSS tokens: they
// are the palette's sun and its core, so that the marker and the arc in the scene are one colour.
test("the marker's tokens are the palette's sun and its core", () => {
  const css = readFileSync(STYLESHEET, "utf8");
  const tokenOf = (name: string) => css.match(new RegExp(`^\\s*--color-${name}: (#[0-9A-F]{6});`, "m"))?.[1];

  expect(tokenOf("accent")).toBe(PALETTE.sun);
  expect(tokenOf("sun-core")).toBe(PALETTE.sunCore);
});

// The strings take the series colours on the roof (plan/phase-07-plan.md, decision 12) and the legend over the
// stage draws its swatches with the CSS tokens: the two are one colour, the positions not used too, and the
// inverter's box is the accent.
test("the strings' colours are the series tokens, the unused grey and the inverter's box the accent", () => {
  const css = readFileSync(STYLESHEET, "utf8");
  const tokenOf = (name: string) => css.match(new RegExp(`^\\s*--color-${name}: (#[0-9A-F]{6});`, "m"))?.[1];

  expect([PALETTE.series1, PALETTE.series2, PALETTE.series3, PALETTE.series4, PALETTE.series5, PALETTE.series6]).toEqual(
    [1, 2, 3, 4, 5, 6].map((n) => tokenOf(`series-${n}`) as "#3987E5"),
  );
  expect(tokenOf("series-unused")).toBe(PALETTE.moduleUnused);
  expect(tokenOf("accent")).toBe(PALETTE.inverterMarker);
});
