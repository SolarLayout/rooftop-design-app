"use client";

import { Fragment, useId } from "react";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { NumberField } from "@/components/ui/NumberField";
import type { Assumption, AssumptionField as Field, AssumptionId, LevelsField } from "@/lib/performance/assumption-fields";
import { CHART_CARD, CHART_TITLE } from "./chart-card";

type Props = {
  assumptions: Assumption[];
  /** Hears an assumption committed, or Uc given back to the roof type's (null): an edit of the document, which the run follows. */
  onField: (id: AssumptionId, value: number | null) => void;
  /** Hears a level committed in one of the three fields. */
  onLevel: (index: number, value: number) => void;
  className?: string;
};

const TITLE = "Assumptions";

// Phone: a row of 52 at least, the label with its caption at the left, the field at the right; what the field says on a
// line of its own under them. From tablet on: a chip of 44 (34 on desktop), raised, the label then the field in a row.
const CHIP = classNames(
  "flex min-h-13 flex-wrap items-center justify-between gap-x-3",
  "tablet:min-h-11 tablet:justify-start tablet:gap-x-2 tablet:rounded-control tablet:border tablet:border-line-strong tablet:bg-control tablet:pr-1.5 tablet:pl-3 tablet:shadow-raised",
  "desktop:min-h-8.5 type-body-touch desktop:type-body",
);
const CAPTION = "type-body-touch desktop:type-body text-text-3 tablet:order-3";
// On phone the label takes what the field leaves and wraps inside it ("Rear shading and / mismatch", the board "Weather and
// assumptions"), so that the field stays on its row; what the field says alone drops under them. From tablet on the label
// is one word run in the chip.
const LABEL_COLUMN = "flex min-w-0 grow basis-0 flex-col gap-0.5 tablet:contents";
const LEVELS_LABEL = "min-w-0 grow basis-0 text-text-2 tablet:grow-0 tablet:basis-auto";

/** The width of a well, by what it holds: the board's 84 for Uc with its unit, 64 for a percent, 60 for the albedo, 104 for t/MWh, 40 for a level. */
const WIDTH: Record<AssumptionId, string> = {
  uc: "w-33 tablet:w-21",
  rear_loss_pct: "w-33 tablet:w-16",
  albedo: "w-33 tablet:w-15",
  weather_sigma_pct: "w-33 tablet:w-16",
  model_sigma_pct: "w-33 tablet:w-16",
  co2_t_per_mwh: "w-37 tablet:w-26",
};
const LEVEL_WIDTH = "w-13 tablet:w-10";

function FieldChip({ field, onField }: { field: Field; onField: Props["onField"] }) {
  return (
    <div data-testid="assumption" data-assumption={field.id} className={CHIP}>
      <div className={LABEL_COLUMN}>
        <span className="text-text-2">{field.label}</span>
        {field.detail ? <span className={CAPTION}>{field.detail}</span> : null}
        {field.reset ? (
          <Button kind="quiet" size="xs" className="self-start tablet:order-4" onClick={() => onField(field.id, null)}>
            {field.reset}
          </Button>
        ) : null}
      </div>
      <NumberField
        form="chip"
        label={field.label}
        value={field.value}
        unit={field.unit ?? undefined}
        range={field.range}
        onCommit={(entered) => onField(field.id, entered)}
        className={classNames(WIDTH[field.id], "tablet:order-2")}
      />
    </div>
  );
}

function LevelsChip({ field, onLevel }: { field: LevelsField; onLevel: Props["onLevel"] }) {
  return (
    <div data-testid="assumption" data-assumption="p_levels" className={CHIP}>
      <span className={LEVELS_LABEL}>{field.label}</span>
      {/* The three fields in one wrapping row, so that what a field says can take a line of its own under them. */}
      <span className="flex flex-wrap items-center gap-x-0.5">
        {field.levels.map((level, index) => (
          <Fragment key={index}>
            {index > 0 ? <span className="mx-1 text-text-3">·</span> : null}
            <span className="type-mono-touch text-text-2 desktop:type-mono">P</span>
            <NumberField form="chip" label={`Exceedance level ${index + 1}`} value={level} range={field.range} onCommit={(entered) => onLevel(index, entered)} className={LEVEL_WIDTH} />
          </Fragment>
        ))}
      </span>
    </div>
  );
}

/**
 * The assumptions of the run (the boards "Performance" and "Weather and assumptions"; plan/phase-08-plan.md, decisions
 * 6 and 8; components.md, "Assumptions"): every assumption a field in a chip, rows on phone. Uc is empty while the roof
 * type's holds and says it; entered, a quiet press gives it back. The levels are three fields; committed, they are
 * sorted and each kept once. The card stands before a system voltage too: the assumptions are inputs (decision 15).
 */
export function Assumptions({ assumptions, onField, onLevel, className }: Props) {
  const heading = useId();
  return (
    <section data-testid="assumptions" aria-labelledby={heading} className={classNames(CHART_CARD, "gap-1.5 tablet:gap-3", className)}>
      <h2 id={heading} className={CHART_TITLE}>
        {TITLE}
      </h2>
      <div className="flex flex-col tablet:flex-row tablet:flex-wrap tablet:gap-2">
        {assumptions.map((assumption) =>
          assumption.kind === "levels" ? <LevelsChip key="levels" field={assumption} onLevel={onLevel} /> : <FieldChip key={assumption.id} field={assumption} onField={onField} />,
        )}
      </div>
    </section>
  );
}
