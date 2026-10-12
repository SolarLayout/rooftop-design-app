"use client";

import { NumberField } from "@/components/ui/NumberField";
import { Switch } from "@/components/ui/Switch";
import { edgeNamesOf, measurementsOf, type OutlineEvent, type OutlineState } from "@/lib/outline/outline-state";

type Props = {
  state: OutlineState;
  on: (event: OutlineEvent) => void;
};

/** Lengths on the map: one decimal (docs/design/guidelines.md, "Lengths"). */
const LENGTH = { min: 0.1, max: 2000, decimals: 1 };

/** The edges of the closed outline as fields, to type a length that was measured, and Square the corners (the board "Find and outline"). */
export function OutlinePanel({ state, on }: Props) {
  const measured = measurementsOf(state, (state.frame?.centre.lat ?? 0) >= 0 ? "north" : "south");
  const names = edgeNamesOf(state);
  return (
    <div className="flex flex-col gap-row">
      <div className="grid grid-cols-2 gap-field">
        {measured.edges.map((length, edge) => (
          <NumberField
            key={`${names[edge]}-${measured.edges.length}`}
            label={names[edge]}
            value={length}
            unit="m"
            range={LENGTH}
            labelInside
            onCommit={(typed) => on({ type: "edgeLength", edge, length: typed })}
          />
        ))}
      </div>
      <div className="flex min-h-11 items-center gap-3">
        <span className="flex grow flex-col gap-0.5">
          <span id="square-the-corners">Square the corners</span>
          <span className="type-body-touch text-text-3 desktop:type-body">Snaps to 90° when you are within 3°</span>
        </span>
        <Switch label="Square the corners" on={state.squared} onChange={(squared) => on({ type: "squared", squared })} />
      </div>
    </div>
  );
}
