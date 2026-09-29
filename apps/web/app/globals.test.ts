import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { compile } from "tailwindcss";

// The design tokens are written twice: for people in docs/design/design-tokens.md, for the browser in
// globals.css. These tests hold the two equal, and hold that a screen can be built of tokens only.

const DOCUMENT = path.resolve(import.meta.dir, "../../../docs/design/design-tokens.md");
const STYLESHEET = path.resolve(import.meta.dir, "globals.css");

type Tokens = Map<string, string>;

const TYPE_STYLE_COLUMNS = ["--font-family", "--font-weight", "", "--line-height", "--letter-spacing"];

const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();
const inCode = (cell: string) => /^`([^`]+)`$/.exec(cell.trim())?.[1] ?? null;

const isTokenName = (name: string | null): name is string => name !== null && /^--[a-z0-9-]+$/.test(name);

/** The tokens of the document: the rows of every table whose first column is headed "Token". */
function tokensOfDocument(markdown: string): Tokens {
  const tokens: Tokens = new Map();
  let isTokens = false;
  let isTypeStyles = false;
  let isInTable = false;

  for (const line of markdown.split("\n")) {
    if (!line.startsWith("|")) {
      isInTable = false;
      continue;
    }
    const cells = line.split("|").slice(1, -1);
    if (!isInTable) {
      isInTable = true;
      isTokens = cells[0].trim() === "Token";
      isTypeStyles = isTokens && cells[1].trim() === "Family";
      continue;
    }
    if (!isTokens || /^-+$/.test(cells[0].trim())) continue;

    const name = inCode(cells[0]);
    if (!isTokenName(name)) throw new Error(`"${cells[0].trim()}" is in a table of tokens and is not the name of one.`);

    const values = (isTypeStyles ? cells.slice(1, 6) : cells.slice(1, 2)).map(inCode);
    values.forEach((value, column) => {
      if (value === null) throw new Error(`${name}: the value in column ${column + 2} is not in code.`);
      const variable = isTypeStyles ? name + TYPE_STYLE_COLUMNS[column] : name;
      if (tokens.has(variable)) throw new Error(`${variable} is in the document twice.`);
      tokens.set(variable, isTypeStyles && column === 0 ? `var(${value})` : value);
    });
  }
  return tokens;
}

/** The body of the one rule or at-rule that begins with `head`. */
function block(css: string, head: string): string {
  const found = css.split(`\n${head} {\n`);
  if (found.length !== 2) throw new Error(`globals.css must have "${head} {" once, at the start of a line.`);
  return found[1].slice(0, found[1].indexOf("\n}"));
}

function declarations(body: string): Tokens {
  const found: Tokens = new Map();
  for (const [, name, value] of body.matchAll(/(--[\w*-]+):\s*([^;]+);/g)) {
    if (found.has(name)) throw new Error(`${name} is declared twice.`);
    found.set(name, oneLine(value));
  }
  return found;
}

const markdown = readFileSync(DOCUMENT, "utf8");
const css = readFileSync(STYLESHEET, "utf8");

const documented = tokensOfDocument(markdown);
const everyTheme = declarations(block(css, ":root"));
const dusk = declarations(block(css, '[data-theme="dusk"]'));
const declared: Tokens = new Map([...everyTheme, ...dusk]);

const belongsToTheTheme = (name: string) => /^--(color|shadow|halo)-/.test(name);

async function utilitiesOf(classes: string[]): Promise<string> {
  const compiler = await compile(css, {
    base: path.dirname(STYLESHEET),
    loadStylesheet: async (id, base) => {
      const file = Bun.resolveSync(id, base);
      return { path: file, base: path.dirname(file), content: readFileSync(file, "utf8") };
    },
  });
  const built = compiler.build(classes);
  const from = built.indexOf("@layer utilities {");
  return from === -1 ? "" : built.slice(from, built.indexOf("\n}\n", from));
}

describe("the document and the stylesheet", () => {
  test("the document has tokens", () => {
    expect(documented.size).toBeGreaterThan(150);
  });

  test("every token of the document is in the stylesheet, with the same value", () => {
    const different = [...documented]
      .filter(([name, value]) => declared.get(name) !== value)
      .map(([name, value]) => `${name}: document "${value}", stylesheet "${declared.get(name) ?? "nothing"}"`);
    expect(different).toEqual([]);
  });

  test("every variable of the stylesheet is a token of the document", () => {
    const unknown = [...declared.keys()].filter((name) => !documented.has(name));
    expect(unknown).toEqual([]);
  });

  test("colours and shadows belong to the theme, everything else to every theme", () => {
    expect([...everyTheme.keys()].filter(belongsToTheTheme)).toEqual([]);
    expect([...dusk.keys()].filter((name) => !belongsToTheTheme(name))).toEqual([]);
  });
});

describe("the tokens in Tailwind", () => {
  const theme = declarations(block(css, "@theme inline reference"));

  test("Tailwind's own theme is switched off", () => {
    expect(theme.get("--*")).toBe("initial");
    expect(css).not.toMatch(/@import\s+["']tailwindcss["']/);
  });

  test("every entry is a token, by reference; a breakpoint by its value", () => {
    const wrong = [...theme]
      .filter(([name]) => name !== "--*")
      .filter(([name, value]) => {
        if (name.startsWith("--breakpoint-")) return declared.get(name) !== value;
        const token = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
        return token === undefined || !declared.has(token);
      })
      .map(([name, value]) => `${name}: ${value}`);
    expect(wrong).toEqual([]);
  });

  test("every colour, radius, shadow, space and size is a utility", () => {
    const reachable = new Set([...theme.values()].map((value) => /^var\((--[\w-]+)\)$/.exec(value)?.[1]));
    const missing = [...declared.keys()]
      .filter((name) => /^--(color|radius|shadow|halo|space|size|spacing|font)-?/.test(name))
      .filter((name) => !reachable.has(name));
    expect(missing).toEqual([]);
  });

  test("every type style is one utility that sets all of it", async () => {
    const styles = [...documented.keys()].filter((name) => /^--text-[\w-]+--font-family$/.test(name));
    expect(styles.length).toBeGreaterThan(15);

    for (const variable of styles) {
      const token = variable.replace("--font-family", "");
      const utility = token.replace("--text-", "type-");
      const made = await utilitiesOf([utility]);
      expect(made).toContain(`.${utility} {`);
      expect(made).toContain(`font-family: var(${token}--font-family);`);
      expect(made).toContain(`font-weight: var(${token}--font-weight);`);
      expect(made).toContain(`font-size: var(${token});`);
      expect(made).toContain(`line-height: var(${token}--line-height);`);
      expect(made).toContain(`letter-spacing: var(${token}--letter-spacing);`);
    }
  });

  test("a utility made of a token names the token", async () => {
    const made = oneLine(
      await utilitiesOf([
        "bg-ground",
        "text-text-2",
        "border-line",
        "rounded-control",
        "shadow-raised",
        "shadow-halo-focus",
        "gap-row",
        "h-topbar",
        "h-sheet-peek",
        "min-h-touch",
        "p-2",
        "font-medium",
        "font-mono",
        "ease-out",
        "duration-press",
        "z-float",
        "focus-ring",
      ]),
    );

    expect(made).toContain(".bg-ground { background-color: var(--color-ground); }");
    expect(made).toContain(".text-text-2 { color: var(--color-text-2); }");
    expect(made).toContain(".border-line { border-color: var(--color-line); }");
    expect(made).toContain(".rounded-control { border-radius: var(--radius-control); }");
    expect(made).toContain("--tw-shadow: var(--shadow-raised);");
    expect(made).toContain("--tw-shadow: var(--halo-focus);");
    expect(made).toContain(".gap-row { gap: var(--space-row); }");
    expect(made).toContain(".h-topbar { height: var(--size-topbar); }");
    expect(made).toContain(".h-sheet-peek { height: var(--size-sheet-peek); }");
    expect(made).toContain(".min-h-touch { min-height: var(--size-touch); }");
    expect(made).toContain(".p-2 { padding: calc(var(--spacing) * 2); }");
    expect(made).toContain("font-weight: var(--font-weight-medium);");
    expect(made).toContain(".font-mono { font-family: var(--font-mono); }");
    expect(made).toContain("transition-timing-function: var(--ease-out);");
    expect(made).toContain(".duration-press { transition-duration: var(--duration-press); }");
    expect(made).toContain(".z-float { z-index: var(--z-float); }");
    expect(made).toContain(
      '.focus-ring:focus-visible, .focus-ring[data-shown-as="focus"] { outline: var(--ring-focus); outline-offset: var(--ring-focus-offset); }',
    );
  });

  test("the breakpoints are tablet and desktop, at the widths of the document", async () => {
    const made = oneLine(await utilitiesOf(["tablet:hidden", "desktop:hidden", "md:hidden", "lg:hidden"]));

    expect(made).toContain("@media (width >= 640px) { .tablet\\:hidden");
    expect(made).toContain("@media (width >= 1101px) { .desktop\\:hidden");
    expect(made).not.toContain("md\\:hidden");
    expect(made).not.toContain("lg\\:hidden");
  });

  test.each([
    "bg-red-500",
    "text-white",
    "bg-black",
    "text-sm",
    "text-2xl",
    "rounded-lg",
    "shadow-lg",
    "font-bold",
    "tracking-tight",
    "leading-tight",
    "max-w-md",
  ])("%s, which is not made of a token, makes no CSS", async (utility) => {
    expect(await utilitiesOf([utility])).toBe("");
  });
});

describe("states", () => {
  test("hover and pressed can be shown without a pointer, and never on a disabled control", async () => {
    const made = oneLine(await utilitiesOf(["hovered:bg-accent-hover", "pressed:bg-accent-pressed"]));

    const hover = "{ background-color: var(--color-accent-hover); }";
    const pressed = "{ background-color: var(--color-accent-pressed); }";

    expect(made).toContain(`@media (hover: hover) { .hovered\\:bg-accent-hover:hover:not(:disabled) ${hover} }`);
    expect(made).toContain(`.hovered\\:bg-accent-hover[data-shown-as="hover"] ${hover}`);
    expect(made).toContain(`.pressed\\:bg-accent-pressed:active:not(:disabled) ${pressed}`);
    expect(made).toContain(`.pressed\\:bg-accent-pressed[data-shown-as="pressed"] ${pressed}`);
  });

  test("pressed comes after hover, so that it wins", async () => {
    const made = await utilitiesOf(["pressed:bg-accent-pressed", "hovered:bg-accent-hover"]);

    expect(made.indexOf("pressed\\:bg-accent-pressed")).toBeGreaterThan(made.indexOf("hovered\\:bg-accent-hover"));
  });
});

describe("lines", () => {
  test("the width of a line that is not 1 px is a token", async () => {
    const made = oneLine(await utilitiesOf(["border-handle", "border-handle-touch"]));

    expect(made).toContain(".border-handle { border-width: var(--border-handle); }");
    expect(made).toContain(".border-handle-touch { border-width: var(--border-handle-touch); }");
  });
});

describe("numbers of the data", () => {
  test("a place and a width can be a share of the width around, which a component sets", async () => {
    const made = oneLine(await utilitiesOf(["left-at", "w-span", "h-span"]));

    expect(made).toContain(".left-at { left: calc(var(--at) * 100%); }");
    expect(made).toContain(".w-span { width: calc(var(--span) * 100%); }");
    expect(made).toContain(".h-span { height: calc(var(--span) * 100%); }");
  });
});

describe("motion", () => {
  test("a sheet goes to its stop in the time of a panel", async () => {
    const made = oneLine(await utilitiesOf(["sheet-motion"]));

    expect(made).toContain("transition-property: height;");
    expect(made).toContain("transition-duration: var(--duration-panel);");
    expect(made).toContain("transition-timing-function: var(--ease-out);");
  });

  test("a ring turns and a skeleton breathes, in the times of the tokens", async () => {
    const made = oneLine(await utilitiesOf(["turning", "breathing"]));

    expect(made).toContain(".turning { animation: turn var(--duration-spin) linear infinite; }");
    expect(made).toContain(".breathing { animation: breathe var(--duration-breathe) ease-in-out infinite; }");
    expect(oneLine(css)).toContain("@keyframes turn { to { rotate: 360deg; } }");
    expect(oneLine(css)).toContain("@keyframes breathe { 50% { opacity: var(--opacity-updating); } }");
  });

  test("a value that is updated is dimmed by a token", async () => {
    expect(oneLine(await utilitiesOf(["opacity-updating"]))).toContain(".opacity-updating { opacity: var(--opacity-updating); }");
  });

  test("is removed for those who ask for less of it", () => {
    const reduced = oneLine(css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)")));
    expect(reduced).toContain("transition: none !important;");
    expect(reduced).toContain("animation: none !important;");
  });
});
