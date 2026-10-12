import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { classNames } from "@/components/ui/class-names";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StatusMark } from "@/components/ui/StatusMark";
import { Tooltip } from "@/components/ui/Tooltip";
import { pathOfStep, STEPS, type Step, type StepState } from "@/lib/flow/steps";
import { lineOf } from "@/lib/words/explain";

type Props = {
  /** The step the user is on; null outside the order of work. */
  current: Step | null;
  states: Readonly<Record<Step, StepState>>;
  /** Without the lines between the steps and with less room in each: where the row shares its width (Find). */
  compact?: boolean;
};

/** What a step's state is to a screen reader, after its name. */
const SAID: Record<StepState, string> = { done: "done", "needs-you": "needs you", "to-do": "to do", closed: "after the roof is built" };

/** A step's mark (the board "V2 · 2"): a tick when done, the note mark when it needs the user, else its number. */
function Mark({ state, number, isCurrent }: { state: StepState; number: number; isCurrent: boolean }) {
  if (state === "done") return <StatusMark kind="fits" label={SAID.done} wordsShown={false} size={16} />;
  if (state === "needs-you") return <StatusMark kind="note" label={SAID["needs-you"]} wordsShown={false} size={16} />;
  return (
    <span aria-hidden="true" className={classNames("grid size-4 shrink-0 place-items-center rounded-full border type-unit font-semibold leading-none", isCurrent ? "border-text text-text" : "border-text-3 text-text-3")}>
      {number}
    </span>
  );
}

const ITEM = "relative flex h-8 items-center gap-1.5 rounded-control px-2 whitespace-nowrap select-none press-motion focus-ring desktop:gap-2 desktop:px-3";
const TAKEN = "bg-control-active type-strong text-text shadow-segment";

/** The order of work in the top bar of desktop and tablet (D95): five steps, each with its mark; the one in hand pressed. */
export function StepNav({ current, states, compact = false }: Props) {
  return (
    <nav aria-label="Steps" className="hidden h-10 shrink-0 items-center gap-1 rounded-row border border-line bg-well p-1 shadow-well tablet:flex">
      {STEPS.map(({ id, name }, index) => {
        const state = states[id];
        const isCurrent = id === current;
        const look = classNames(ITEM, compact && "desktop:px-2", isCurrent ? TAKEN : classNames("type-body", state === "closed" ? "text-text-3" : state === "to-do" ? "text-text-2 hovered:text-text" : "text-text hovered:text-text"));
        const inside: ReactNode = (
          <>
            <Mark state={state} number={index + 1} isCurrent={isCurrent} />
            {name}
            <span className="sr-only">, {SAID[state]}</span>
          </>
        );
        return (
          <Fragment key={id}>
            {index > 0 && !compact ? <span aria-hidden="true" className="hidden h-px w-3 shrink-0 bg-line-strong desktop:block" /> : null}
            {state === "closed" ? (
              <span aria-disabled="true" className={look}>
                {inside}
              </span>
            ) : (
              <Tooltip words={lineOf(name)}>
                <Link href={pathOfStep(id)} aria-current={isCurrent ? "step" : undefined} className={look}>
                  {inside}
                </Link>
              </Tooltip>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

const ICON: Record<Step, IconName> = { roof: "roof", array: "array", strings: "strings", performance: "performance", handover: "handover" };

/** The order of work at the foot of the phone (D95): the five steps, each with its icon and its mark. */
export function StepTabBar({ current, states }: Props) {
  return (
    <nav aria-label="Steps" className="grid h-tabbar-on-screen shrink-0 grid-cols-5 border-t border-line-subtle bg-chrome px-1 pt-1.5 pb-tabbar-foot-on-screen tablet:hidden">
      {STEPS.map(({ id, name }) => {
        const state = states[id];
        const isCurrent = id === current;
        const look = classNames(
          "flex flex-col items-center justify-center gap-1 rounded-row type-unit whitespace-nowrap select-none press-motion focus-ring",
          isCurrent ? "font-semibold text-accent" : state === "closed" ? "text-text-3" : "text-text-2 hovered:text-text",
        );
        const inside = (
          <>
            <span className="relative flex">
              <Icon name={ICON[id]} size={22} stroke="light" />
              {state === "done" || state === "needs-you" ? (
                <span className="absolute -top-1.5 -right-2 flex rounded-full bg-chrome p-px">
                  <StatusMark kind={state === "done" ? "fits" : "note"} label={SAID[state]} wordsShown={false} size={14} />
                </span>
              ) : null}
            </span>
            {name}
          </>
        );
        return state === "closed" ? (
          <span key={id} aria-disabled="true" className={look}>
            {inside}
          </span>
        ) : (
          <Link key={id} href={pathOfStep(id)} aria-current={isCurrent ? "step" : undefined} className={look}>
            {inside}
          </Link>
        );
      })}
    </nav>
  );
}
