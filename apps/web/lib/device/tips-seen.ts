// The line on Find's map gone for good on this device (V2 · 4; before it the tips of D79): one key of localStorage, the
// ids of what is gone. An id of before ("obstacle") is left out. A per-viewer convenience: a storage that refuses (a
// private window, a quota) only means the line shows again.
import type { TipId } from "../outline/tips";

export const TIPS_KEY = "rooftop.tips-gone";

const TIP_IDS: readonly TipId[] = ["roof"];
const isTipId = (value: unknown): value is TipId => TIP_IDS.includes(value as TipId);

/** The tips gone for good, as the device remembers them; none when it remembers none or refuses. */
export function tipsGoneOf(storage: Pick<Storage, "getItem">): ReadonlySet<TipId> {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(TIPS_KEY) ?? "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter(isTipId) : []);
  } catch {
    return new Set();
  }
}

/** Remembers the tips gone for good; none forgets them all, so that they show again. */
export function rememberTipsGone(storage: Pick<Storage, "setItem" | "removeItem">, gone: ReadonlySet<TipId>): void {
  try {
    if (gone.size === 0) storage.removeItem(TIPS_KEY);
    else storage.setItem(TIPS_KEY, JSON.stringify([...gone]));
  } catch {
    // The storage refuses: the tips show again next time, and nothing else is the worse for it.
  }
}
