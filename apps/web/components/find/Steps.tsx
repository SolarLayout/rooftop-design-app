import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";

/** The three steps of Find and outline, in their order. */
export const STEPS = [
  { id: "find", name: "Find" },
  { id: "outline", name: "Outline" },
  { id: "build", name: "Build" },
] as const;

export type Step = (typeof STEPS)[number]["id"];

export const indexOfStep = (step: Step) => STEPS.findIndex((one) => one.id === step);

type Props = { current: Step; className?: string };

const PILL = "flex h-12 shrink-0 gap-1 rounded-card-s border border-line bg-surface-1 p-1.25 shadow-float";
const ITEM = "flex items-center gap-2 rounded-seg-touch px-3.5 whitespace-nowrap";
const CURRENT = "bg-control-active font-medium text-text shadow-segment";

/** Where the user is: the steps done have a tick, the one in hand is raised, those to come their number. */
export function Steps({ current, className }: Props) {
  const at = indexOfStep(current);
  return (
    <ol aria-label="Steps" className={classNames(PILL, className)}>
      {STEPS.map(({ id, name }, index) => (
        <li key={id} aria-current={id === current ? "step" : undefined} className={classNames(ITEM, id === current ? CURRENT : "text-text-2")}>
          {index < at ? (
            <Icon name="tick" stroke="tick" size={16} className="text-ok" label="Done" />
          ) : (
            <code className={classNames("type-value-small", id === current && "text-accent")}>{index + 1}</code>
          )}
          {name}
        </li>
      ))}
    </ol>
  );
}
