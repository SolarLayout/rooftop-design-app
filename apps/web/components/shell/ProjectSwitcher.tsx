"use client";

import Link from "next/link";
import { useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { classNames } from "@/components/ui/class-names";
import { LIST_GAP } from "@/components/ui/design-numbers";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { indexAfterKey } from "@/components/ui/list-keys";
import { FACT, LIST } from "@/components/ui/list-look";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useFloating } from "@/components/ui/use-floating";
import { NAME_RULES } from "@/lib/handover/name-field";
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

/**
 * An action of the menu: it leads to an address, it opens the import of a drawing, or it saves a copy of the project file;
 * one that does none of these comes with a later phase.
 */
type Action = { name: string; icon: IconName; fact?: string; href?: string; does?: "import" | "save" };

// What has neither an address nor a thing to do comes with a later phase (Open a project, Phase 10): it is shown and cannot
// be used. Save a copy downloads the .rtd the API writes (plan/phase-09-plan.md, step 8).
const ACTIONS: Action[] = [
  { name: "New design", icon: "plus", fact: "Find the roof", href: "/find" },
  { name: "Open a project", icon: "folder", fact: ".rtd" },
  { name: "Import a drawing", icon: "upload", fact: "KMZ, KML, DXF", does: "import" },
  { name: "Save a copy", icon: "download", fact: ".rtd", does: "save" },
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
  /** Import a drawing was taken: the dialog of the import opens (plan/phase-05-plan.md, decision 13). */
  onImport: () => void;
  /** A row that leads somewhere, or does something, was taken. */
  onTake: () => void;
  /** Save a copy was taken: the project file is downloaded (plan/phase-09-plan.md, step 8). Without it the row is shown and cannot be used. */
  onSaveACopy?: () => void;
  /** The name was edited in the row "This design" (plan/phase-09-plan.md, decision 13). Without it the name cannot be edited here. */
  onRename?: (name: string) => void;
  /** For the kit: the row with its field open, as it looks while the name is edited. */
  shownAs?: "renaming";
};

/** The row "This design": the name with a tick, and under it the state of saving; pressed, Rename turns the name into a field. */
function ThisDesign({ name, saving, onOpenNotes, onTake, onRename, shownAs }: Omit<MenuProps, "onImport">) {
  const [isRenaming, setRenaming] = useState(shownAs === "renaming");
  const canRename = onRename !== undefined && name !== null;

  if (isRenaming && name !== null && onRename) {
    return (
      <div
        data-testid="this-design"
        className="flex flex-col gap-2 px-2.5 pt-1 pb-2.5"
        onKeyDown={(event) => {
          // Escape gives the name back and closes the field; it must not close the switcher too.
          if (event.key !== "Escape") return;
          event.preventDefault();
          event.stopPropagation();
          setRenaming(false);
        }}
      >
        <TextField label="Name" labelHidden value={name} {...NAME_RULES} initialFocus onCommit={onRename} onDone={(said) => said === null && setRenaming(false)} />
        <SaveState look="menu" state={saving} onOpenNotes={onOpenNotes} className="pl-2.5" />
      </div>
    );
  }

  return (
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
      {canRename ? <IconButton kind="quiet" size="xs" icon="pencil" iconSize={18} label="Rename" onClick={() => setRenaming(true)} className="-my-1.5 -mr-1.5" /> : null}
    </div>
  );
}

/** What the project switcher holds: this design, the designs on this device, what can be done. */
export function ProjectMenu({ name, saving, onOpenNotes, onImport, onTake, onSaveACopy, onRename, shownAs }: MenuProps) {
  const doers: Record<NonNullable<Action["does"]>, (() => void) | undefined> = { import: onImport, save: onSaveACopy };
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
      <ThisDesign name={name} saving={saving} onOpenNotes={onOpenNotes} onTake={onTake} onRename={onRename} shownAs={shownAs} />
      <span className={DIVIDER} />
      <span className={LABEL}>On this device</span>
      <p className="px-2.5 pt-0.5 pb-2.5 type-small text-text-2">Designs you save appear here.</p>
      <span className={classNames(DIVIDER, "mb-1")} />
      <ul ref={rows} role="menu" aria-label="Project" onKeyDown={onKeyDown} className="flex flex-col gap-0.5">
        {ACTIONS.map(({ name: action, icon, fact, href, does }) => {
          const run = does === undefined ? undefined : doers[does];
          const inside = (
            <>
              <Icon name={icon} size={18} stroke="light" className="text-text-2" />
              <span className="grow">{action}</span>
              {fact ? <span className={FACT}>{fact}</span> : null}
            </>
          );
          return (
            <li key={action} role="none">
              {href !== undefined ? (
                <Link role="menuitem" tabIndex={-1} href={href} onClick={onTake} className={classNames(ROW, "cursor-pointer")}>
                  {inside}
                </Link>
              ) : run !== undefined ? (
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => {
                    onTake();
                    run();
                  }}
                  className={classNames(ROW, "w-full cursor-pointer text-left")}
                >
                  {inside}
                </button>
              ) : (
                <span role="menuitem" aria-disabled="true" tabIndex={-1} className={classNames(ROW, "cursor-default opacity-disabled")}>
                  {inside}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type Props = Design & Pick<MenuProps, "saving" | "onOpenNotes" | "onImport" | "onSaveACopy" | "onRename">;

/** The design that is open, and the way to another one. On phone and tablet it opens as a bottom sheet. */
export function ProjectSwitcher({ name, place, saving, onOpenNotes, onImport, onSaveACopy, onRename }: Props) {
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
          <ProjectMenu name={name} saving={saving} onOpenNotes={onOpenNotes} onImport={onImport} onTake={floating.close} onSaveACopy={onSaveACopy} onRename={onRename} />
        </div>
      </FloatingPanel>
    </>
  );
}
