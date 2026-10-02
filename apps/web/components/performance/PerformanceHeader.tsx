import type { ReactNode } from "react";
import { classNames } from "@/components/ui/class-names";
import { Skeleton } from "@/components/ui/Skeleton";
import type { HeaderView } from "@/lib/performance/header";
import { OptionSwitch } from "./OptionSwitch";

type Props = {
  /** The header from the run; null while no run ever answered. */
  header: HeaderView | null;
  /** No run ever answered and one is on its way: a skeleton stands for the line. */
  isLoading: boolean;
  /** The line of the run is of before, and a new run is on its way. */
  isDimmed: boolean;
  /** What stands under the line: a run on its way, or one that failed. */
  under?: ReactNode;
  onChoose: (key: string) => void;
};

// The weather as a chip that says the source; its select comes with the weather source (plan/phase-08-plan.md, step 18).
const CHIP = classNames(
  "inline-flex h-touch w-full shrink-0 items-center gap-2 rounded-row border border-line bg-control px-3.5 whitespace-nowrap shadow-raised",
  "tablet:w-auto desktop:order-first desktop:h-10 desktop:rounded-control",
);

/**
 * The title, the line of the run and the controls (the board "Performance" on three sizes): on desktop the controls
 * stand at the right of the title, the weather before the options; on tablet under it in a row, the options first;
 * on phone under it, each across the width.
 */
export function PerformanceHeader({ header, isLoading, isDimmed, under, onChoose }: Props) {
  return (
    <header className="flex flex-col gap-3 tablet:gap-4 desktop:flex-row desktop:items-end desktop:gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="type-lens-touch tablet:type-page">Performance</h1>
        {header ? (
          <p data-testid="run-line" className={classNames("type-small text-text-2 tablet:type-body-touch desktop:type-body", isDimmed && "opacity-updating")}>
            {header.runLine}
          </p>
        ) : isLoading ? (
          <Skeleton kind="text" className="my-1 w-140" />
        ) : null}
        {under}
      </div>
      {header ? (
        <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:gap-3 desktop:ml-auto desktop:shrink-0">
          {header.chosen === null ? null : <OptionSwitch items={header.items} chosen={header.chosen} onChoose={onChoose} />}
          <div data-testid="weather-chip" className={CHIP}>
            <span className="text-text-2">{header.weather.label}</span>
            <span className="font-medium">{header.weather.value}</span>
          </div>
        </div>
      ) : null}
    </header>
  );
}
