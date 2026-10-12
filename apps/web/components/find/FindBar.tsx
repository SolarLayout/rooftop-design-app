import { BAR, Docs, HomeMark } from "@/components/shell/TopBar";
import { StepNav } from "@/components/shell/StepNav";
import type { Step, StepState } from "@/lib/flow/steps";

type Props = {
  /** The design's name: "New design" before one is built, the design's own while its roof is edited. */
  name: string;
  states: Readonly<Record<Step, StepState>>;
};

/** Find's top bar (V2 · 4, D98): the mark, the design, the steps with Roof in hand, the docs; the search is in the column. */
export function FindBar({ name, states }: Props) {
  return (
    <header className={BAR}>
      <HomeMark />
      <span className="hidden h-6 w-px shrink-0 bg-line desktop:block" />
      <span className="min-w-0 truncate font-medium">{name}</span>
      <span className="grow" />
      <StepNav current="roof" states={states} />
      <span className="hidden grow tablet:block" />
      <Docs />
    </header>
  );
}
