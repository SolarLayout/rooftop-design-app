"use client";

import { useId } from "react";
import { useProject, useStores } from "@/components/shell/stores";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import type { ChainView } from "@/lib/performance/loss-chain";
import { lossControlOf, withLoss, type LossFieldId } from "@/lib/performance/loss-fields";
import { projectOf } from "@/lib/stores/project-store";
import { LossRow } from "./LossRow";

type Props = {
  view: ChainView;
  /** The figures are of before, and a new run is on its way: they stay, dimmed. */
  isDimmed: boolean;
  /** Back to the eleven plain steps. */
  onBack: () => void;
  className?: string;
};
const SWATCH = "size-2.5 rounded-swatch";

/** Gain, loss, and that the boxed values are the user's to change. */
function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 type-body-touch desktop:type-body text-text-2 tablet:ml-auto">
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
 * All 21 steps (V2 · 8, D104, behind Where the energy goes; the boards "Performance" and "Loss chain, edited";
 * plan/phase-08-plan.md, decisions 3, 6 and 10): the 21 steps of the engine in its order and words, each with its
 * change, its bar on the cascade and its running total; where a step is the user's, its field of the document in
 * the row, Uc on Temperature and the rear side's shading beside the rear gain among them. A value entered is an edit of
 * the document; the run follows.
 */
export function LossChain({ view, isDimmed, onBack, className }: Props) {
  const { project: store } = useStores();
  const project = useProject(projectOf);
  const heading = useId();
  if (!project) return null;

  const field = (id: LossFieldId, value: number | null) => store.getState().commit((document) => withLoss(document, id, value));
  const rearGain = (on: boolean) => store.getState().commit((document) => withLoss(document, "bifacial", on));

  return (
    <section data-testid="loss-chain" aria-labelledby={heading} className={classNames("flex flex-col gap-2 tablet:gap-2.5", className)}>
      <div className="flex flex-col gap-1.5 tablet:flex-row tablet:items-center tablet:gap-4">
        <button type="button" onClick={onBack} className="flex h-touch cursor-pointer items-center gap-1 self-start rounded-control type-strong-touch desktop:h-8 desktop:type-strong text-text-2 hovered:text-text focus-ring">
          <Icon name="chevron-left" size={14} />
          Eleven steps
        </button>
        <h3 id={heading} className="type-body-touch desktop:type-body text-text-2">
          All 21 steps, in the engine&apos;s words
        </h3>
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
