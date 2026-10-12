import type { ReactNode } from "react";
import { classNames } from "@/components/ui/class-names";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Figure, Lead } from "@/lib/performance/kpis";

type LeadProps = {
  /** Null at the first load: skeletons stand for the figures. Null too before options: the label alone, nothing of energy. */
  lead: Lead | null;
  /** No value was ever there, and one is on its way. */
  isLoading: boolean;
  /** The figures are of before and a new run is on its way: they stay, dimmed, and the label says Updating (V2 · 5). */
  isUpdating: boolean;
  /** Option and Weather: beside the lead on desktop, under it, side by side, on touch. */
  selects: ReactNode;
  /** What stands under the selects: a weather that was not loaded, in the API's words. */
  note?: ReactNode;
};

const LABEL = "type-body-touch desktop:type-body text-text-2";
const STRONG = "type-strong-touch desktop:type-strong text-text";

/**
 * The lead of Performance (V2 · 8, D104; the board "V2 · 8 · Performance"): the energy to the grid in year 1 at the display
 * size, Likely and Conservative with what it means in years (audit V2-89), and what it depends on beside it, the option and
 * the weather. A run on its way dims the figures where they stand and says Updating beside the label.
 */
export function EnergyLead({ lead, isLoading, isUpdating, selects, note }: LeadProps) {
  const dim = isUpdating && "opacity-updating";
  return (
    <section data-testid="kpi-energy" aria-label="Energy to the grid in year 1" className="flex flex-col gap-3 desktop:flex-row desktop:items-end desktop:justify-between desktop:gap-6">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="flex h-6 items-center gap-2">
          <span className={LABEL}>Energy to the grid in year 1</span>
          {isUpdating ? (
            <span data-testid="updating" role="status" className="flex items-center gap-1.5">
              <ProgressRing size={16} />
              <span className={LABEL}>Updating</span>
            </span>
          ) : null}
        </p>
        {lead ? (
          <>
            <p data-testid="lead-energy" className={classNames("flex items-baseline gap-2.5 whitespace-nowrap", dim)}>
              <span className="type-display-touch desktop:type-display">{lead.quantity.number}</span>
              <span className="type-heading text-text-2">{lead.quantity.unit}</span>
            </p>
            <p data-testid="likely" className={classNames("flex flex-wrap items-center gap-x-4 gap-y-1", dim)}>
              <span className={LABEL}>Likely</span>
              <span className={STRONG}>{lead.likely}</span>
              {lead.conservative ? (
                <>
                  <span className={LABEL}>{lead.conservative.label}</span>
                  <span className={STRONG}>{lead.conservative.value}</span>
                  <span className="type-body-touch desktop:type-body text-text-3">{lead.conservative.meaning}</span>
                </>
              ) : null}
            </p>
          </>
        ) : isLoading ? (
          <>
            <Skeleton kind="lead" className="w-57.5" />
            <Skeleton kind="text" className="w-100" />
          </>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 desktop:items-end">
        <div className="grid grid-cols-2 gap-3 desktop:flex">{selects}</div>
        {note}
      </div>
    </section>
  );
}

type FiguresProps = {
  figures: readonly Figure[];
  isDimmed: boolean;
};

const TILE = "flex min-w-0 flex-col gap-1.5 rounded-row border border-line bg-surface-1 p-4";

/** The three figures (V2 · 8): tiles on desktop and tablet, a list on phone, each with its few words. */
export function Figures({ figures, isDimmed }: FiguresProps) {
  const dim = isDimmed && "opacity-updating";
  return (
    <div data-testid="figures">
      <ul className="hidden tablet:grid tablet:grid-cols-3 tablet:gap-grid">
        {figures.map((figure) => (
          <li key={figure.id} data-testid={`kpi-${figure.id}`} className={TILE}>
            <span className={LABEL}>{figure.label}</span>
            <span className={classNames("flex items-baseline gap-1.5 whitespace-nowrap", dim)}>
              <span className="type-figure-touch desktop:type-figure">{figure.quantity.number}</span>
              <span className={LABEL}>{figure.quantity.unit}</span>
            </span>
            <span className={LABEL}>{figure.words}</span>
          </li>
        ))}
      </ul>
      <ul className="flex flex-col tablet:hidden">
        {figures.map((figure) => (
          <li key={figure.id} data-testid={`figure-${figure.id}`} className="flex items-baseline justify-between gap-3 border-t border-line-subtle py-2.5">
            <span className="flex min-w-0 flex-col">
              <span className="type-body-touch text-text">{figure.label}</span>
              <span className="type-body-touch text-text-2">{figure.words}</span>
            </span>
            <span className={classNames("flex shrink-0 items-baseline gap-1 whitespace-nowrap", dim)}>
              <span className="type-heading">{figure.quantity.number}</span>
              <span className="type-unit text-text-2">{figure.quantity.unit}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** In the place of the figures at the first load: skeletons, never for a value that was there. */
export function FigureSkeletons() {
  return (
    <div className="flex flex-col gap-3 tablet:grid tablet:grid-cols-3 tablet:gap-grid">
      {[0, 1, 2].map((index) => (
        <div key={index} className={classNames(TILE, "gap-2.5")}>
          <Skeleton kind="label" className="w-25" />
          <Skeleton kind="value" className="w-27" />
        </div>
      ))}
    </div>
  );
}
