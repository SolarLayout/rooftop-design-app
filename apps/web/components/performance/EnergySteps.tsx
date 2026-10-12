"use client";

import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { measures } from "@/components/ui/measures";
import { NumberField } from "@/components/ui/NumberField";
import type { BarLook } from "@/lib/format/cascade";
import { STEP_FIELD_RANGE, type EnergyStep, type EnergyStepsView, type StepFieldId, type StepsPart } from "@/lib/performance/energy-steps";

type Props = {
  view: EnergyStepsView;
  /** The figures are of before, and a new run is on its way: they stay, dimmed; the labels and the fields do not. */
  isDimmed: boolean;
  onField: (id: StepFieldId, value: number) => void;
  /** Opens the engine's 21 steps in their table. */
  onAllSteps: () => void;
};

const LOOK: Record<BarLook, string> = { gain: "bg-data-gain", loss: "bg-data-loss", zero: "bg-data-zero" };
const FIELD_WIDTH = "w-24 tablet:w-18";

function Row({ step, isDimmed, onField }: { step: EnergyStep } & Pick<Props, "isDimmed" | "onField">) {
  const dim = isDimmed && "opacity-updating";
  const { field } = step;
  return (
    <li data-testid="energy-step" data-step={step.id} title={step.engine.join(" · ")} className="flex flex-col gap-1.5 border-t border-line-subtle py-2.5 desktop:min-h-10 desktop:flex-row desktop:items-center desktop:gap-3 desktop:py-1.5">
      <span className="min-w-0 type-body-touch desktop:grow desktop:type-body">{step.label}</span>
      {/* On touch the figures stand on a line of their own under the step's name, at the right, so that they line up. */}
      <span className="flex items-center justify-end gap-3 desktop:shrink-0">
        {field ? (
          <span className="flex items-center gap-2">
            <NumberField
              form="chip"
              label={field.label}
              value={field.value}
              unit="%"
              range={STEP_FIELD_RANGE[field.id]}
              onCommit={(value) => onField(field.id, value)}
              className={FIELD_WIDTH}
            />
            <span data-testid="set-by" className="type-unit text-text-3">
              {field.setBy}
            </span>
          </span>
        ) : null}
        <span data-testid="step-change" className={classNames("w-16 text-right type-strong-touch desktop:type-strong", dim)}>
          {step.change}
        </span>
        <span aria-hidden="true" className={classNames("relative block h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-well", dim)}>
          {step.look === "zero" ? (
            <span data-look="zero" className={classNames("absolute inset-y-0 left-0 w-px", LOOK.zero)} />
          ) : (
            <span data-look={step.look} className={classNames("absolute inset-y-0 left-0 w-span min-w-0.5 rounded-full", LOOK[step.look])} style={measures({ span: step.share })} />
          )}
        </span>
      </span>
    </li>
  );
}

function Part({ title, part, isDimmed, onField }: { title: string; part: StepsPart } & Pick<Props, "isDimmed" | "onField">) {
  return (
    <section aria-label={title} className="flex min-w-0 flex-col">
      <h3 className="mb-2 type-body-touch desktop:type-body text-text-2">{title}</h3>
      <ul className="flex flex-col">
        {part.rows.map((step) => (
          <Row key={step.id} step={step} isDimmed={isDimmed} onField={onField} />
        ))}
      </ul>
      <p data-testid="steps-total" className="mt-2 flex justify-between gap-3 rounded-control bg-surface-2 px-3 py-2.5 type-strong-touch desktop:type-strong">
        <span>{part.total.label}</span>
        <span className={classNames(isDimmed && "opacity-updating")}>{part.total.value}</span>
      </p>
    </section>
  );
}

/**
 * Where the energy goes (V2 · 8, D104; the board "V2 · 8 · Performance", state 2): eleven plain steps in two columns on
 * desktop, before the modules and in the system, one column on touch; each with its change and its bar; where the user may
 * change a step, its field with who set it. The engine's steps a plain step holds are its title. All 21 steps opens the
 * engine's chain.
 */
export function EnergySteps({ view, isDimmed, onField, onAllSteps }: Props) {
  return (
    <div data-testid="energy-steps" className="flex flex-col gap-3">
      <div className="grid gap-6 desktop:grid-cols-2 desktop:gap-10">
        <Part title="Before the modules" part={view.before} isDimmed={isDimmed} onField={onField} />
        <Part title="In the system" part={view.system} isDimmed={isDimmed} onField={onField} />
      </div>
      <button type="button" onClick={onAllSteps} className="flex h-touch cursor-pointer items-center gap-1 self-start rounded-control type-strong-touch desktop:h-8 desktop:type-strong text-text-2 hovered:text-text focus-ring">
        All 21 steps
        <Icon name="chevron-right" size={14} />
      </button>
    </div>
  );
}
