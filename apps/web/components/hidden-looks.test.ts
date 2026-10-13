import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Glob } from "bun";

// A control whose look sets its own display (Button, ButtonLink, IconButton: `inline-flex`) cannot be hidden by a class it
// is given: Tailwind writes `inline-flex` after `hidden`, so the control shows whatever the order of the classes (the
// phone's top bar showed Docs past its edge, issue 238). Hide what stands around it: `<span className="hidden desktop:contents">`.

const WEB = path.resolve(import.meta.dir, "..");
// An attribute may hold an arrow (`=>`), which is no end of the tag.
const LOOKS = /<(?:Button|ButtonLink|IconButton)\b(?:=>|[^>])*?\bclassName=(?:=>|[^>])*?["\s(]hidden\b/;

function hiddenLooksIn(source: string): string[] {
  return source.split("\n").flatMap((line, index) => (LOOKS.test(line) ? [`line ${index + 1}: ${line.trim()}`] : []));
}

describe("a control with a look of its own is hidden from outside it", () => {
  test("the rule finds a hidden class on the control, and passes one on its wrapper", () => {
    expect(hiddenLooksIn('<ButtonLink kind="quiet" href={home} className="hidden desktop:inline-flex">')).toHaveLength(1);
    expect(hiddenLooksIn('<Button size="s" className={classNames("hidden tablet:inline-flex", className)}>')).toHaveLength(1);
    expect(hiddenLooksIn('<Button size="s" onClick={() => hide(false)} className="hidden desktop:inline-flex">')).toHaveLength(1);
    expect(hiddenLooksIn('<span className="hidden desktop:contents">')).toEqual([]);
    expect(hiddenLooksIn('<Button aria-hidden className="w-full">')).toEqual([]);
  });

  test("no component gives one a hidden class", () => {
    const files = [...new Glob("{components,app}/**/*.tsx").scanSync({ cwd: WEB })].filter((file) => !file.endsWith(".test.tsx"));
    const found = files.flatMap((file) => hiddenLooksIn(readFileSync(path.join(WEB, file), "utf8")).map((where) => `${file}, ${where}`));
    expect(found).toEqual([]);
  });
});
