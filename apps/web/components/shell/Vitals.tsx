import Link from "next/link";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stat, Stats } from "@/components/ui/Stat";
import { StatusMark } from "@/components/ui/StatusMark";
import type { LastCell, Vital, VitalId, VitalsView } from "./vitals-view";

type Props = {
  /** What the vitals show: `vitalsOf` makes it of the results. */
  view: VitalsView;
  onOpenNotes: () => void;
  className?: string;
};

// Phone: one row of cards that scrolls sideways. Tablet: a grid. Desktop: a floating bar.
const BAR = classNames(
  "flex shrink-0 gap-2 overflow-x-auto pr-4 pb-3.5 pl-4 whitespace-nowrap no-scrollbar",
  "tablet:mx-5 tablet:grid tablet:gap-0 tablet:overflow-visible tablet:rounded-card tablet:border tablet:border-line",
  "tablet:bg-surface-1 tablet:p-0 tablet:shadow-card",
  "desktop:mx-0 desktop:h-vitals desktop:shadow-float",
);

const CARD = "h-16 shrink-0 rounded-row border border-line bg-surface-1 px-4 shadow-card";
const CELL = classNames(
  "tablet:h-18 tablet:rounded-none tablet:border-0 tablet:bg-transparent tablet:px-4.5 tablet:shadow-none",
  "desktop:h-auto desktop:px-3.5",
);

// On phone the row shows first what matters most.
const PLACE_ON_PHONE: Record<VitalId, string> = {
  energy: "order-1",
  dc: "order-2",
  dcac: "order-3",
  modules: "order-4",
  ac: "order-5",
  pr: "order-6",
  yield: "order-7",
  roof: "order-1",
  positions: "order-2",
  "if-all-used": "order-3",
};

// The widths of a label and of its value, while no value was ever there.
const BONES = [
  { label: "w-19.5", value: "w-29.5" },
  { label: "w-16.5", value: "w-24" },
  { label: "w-16.5", value: "w-15" },
  { label: "w-10", value: "w-14.5" },
  { label: "w-12.5", value: "w-21" },
  { label: "w-5", value: "w-15" },
  { label: "w-8.5", value: "w-27.5" },
];

/** The lines between the cells: at the left of all but the first of a row, over those of the second row. */
function lines(index: number, perRow: number): string {
  return classNames(
    index % perRow !== 0 && "tablet:border-l",
    index >= perRow && "tablet:border-t",
    index > 0 && "desktop:border-t-0 desktop:border-l",
    index === 0 && "desktop:px-4.5",
  );
}

function columnsOf(view: VitalsView): string {
  if (view.kind === "design") return "tablet:grid-cols-4 desktop:grid-cols-vitals";
  if (view.cells.length === 3) return "tablet:grid-cols-3 desktop:grid-cols-vitals-waiting";
  // What the layout alone gives, or nothing: the cells share the width.
  return "tablet:auto-cols-fr tablet:grid-flow-col";
}

function Cell({ vital, index, perRow, dimmed }: { vital: Vital; index: number; perRow: number; dimmed: boolean }) {
  const isLead = vital.id === "energy";
  return (
    <Stat
      look={isLead ? "lead" : "cell"}
      label={vital.label}
      value={vital.quantity.number}
      unit={vital.quantity.unit}
      dimmed={dimmed}
      mark={vital.mark ? <StatusMark kind={vital.mark.kind} label={vital.mark.label} wordsShown={false} size={16} /> : undefined}
      beside={isLead && dimmed ? <ProgressRing size={16} /> : undefined}
      className={classNames(CARD, CELL, PLACE_ON_PHONE[vital.id], "tablet:order-none", lines(index, perRow))}
    />
  );
}

const LAST = classNames(
  "order-first flex h-16 max-w-60 shrink-0 items-center gap-2.5 rounded-row border px-3.5 text-left",
  "tablet:order-none tablet:h-18 tablet:max-w-none tablet:min-w-0 tablet:gap-3 tablet:rounded-none tablet:border-0 tablet:px-4.5",
  "desktop:h-auto desktop:min-w-0 desktop:gap-2.5 desktop:rounded-r-card desktop:border-t-0 desktop:border-l desktop:px-4",
);
const ON_NOTE = "border-note-line bg-note-surface";
const ON_SURFACE = "border-line bg-surface-1 tablet:bg-transparent";
const PRESSED = "cursor-pointer press-motion focus-ring";

