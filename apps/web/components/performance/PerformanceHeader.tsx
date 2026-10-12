import type { ReactNode } from "react";
import { classNames } from "@/components/ui/class-names";
import { Skeleton } from "@/components/ui/Skeleton";
import type { HeaderView } from "@/lib/performance/header";
import { NoteLine } from "./NoteLine";
import { OptionSwitch } from "./OptionSwitch";

type Props = {
  /** The header from the run; null while no run ever answered. */
  header: HeaderView | null;
  /** No run ever answered and one is on its way: a skeleton stands for the line. */
  isLoading: boolean;
  /** The line of the run is of before, and a new run or another weather is on its way. */
  isDimmed: boolean;
  /** What stands under the line: a run on its way, or one that failed. */
  under?: ReactNode;
  /** The weather select (plan/phase-08-plan.md, decision 12). */
  weather: ReactNode;
  /** What stands under the controls: a weather that was not loaded, in the API's words. */
  note?: ReactNode;
  onChoose: (key: string) => void;
};

/**
 * The title, the line of the run and the controls (the board "Performance" on three sizes): on desktop the controls
 * stand at the right of the title, the weather before the options; on tablet under it in a row, the options first;
 * on phone under it, each across the width. The engine's notes on the weather stand under the line; a weather that was
 * not loaded under the controls, at their right; the row then aligns to the top, so that the title stays where it is
 * (the board "Weather and assumptions").
 */
export function PerformanceHeader({ header, isLoading, isDimmed, under, weather, note, onChoose }: Props) {
  return (
    <header className={classNames("flex flex-col gap-3 tablet:gap-4 desktop:flex-row desktop:gap-4", note ? "desktop:items-start" : "desktop:items-end")}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="type-title-touch desktop:type-title">Performance</h1>
        {header ? (
          <>
            <p data-testid="run-line" className={classNames("type-body-touch desktop:type-body text-text-2", isDimmed && "opacity-updating")}>
              {header.runLine}
            </p>
            {header.notes.length > 0 ? (
              <ul data-testid="weather-notes" className={classNames("flex flex-col gap-1.5 py-1", isDimmed && "opacity-updating")}>
                {header.notes.map((note) => (
                  <NoteLine key={note} words={note} testId="weather-note" />
                ))}
              </ul>
            ) : null}
          </>
        ) : isLoading ? (
          <Skeleton kind="text" className="my-1 w-140" />
        ) : null}
        {under}
      </div>
      {header ? (
        <div className="flex flex-col gap-2 desktop:ml-auto desktop:shrink-0 desktop:items-end">
          <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:gap-3">
            {header.chosen === null ? null : <OptionSwitch items={header.items} chosen={header.chosen} onChoose={onChoose} />}
            <div data-testid="weather-select" className="flex desktop:order-first">
              {weather}
            </div>
          </div>
          {note}
        </div>
      ) : null}
    </header>
  );
}
