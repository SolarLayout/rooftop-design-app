"use client";

import { useId } from "react";
import { useProject, useStores } from "@/components/shell/stores";
import { classNames } from "@/components/ui/class-names";
import type { ChainView } from "@/lib/performance/loss-chain";
import { lossControlOf, withLoss, type LossFieldId } from "@/lib/performance/loss-fields";
import { projectOf } from "@/lib/stores/project-store";
import { LossRow } from "./LossRow";

type Props = {
  view: ChainView;
  /** The figures are of before, and a new run is on its way: they stay, dimmed. */
  isDimmed: boolean;
  className?: string;
};

const CARD = "flex flex-col gap-2 rounded-card border border-line bg-surface-1 p-4 shadow-card tablet:gap-2.5 tablet:px-6 tablet:py-5.5";
const SWATCH = "size-2.5 rounded-swatch";

/** Gain, loss, and that the boxed values are the user's to change. */
function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 type-caption text-text-2 tablet:ml-auto">
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className={classNames(SWATCH, "bg-data-gain")} />
        Gain
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className={classNames(SWATCH, "bg-data-loss")} />
        Loss
      </li>
      <li>Boxed values are yours to change</li>
    </ul>
  );
}

/**
 * The chain "From sunlight to the grid" (the board "Performance" on three sizes and "Loss chain, edited";
 * plan/phase-08-plan.md, decisions 3, 6 and 10): the 21 steps of the engine in its order and words, each with its
 * change, its bar on the cascade and its running total; where a step is the user's, its field of the document in
 * the row. A value entered is an edit of the document; the run follows.
 */
export function LossChain({ view, isDimmed, className }: Props) {
  const { project: store } = useStores();
  const project = useProject(projectOf);
  const heading = useId();
  if (!project) return null;

  const field = (id: LossFieldId, value: number | null) => store.getState().commit((document) => withLoss(document, id, value));
  const rearGain = (on: boolean) => store.getState().commit((document) => withLoss(document, "bifacial", on));

  return (
    <section data-testid="loss-chain" aria-labelledby={heading} className={classNames(CARD, className)}>
      <div className="flex flex-col gap-1.5 tablet:flex-row tablet:items-center tablet:gap-4">
        <h2 id={heading} className="type-title">
          From sunlight to the grid
        </h2>
        <Legend />
      </div>
      <div className="flex flex-col">
        {view.rows.map((row) => (
          <LossRow key={row.label} row={row} control={lossControlOf(row.label, project, view.run)} isDimmed={isDimmed} onField={field} onSwitch={rearGain} />
        ))}
      </div>
    </section>
  );
}