type Lines = {
  first: string;
  second: string | null;
  /** The note across the width of the tablet has larger words. */
  large?: boolean;
  /** On phone the first line alone, on two lines: the card must leave room for the one after it. */
  short?: boolean;
};

function TwoLines({ first, second, large = false, short = false }: Lines) {
  return (
    <span className="flex min-w-0 grow flex-col gap-0.5">
      {/* In a cell the first line may take two lines; the second gives way. */}
      <span
        className={classNames(
          "type-body-touch desktop:type-body font-medium tablet:line-clamp-2 tablet:whitespace-normal",
          short ? "line-clamp-2 whitespace-normal" : "truncate",
          large && "type-body-touch desktop:type-body tablet:font-medium desktop:font-medium",
        )}
      >
        {first}
      </span>
      {second === null ? null : (
        <span
          className={classNames(
            "truncate type-body-touch desktop:type-body text-text-2",
            short && "hidden tablet:block",
            large && "type-body-touch desktop:type-body",
          )}
        >
          {second}
        </span>
      )}
    </span>
  );
}

function Last({ last, view, onOpenNotes }: { last: LastCell; view: VitalsView; onOpenNotes: () => void }) {
  // Under the cells on tablet: in their last place when they are seven, across the width otherwise.
  const isAcross = view.kind === "layout" && !view.isLoading;
  const place = isAcross
    ? "tablet:col-span-full tablet:rounded-b-card tablet:border-t desktop:col-span-1 desktop:rounded-bl-none"
    : "tablet:rounded-br-card tablet:border-t tablet:border-l";

  if (last.kind === "run") {
    return (
      <div data-testid="vitals-last" role="status" className={classNames(LAST, ON_SURFACE, place)}>
        <ProgressRing size={20} share={last.share} label={last.step ?? last.title} />
        <TwoLines first={last.title} second={last.step} />
      </div>
    );
  }
  if (last.kind === "decision") {
    return (
      <Link data-testid="vitals-last" href={last.path} className={classNames(LAST, ON_NOTE, PRESSED, place)}>
        <Icon name="note" size={22} className="text-accent" />
        <TwoLines first={last.title} second={last.detail} large short />
        <Icon name="arrow-right" size={18} className="hidden text-text-2 tablet:block desktop:hidden" />
      </Link>
    );
  }

  const fits = last.kind === "notes" && last.count === 0;
  // On phone the notes have their button in the top bar; what failed is said in the row.
  const onPhone = last.kind === "notes" ? "hidden tablet:flex" : "";
  return (
    <button
      data-testid="vitals-last"
      type="button"
      onClick={onOpenNotes}
      className={classNames(LAST, fits ? ON_SURFACE : ON_NOTE, PRESSED, place, onPhone)}
    >
      {fits ? <Icon name="tick" stroke="tick" size={20} className="text-ok" /> : <Icon name="note" size={22} className="text-accent" />}
      <TwoLines first={last.title} second={last.detail} />
    </button>
  );
}

/** The numbers of the design, the same on every screen that shows them, and what is waited for. */
export function Vitals({ view, onOpenNotes, className }: Props) {
  const perRow = view.kind === "design" ? 4 : Math.max(view.cells.length, 1);

  return (
    // The keyboard stops at the vitals, so that their row can be scrolled without a pointer.
    <section aria-label="Design vitals" tabIndex={0} className={classNames(BAR, "focus-ring", columnsOf(view), className)}>
      {view.isLoading ? (
        BONES.map((bone, index) => (
          <div key={bone.label + bone.value} className={classNames("flex flex-col justify-center gap-2.5", CARD, CELL, lines(index, 4))}>
            <Skeleton kind="label" className={bone.label} />
            <Skeleton kind={index === 0 ? "lead" : "value"} className={bone.value} />
          </div>
        ))
      ) : (
        <Stats className="contents">
          {view.cells.map((vital, index) => (
            <Cell key={vital.id} vital={vital} index={index} perRow={perRow} dimmed={view.isDimmed} />
          ))}
        </Stats>
      )}
      <Last last={view.last} view={view} onOpenNotes={onOpenNotes} />
    </section>
  );
}
