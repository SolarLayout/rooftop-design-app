"use client";

import Link from "next/link";
import { useRef, type ComponentProps, type KeyboardEvent } from "react";
import { classNames } from "@/components/ui/class-names";
import { LIST_GAP } from "@/components/ui/design-numbers";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { Icon, type IconName } from "@/components/ui/Icon";
import { indexAfterKey } from "@/components/ui/list-keys";
import { FACT, LIST } from "@/components/ui/list-look";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFloating } from "@/components/ui/use-floating";
import { SaveState, type Saving } from "./SaveState";

type Design = {
  /** The name of the design that is open; null while none is. */
  name: string | null;
  /** Where it is, as it is shown: "18.52° N · 73.86° E". */
  place: string | null;
};

const TRIGGER = classNames(
  "flex h-touch min-w-20 cursor-pointer items-center gap-1.5 rounded-row border px-1.5 whitespace-nowrap select-none",
  "press-motion focus-ring tablet:gap-2 tablet:px-2 desktop:h-10 desktop:gap-2.5 desktop:rounded-control desktop:px-3",
);
const TRIGGER_CLOSED = "border-transparent bg-transparent hovered:bg-surface-2";
const TRIGGER_OPEN = "border-line bg-surface-2";

type TriggerProps = Omit<ComponentProps<"button">, "children" | "name"> & Design & { open: boolean };

/** What opens the project switcher: the name of the design, on desktop where it is, a chevron. */
export function ProjectTrigger({ name, place, open, className, ...rest }: TriggerProps) {
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={name === null ? "Project" : undefined}
      className={classNames(TRIGGER, open ? TRIGGER_OPEN : TRIGGER_CLOSED, className)}
      {...rest}
    >
      {name === null ? (
        <Skeleton kind="text" className="w-28" />
      ) : (
        <span className="min-w-0 truncate font-medium desktop:font-medium">{name}</span>
      )}
      {place === null ? null : <span className="hidden type-value-xs text-text-3 desktop-wide:inline">{place}</span>}
      <Icon name={open ? "chevron-up" : "chevron-down"} size={16} className="text-text-3" />
    </button>
  );
}

type Action = { name: string; icon: IconName; fact?: string; href?: string };

// What has no address comes with a later phase: it is shown and cannot be used.
const ACTIONS: Action[] = [
  { name: "New design", icon: "plus", fact: "Find the roof" },
  { name: "Open a project", icon: "folder", fact: ".rtd" },
  { name: "Import a drawing", icon: "upload", fact: "KMZ, KML, DXF" },
  { name: "Save a copy", icon: "download", fact: ".rtd" },
  { name: "Home", icon: "home", href: "/" },
];

const LABEL = "px-2.5 pt-2 pb-1 type-section text-text-3 uppercase";
const DIVIDER = "mx-1 h-px shrink-0 bg-line";
const ROW = classNames(
  "flex h-13 items-center gap-3 rounded-item px-2.5 select-none focus-ring desktop:h-11",
  "hovered:bg-surface-2 focus-visible:bg-surface-2",
);

type MenuProps = Pick<Design, "name"> & {
  saving: Saving;
  onOpenNotes: () => void;
  /** A row that leads somewhere was taken. */
  onTake: () => void;
};

/** What the project switcher holds: this design, the designs on this device, what can be done. */
export function ProjectMenu({ name, saving, onOpenNotes, onTake }: MenuProps) {
  const rows = useRef<HTMLUListElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const items = [...(rows.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const current = items.findIndex((item) => item === document.activeElement);
    const to = indexAfterKey(items.length, current === -1 ? null : current, event.key, new Set());
    // A key of the menu that leads nowhere must not scroll the page either.
    if (to !== null || ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) event.preventDefault();
    if (to !== null) items[to]?.focus();
  }

  return (
    <div data-testid="project-menu" className={classNames(LIST, "desktop:gap-0")}>
      <span className={LABEL}>This design</span>
      <div data-testid="this-design" className="flex items-center gap-2.5 px-2.5 pt-1.5 pb-2.5">
        <Icon name="tick" stroke="tick" size={16} className="text-accent" />
        <span className="flex min-w-0 grow flex-col gap-0.5">
          {name === null ? <Skeleton kind="text" className="w-28" /> : <span className="truncate font-medium desktop:font-medium">{name}</span>}
          <SaveState
            look="menu"
            state={saving}
            onOpenNotes={() => {
              onTake();
              onOpenNotes();
            }}
          />
        </span>
      </div>
      <span className={DIVIDER} />
      <span className={LABEL}>On this device</span>
      <p className="px-2.5 pt-0.5 pb-2.5 type-small text-text-2">Designs you save appear here.</p>
      <span className={classNames(DIVIDER, "mb-1")} />
      <ul ref={rows} role="menu" aria-label="Project" onKeyDown={onKeyDown} className="flex flex-col gap-0.5">
        {ACTIONS.map(({ name: action, icon, fact, href }) => {
          const inside = (
            <>
              <Icon name={icon} size={18} stroke="light" className="text-text-2" />
              <span className="grow">{action}</span>
              {fact ? <span className={FACT}>{fact}</span> : null}
            </>
          );
          return (
            <li key={action} role="none">
              {href === undefined ? (
                <span role="menuitem" aria-disabled="true" tabIndex={-1} className={classNames(ROW, "cursor-default opacity-disabled")}>
                  {inside}
                </span>
              ) : (
                <Link role="menuitem" tabIndex={-1} href={href} onClick={onTake} className={classNames(ROW, "cursor-pointer")}>
                  {inside}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type Props = Design & Pick<MenuProps, "saving" | "onOpenNotes">;

/** The design that is open, and the way to another one. On phone and tablet it opens as a bottom sheet. */
export function ProjectSwitcher({ name, place, saving, onOpenNotes }: Props) {
  const [floating, trigger] = useFloating({ side: "below", align: "start", gap: LIST_GAP });
  const panel = useRef<HTMLDivElement>(null);

  function open() {
    floating.open();
    panel.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }

  return (
    <>
      <ProjectTrigger
        ref={trigger}
        name={name}
        place={place}
        open={floating.isOpen}
        onClick={() => (floating.isOpen ? floating.close() : open())}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          open();
        }}
      />
      <FloatingPanel floating={floating} width="menu">
        <div ref={panel}>
          <ProjectMenu name={name} saving={saving} onOpenNotes={onOpenNotes} onTake={floating.close} />
        </div>
      </FloatingPanel>
    </>
  );
}
