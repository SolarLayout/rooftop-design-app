// What stands beside the search (the boards "UI fixes · My location and Search on every size"): before anything is typed,
// the way to use one's location, in a field and on Home (in Find's column it is a row under the search, V2 · 4); with
// something typed, on Find, the action that searches it (Enter does the same). Home has its own action for words, Find
// my roof; a field of a form has the form's. Pure.

export type SearchLook = "column" | "field" | "hero";
export type Beside = "locate" | "search" | null;

export function besideTheField({ look, typed, found }: { look: SearchLook; typed: string; found: string | null }): Beside {
  if (found !== null) return null;
  if (typed.trim() === "") return look === "column" ? null : "locate";
  return look === "column" ? "search" : null;
}
