// What the web app's files import, for the test that a group's own folders reach nothing outside the group's
// inputs: an import that crosses into another group's folder changes a screen the group pictures without
// running the group. Pure: the sources and the file system come in as functions.

import { dirname, posix } from "node:path";

export type Import = { specifier: string; typeOnly: boolean };

const STATEMENTS: { pattern: RegExp; read: (match: RegExpExecArray) => Import }[] = [
  // import type { A } from "x"; import type A from "x"
  { pattern: /^[ \t]*import[ \t]+type[ \t]+[^;]*?[ \t]from[ \t]*["']([^"']+)["']/gm, read: (match) => ({ specifier: match[1]!, typeOnly: true }) },
  // import { a, type B } from "x"; import a from "x"; import * as a from "x"; import a, { b } from "x"
  {
    pattern: /^[ \t]*import[ \t]*(?!type[ \t])(\{[^}]*\}|\*[ \t]+as[ \t]+\w+|\w+(?:[ \t]*,[ \t]*\{[^}]*\})?)[ \t]*from[ \t]*["']([^"']+)["']/gm,
    read: (match) => ({ specifier: match[2]!, typeOnly: onlyTypes(match[1]!) }),
  },
  // import "x"
  { pattern: /^[ \t]*import[ \t]*["']([^"']+)["']/gm, read: (match) => ({ specifier: match[1]!, typeOnly: false }) },
  // export { a } from "x"; export * from "x"; export type { A } from "x"
  {
    pattern: /^[ \t]*export[ \t]+(type[ \t]+)?(?:\*(?:[ \t]+as[ \t]+\w+)?|\{[^}]*\})[ \t]*from[ \t]*["']([^"']+)["']/gm,
    read: (match) => ({ specifier: match[2]!, typeOnly: Boolean(match[1]) }),
  },
  // import("x")
  { pattern: /\bimport\([ \t]*["']([^"']+)["'][ \t]*\)/g, read: (match) => ({ specifier: match[1]!, typeOnly: false }) },
];

/** `{ type A, type B }`: every specifier is a type, so nothing of the module reaches the page. */
function onlyTypes(clause: string): boolean {
  if (!clause.startsWith("{")) return false;
  const specifiers = clause.slice(1, -1).split(",").map((specifier) => specifier.trim()).filter(Boolean);
  return specifiers.length > 0 && specifiers.every((specifier) => /^type[ \t]/.test(specifier));
}

/** The imports and re-exports of a source, in the order they appear. */
export function importsOf(source: string): Import[] {
  const found: { index: number; found: Import }[] = [];
  for (const { pattern, read } of STATEMENTS) {
    for (const match of source.matchAll(pattern)) found.push({ index: match.index, found: read(match as RegExpExecArray) });
  }
  return found.sort((a, b) => a.index - b.index).map((entry) => entry.found);
}

const NOT_CODE = /\.(css|scss|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|otf)$/;

/**
 * The file of the web app a specifier names, relative to the app's root (`@/` is the root, `.` the importing
 * file's directory; `.ts`, `.tsx` and index files are tried). Null for a package, a stylesheet or an asset.
 * A path of the app that names no file is an error: a gap in the walk must never be silent.
 */
export function resolveImport(specifier: string, fromFile: string, isFile: (path: string) => boolean): string | null {
  if (NOT_CODE.test(specifier)) return null;
  let base: string;
  if (specifier.startsWith("@/")) base = posix.normalize(specifier.slice(2));
  else if (specifier.startsWith(".")) base = posix.normalize(posix.join(dirname(fromFile), specifier));
  else return null;
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`];
  const file = candidates.find(isFile);
  if (!file) throw new Error(`The import "${specifier}" in ${fromFile} names no file of the web app (tried ${candidates.join(", ")}).`);
  return file;
}

/** Every file reached from the starts through imports, each with the file that first imported it. The starts are not reached. */
export function reachableFrom(starts: string[], importsOfFile: (file: string) => string[]): Map<string, string> {
  const reached = new Map<string, string>();
  const seen = new Set(starts);
  const queue = [...starts];
  for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
    for (const imported of importsOfFile(file)) {
      if (seen.has(imported)) continue;
      seen.add(imported);
      reached.set(imported, file);
      queue.push(imported);
    }
  }
  return reached;
}
