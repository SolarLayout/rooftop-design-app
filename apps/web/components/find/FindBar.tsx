import { BAR, Docs, HomeMark } from "@/components/shell/TopBar";
import { StepNav } from "@/components/shell/StepNav";
import type { Step, StepState } from "@/lib/flow/steps";

type Props = {
  states: Readonly<Record<Step, StepState>>;
};

/** The design on Find is a new one: Find is for a new roof, an outline is edited in the Roof step (issue 238, item 6). */
const NAME = "New design";

/** Find's top bar (V2 · 4, D98): the mark, the design, the steps with Roof in hand, the docs; the search is in the column. */
export function FindBar({ states }: Props) {
  return (
    <header className={BAR}>
      <HomeMark />
      <span className="hidden h-6 w-px shrink-0 bg-line desktop:block" />
      <span className="min-w-0 truncate font-medium">{NAME}</span>
      <span className="grow" />
      <StepNav current="roof" states={states} />
      <span className="hidden grow tablet:block" />
      <Docs />
    </header>
  );
}
