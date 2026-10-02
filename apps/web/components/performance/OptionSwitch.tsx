"use client";

import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { useSize } from "@/components/studio/use-size";
import type { OptionItem } from "@/lib/performance/header";

type Props = {
  items: readonly OptionItem[];
  /** The key of the chosen option. */
  chosen: string;
  onChoose: (key: string) => void;
};

const wordsOf = (item: OptionItem) => (item.caption === "" ? item.letter : `${item.letter} · ${item.caption}`);

/**
 * The stringing options of the run (the board "Performance"; plan/phase-08-plan.md, decision 4): on tablet and
 * desktop a segmented control of the letters, the chosen one with its caption, each with the mark of its verdict;
 * on phone a select whose trigger says the chosen one. A press chooses at once, from the run's answer.
 */
export function OptionSwitch({ items, chosen, onChoose }: Props) {
  const size = useSize();
  if (size === null) return null;
  if (size === "phone") {
    const options = items.map((item) => ({ value: item.key, label: wordsOf(item), mark: item.mark }));
    return (
      <div data-testid="option-switch" className="contents">
        <Select label="Option" options={options} value={chosen} onChange={onChoose} className="w-full" />
      </div>
    );
  }
  const options = items.map((item) => ({ value: item.key, label: item.label, name: item.name, mark: item.mark }));
  return (
    <div data-testid="option-switch" className="contents">
      <Segmented label="Stringing option" options={options} value={chosen} onChange={onChoose} />
    </div>
  );
}
