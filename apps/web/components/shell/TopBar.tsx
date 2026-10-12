import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { classNames } from "@/components/ui/class-names";
import { HOME, PRESENT } from "@/lib/routes";
import type { Step, StepState } from "@/lib/flow/steps";
import { Logo } from "./Logo";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { ResultChip } from "./ResultChip";
import type { ResultChip as Chip, SummaryRow } from "./result-view";
import type { Saving } from "./SaveState";
import { StepNav } from "./StepNav";
import type { DeviceRow } from "./switcher-view";
import { useDocsHome } from "./use-docs-home";

type Props = {
  /** The name of the design that is open; null while none is. */
  name: string | null;
  saving: Saving;
  /** The step in hand and the state of each (D95). */
  step: Step | null;
  states: Readonly<Record<Step, StepState>>;
  /** The result at the bar's right, and its summary. */
  result: Chip;
  summary: readonly SummaryRow[];
  onOpenNotes: () => void;
  /** Import a drawing was taken in the project switcher. */
  onImport: () => void;
  /** Open a project was taken in the project switcher (plan/phase-10-plan.md, step 9). */
  onOpenProject?: () => void;
  /** The name was edited in the project switcher (plan/phase-09-plan.md, decision 13). */
  onRename?: (name: string) => void;
  /** Save a copy was taken in the project switcher (plan/phase-09-plan.md, step 8). */
  onSaveACopy?: () => void;
  /** The designs kept on this device, for the project switcher (plan/phase-10-plan.md, step 5). */
  designs?: readonly DeviceRow[];
  /** A design of the device was taken in the project switcher. */
  onOpenDesign?: (id: string) => void;
};

/** The bar's look: the top bar of the workspaces, and of Find (V2 · 4). */
export const BAR = classNames(
  // Its height, and the clock of an installed app over it (issue 147).
  "box-content flex h-topbar shrink-0 items-center gap-2 pt-safe-0 pr-2 pl-4",
  "tablet:h-topbar-tablet tablet:gap-3 tablet:border-b tablet:border-line-subtle tablet:bg-chrome tablet:px-5",
  "desktop:h-topbar desktop:gap-5",
);

/**
 * Present leads to the tour of the design on the whole screen (plan/phase-10-plan.md, decision 8): a secondary button with
 * its word at the head of Performance and Handover (D95); the phone has none.
 */
export function Present({ className }: { className?: string }) {
  return (
    <ButtonLink size="m" icon="play" href={PRESENT} className={classNames("hidden tablet:inline-flex", className)}>
      Present
    </ButtonLink>
  );
}

/** The docs, from the top bar's right (D91): a quiet link with its word on desktop. */
export function Docs() {
  const home = useDocsHome();
  return (
    <ButtonLink kind="quiet" size="m" icon="book" href={home} target="_blank" rel="noreferrer" className="hidden desktop:inline-flex">
      Docs
    </ButtonLink>
  );
}

/** The mark, a link home on every size (the owner, session 18), with the ring of every control. On touch the mark alone is
 * 28 across: the link is 44 square about it, and gives the 8 on each side back, so that nothing beside it moves. */
export function HomeMark() {
  return (
    <Link
      href={HOME}
      aria-label="Home"
      className="-mx-2 flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-control focus-ring press-motion desktop:mx-0 desktop:min-w-0 desktop:justify-start"
    >
      <Logo />
    </Link>
  );
}

/** The bar at the top of the order of work (D95): the mark, the design, the five steps, the result, the docs. */
export function TopBar({ name, saving, step, states, result, summary, onOpenNotes, onImport, onOpenProject, onRename, onSaveACopy, designs, onOpenDesign }: Props) {
  return (
    <header className={BAR}>
      <HomeMark />
      <span className="hidden h-6 w-px shrink-0 bg-line desktop:block" />
      <ProjectSwitcher
        name={name}
        saving={saving}
        onOpenNotes={onOpenNotes}
        onImport={onImport}
        onOpenProject={onOpenProject}
        onSaveACopy={onSaveACopy}
        onRename={onRename}
        designs={designs}
        onOpenDesign={onOpenDesign}
      />
      <span className="grow" />
      <StepNav current={step} states={states} />
      <span className="hidden grow tablet:block" />
      {/* On tablet the result is a row under the stage (D95, D97): the bar holds the steps. */}
      <div className="flex shrink-0 items-center gap-2 tablet:hidden desktop:flex">
        <ResultChip chip={result} summary={summary} onOpenNotes={onOpenNotes} />
        <Docs />
      </div>
    </header>
  );
}
