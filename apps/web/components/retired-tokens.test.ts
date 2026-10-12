import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// What V2 retired (D94; docs/design/design-tokens.md): the type styles of before, uppercase, the heading's orange and its
// glow, the radii between the four. No component names one of them.

const RETIRED = [
  /(?<![\w-])type-(hero|number-[a-z-]+|unit-hero|page|lens|lens-touch|brand|lead|small|caption|caption-s|value|value-[a-z]+|tick|label-s)(?![\w-])/,
  /(?<![\w-])uppercase(?![\w-])/,
  /(?<![\w-])(text-heading|heading-glow)(?![\w-])/,
  /--(color|shadow)-heading\b/,
  /(?<![\w-])rounded(-[trbl]{1,2})?-(xs|seg|seg-touch|item|chip|card-s|bar)(?![\w-])/,
];

function filesOf(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const file = path.join(folder, name);
    if (statSync(file).isDirectory()) return filesOf(file);
    return /\.tsx?$/.test(name) && !name.endsWith(".test.ts") ? [file] : [];
  });
}

describe("what V2 retired", () => {
  test("no component or page names a retired token", () => {
    const root = path.resolve(import.meta.dir, "..");
    const found = [...filesOf(path.join(root, "components")), ...filesOf(path.join(root, "app"))].flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, at) => RETIRED.filter((rule) => rule.test(line)).map(() => `${path.relative(root, file)}:${at + 1}: ${line.trim().slice(0, 90)}`)),
    );
    expect(found).toEqual([]);
  });
});
