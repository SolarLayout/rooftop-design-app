"use client";

import { Select } from "@/components/ui/Select";
import { useSize } from "@/components/shell/use-screen-size";
import { optionWordsOf, type OptionItem } from "@/lib/performance/header";

type Props = {
  items: readonly OptionItem[];
  /** The key of the chosen option. */
  chosen: string;
  onChoose: (key: string) => void;
};

/**
 * The stringing option beside the lead (V2 · 8, D104; plan/phase-08-plan.md, decision 4): a select under its label, each
 * option by its letter and caption with the mark of its verdict; on phone the trigger says the chosen one's letter alone.
 * A press chooses at once, from the run's answer.
 */
export function OptionSwitch({ items, chosen, onChoose }: Props) {
  const size = useSize();
  if (size === null) return null;
  const options = items.map((item) => ({ value: item.key, label: optionWordsOf(item, false), mark: item.mark }));
  const taken = items.find((item) => item.key === chosen);
  return (
    <div data-testid="option-switch" className="contents">
      <Select
        label="Option"
        labelAbove
        options={options}
        value={chosen}
        valueShown={taken ? optionWordsOf(taken, size === "phone") : undefined}
        onChange={onChoose}
        className="w-full desktop:w-50"
      />
    </div>
  );
}
