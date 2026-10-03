// The id of the design that is open, across a reload (plan/phase-10-plan.md, decision 2): one key of localStorage, the
// id alone, never the design. A design not kept leaves nothing there. A storage that refuses (a private window, a
// quota) cannot be acted on and is no fault of the design: the id is then simply not remembered.

export const OPEN_DESIGN_KEY = "rooftop.open-design";

/** The id remembered as open; null when none is. */
export function rememberedOf(storage: Pick<Storage, "getItem">): string | null {
  try {
    const id = storage.getItem(OPEN_DESIGN_KEY);
    return id === null || id === "" ? null : id;
  } catch {
    return null;
  }
}

/** What remembers an id in *storage*, for the saving store; null forgets. */
export function rememberIn(storage: Pick<Storage, "setItem" | "removeItem">): (id: string | null) => void {
  return (id) => {
    try {
      if (id === null) storage.removeItem(OPEN_DESIGN_KEY);
      else storage.setItem(OPEN_DESIGN_KEY, id);
    } catch {
      // The storage refuses: the id is not remembered, and the design is kept all the same.
    }
  };
}
