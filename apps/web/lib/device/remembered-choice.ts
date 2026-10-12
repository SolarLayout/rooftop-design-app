// A choice of a view the user left on this device, by its key (V2 · 8: the tab of Performance opened last): one of the
// choices given, else the first. A per-viewer convenience in localStorage: a storage that refuses (a private window, a
// quota) only means the first is shown again.

export function choiceOf<Choice extends string>(storage: Pick<Storage, "getItem">, key: string, choices: readonly [Choice, ...Choice[]]): Choice {
  try {
    const left: unknown = JSON.parse(storage.getItem(key) ?? "null");
    return choices.find((choice) => choice === left) ?? choices[0];
  } catch {
    return choices[0];
  }
}

export function rememberChoice(storage: Pick<Storage, "setItem">, key: string, choice: string): void {
  try {
    storage.setItem(key, JSON.stringify(choice));
  } catch {
    // The storage refuses: the first is shown next time, and nothing else is the worse for it.
  }
}
