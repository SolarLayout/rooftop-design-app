// What the voice forbids in a word the user meets (plan/v2/voice.md §6, §7; V2 · 12, D108): the words that never appear,
// the old names of board 12, and "(s)". The strings of a source file are found as a person reads them: the quoted literals
// and the text between tags, comments left out. Pure: the scan of the repository is words.test.ts.

/** The words that never appear (§6), whole words, any case. */
export const NEVER_WORDS = [
  "bankable", "engine", "simply", "just", "please", "easy", "powerful", "seamless", "smart", "intelligent", "magic", "beautiful",
  "oops", "sorry", "great", "awesome", "enjoy", "journey", "experience", "leverage", "utilise", "robust", "feel free", "note that",
  "in order to", "as well as", "a number of", "and more",
] as const;

/** The old names of board 12 (§6, "Not"), as they were written. */
export const OLD_NAMES = [
  "Enter dimensions by hand", "Entered by hand", "Specific yield", "Not kept", "of the design before", "Shade-free window", "Reference day",
  "Edge wall", "design run", "the simulation", "Exceedance", "P-values", "Copy as table", "Save a copy",
] as const;

export type Finding = { said: string; why: string };

const escaped = (words: string) => words.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** What the voice finds against one string the user reads. */
export function findingsOf(said: string): Finding[] {
  const found: Finding[] = [];
  for (const word of NEVER_WORDS) if (new RegExp(`\\b${escaped(word)}\\b`, "i").test(said)) found.push({ said, why: `never "${word}"` });
  for (const name of OLD_NAMES) if (new RegExp(`\\b${escaped(name)}\\b`).test(said)) found.push({ said, why: `the old name "${name}"` });
  if (said.includes("(s)")) found.push({ said, why: 'no "(s)": say the count' });
  return found;
}

/** The strings of a source as a person reads them: quoted literals and the text between tags, comments left out, words alone. */
export function stringsOf(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
  const found: string[] = [];
  for (const match of code.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)) found.push(match[1] ?? match[2] ?? match[3] ?? "");
  for (const match of code.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)) found.push(match[1]!.replace(/\s+/g, " ").trim());
  // Words, not code: two words at least, or a "(s)".
  return found.filter((said) => /[A-Za-z]{2,}\s+[A-Za-z]/.test(said) || said.includes("(s)"));
}
