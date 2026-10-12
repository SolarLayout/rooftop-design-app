// The words of Change on the module card and the inverter card (D75; the boards "UI fixes · Where the picker opens").
import { shown } from "../../components/ui/number-entry";
import type { Kind } from "./catalog";

const OF: Record<Kind, { many: string; one: string; file: string }> = {
  modules: { many: "modules", one: "a module", file: "a module file (PAN)" },
  inverters: { many: "inverters", one: "an inverter", file: "an inverter file (OND)" },
};

/** What Change does, in its tooltip; *count* is the library's, null while the catalog is not in. */
export function changeWords(kind: Kind, count: number | null): string {
  const words = OF[kind];
  return count === null ? `Choose ${words.one}, or use ${words.file}` : `Choose from ${shown(count, 0)} ${words.many}, or use ${words.file}`;
}
