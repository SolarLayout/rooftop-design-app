import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import * as numbers from "./design-numbers";

// The numbers that code needs are written twice, as the tokens are: for people in the document, for
// the code in design-numbers.ts.

const DOCUMENT = path.resolve(import.meta.dir, "../../../../docs/design/design-tokens.md");

function numbersOfDocument(): Record<string, number> {
  const markdown = readFileSync(DOCUMENT, "utf8");
  const section = markdown.slice(markdown.indexOf("## Numbers in code")).split("\n## ")[0] ?? "";
  const rows = [...section.matchAll(/^\| `([A-Z_]+)` \| `(\d+)` \|/gm)];
  return Object.fromEntries(rows.map(([, name, value]) => [name, Number(value)]));
}

test("the numbers in code are those of the document, and no others", () => {
  const documented = numbersOfDocument();

  expect(Object.keys(documented).length).toBeGreaterThan(0);
  expect<Record<string, number>>({ ...numbers }).toEqual(documented);
});
