import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Glob } from "bun";

// Rule 9 of CLAUDE.md: style only through design tokens. No raw colour, size or shadow in a component.
// Tailwind's own theme is switched off (app/globals.test.ts), which leaves the ways around it below.

const WEB = path.resolve(import.meta.dir, "..");

const RAW: Array<{ what: string; pattern: RegExp }> = [
  { what: "a colour as a number", pattern: /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\(/ },
  { what: "a value in square brackets", pattern: /(?<=[\w-])-\[[^\]]+\]/ },
  { what: "an inline style", pattern: /\bstyle=\{/ },
  { what: "a number where a token belongs", pattern: /(?<![\w-])(?:opacity|z|duration|delay|scale|rotate|blur|brightness)-\d/ },
];

/** What in the source of a component is a raw value, line by line. */
function rawValuesIn(source: string): string[] {
  return source.split("\n").flatMap((line, index) =>
    RAW.filter(({ pattern }) => pattern.test(line)).map(({ what }) => `line ${index + 1}: ${what}: ${line.trim()}`),
  );
}

describe("what counts as a raw value", () => {
  test.each([
    ['<div className="bg-[#FFB020]" />', "a colour as a number"],
    ['<div className="text-accent" style={{ color: "red" }} />', "an inline style"],
    ['<div className="h-[78px]" />', "a value in square brackets"],
    ['<div className="shadow-[0_1px_2px_black]" />', "a value in square brackets"],
    ['<div className="opacity-45" />', "a number where a token belongs"],
    ['<div className="z-10 flex" />', "a number where a token belongs"],
    ['<div className="hover:duration-150" />', "a number where a token belongs"],
    ['const glow = "rgba(255,176,32,.24)";', "a colour as a number"],
  ])("%s", (source, what) => {
    expect(rawValuesIn(source).join("\n")).toContain(what);
  });

  test.each([
    '<div className="bg-accent text-accent-ink shadow-primary rounded-control" />',
    '<div className="h-10 gap-2 px-3.5 size-9.5" />',
    '<div className="h-(--size-vitals) text-(length:--text-title)" />',
    '<div className="disabled:opacity-disabled z-float duration-press" />',
    '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 19h16" />',
    "const [first] = items[0];",
  ])("%s is made of tokens", (source) => {
    expect(rawValuesIn(source)).toEqual([]);
  });
});

test("no component and no page carries a raw value", () => {
  const files = [...new Glob("{app,components}/**/*.tsx").scanSync(WEB)].sort();
  expect(files.length).toBeGreaterThan(5);

  const found = files.flatMap((file) =>
    rawValuesIn(readFileSync(path.join(WEB, file), "utf8")).map((raw) => `${file}, ${raw}`),
  );
  expect(found).toEqual([]);
});
