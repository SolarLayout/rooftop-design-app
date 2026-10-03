"use client";

import { useRef, useState } from "react";
import { classNames } from "@/components/ui/class-names";
import { LIST_GAP } from "@/components/ui/design-numbers";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { FACT, LIST, PRESSABLE_MENU_ROW } from "@/components/ui/list-look";
import { onMenuKeyDown } from "@/components/ui/menu-keys";
import { Stat, Stats } from "@/components/ui/Stat";
import { TextField } from "@/components/ui/TextField";
import { useFloating } from "@/components/ui/use-floating";
import { NAME_RULES } from "@/lib/flow/name-field";
import type { DesignCard as Card } from "@/lib/home/cards";

/** What the card's menu does; each closes the menu first. */
export type CardActions = {
  onOpen: () => void;
  /** The name committed in the field, trimmed and never empty (the field refuses an empty name). */
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onSaveACopy: () => void;
  /** Delete was taken: who holds the cards asks before anything is removed (decision 7). */
  onDelete: () => void;
};

type Props = CardActions & { card: Card; className?: string };

type Row = { name: string; icon: IconName; fact?: string; does: Exclude<keyof CardActions, "onRename"> | "rename" };

/** The rows of the menu, as the board draws them: rows of 44 like the switcher's, 240 wide. */
const ROWS: Row[] = [
  { name: "Open", icon: "arrow-right", does: "onOpen" },
  { name: "Rename", icon: "pencil", does: "rename" },
  { name: "Duplicate", icon: "copy", does: "onDuplicate" },
  { name: "Save a copy", icon: "download", fact: ".rtd", does: "onSaveACopy" },
  { name: "Delete", icon: "bin", does: "onDelete" },
];

export const MENU = "Menu";

const CARD = "relative flex flex-col gap-3 rounded-card border border-line bg-surface-1 p-card-compact text-text shadow-card";
const PRESS = "cursor-pointer press-motion focus-ring";
/** The tile of the thumbnail: the plan of 320 by 180 in its own units, scaled across the card on surface-2 (decision 6). */
const TILE = classNames("block aspect-video w-full overflow-hidden rounded-row bg-surface-2 *:size-full", PRESS, "hovered:lifted");

/**
 * A design kept on this device (plan/phase-10-plan.md, step 12, decisions 6 and 7; the board "Home, designs on this device"):
 * the tile of its plan, its name, the roof's words, the capacity and the energy of its last run or what waits in their place,
 * "Edited …", and a menu of 32 at the top right with Open, Rename, Duplicate, Save a copy and Delete. The tile and the name
 * open the design; Rename turns the name into the text field in place, committed on Enter or on leaving it, Escape giving
 * the name back, an empty name refused with "A name is needed" under the field.
 */
export function DesignCard({ card, onOpen, onRename, onDuplicate, onSaveACopy, onDelete, className }: Props) {
  const [floating, trigger] = useFloating({ side: "below", align: "end", gap: LIST_GAP });
  const panel = useRef<HTMLDivElement>(null);
  const [isRenaming, setRenaming] = useState(false);
  const does: Record<Row["does"], () => void> = { onOpen, rename: () => setRenaming(true), onDuplicate, onSaveACopy, onDelete };

  function openTheMenu() {
    floating.open();
    panel.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }

  return (
    <article aria-label={card.name} data-testid="design-card" className={classNames(CARD, className)}>
      <div className="relative">
        {/* The thumbnail is the app's own SVG, kept with the design on this device (lib/device/thumbnail.ts): its colours are classes of the page's tokens. */}
        <button type="button" aria-label={`Open ${card.name}`} onClick={onOpen} className={TILE} dangerouslySetInnerHTML={{ __html: card.thumbnail }} />
        <IconButton
          ref={trigger}
          label={MENU}
          icon="more"
          iconSize={18}
          size="xs"
          aria-haspopup="menu"
          aria-expanded={floating.isOpen}
          onClick={() => (floating.isOpen ? floating.close() : openTheMenu())}
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            openTheMenu();
          }}
          className="absolute top-2 right-2"
        />
        <FloatingPanel floating={floating} width="card">
          <div ref={panel}>
            <ul role="menu" aria-label={card.name} onKeyDown={onMenuKeyDown} className={LIST}>
              {ROWS.map((row) => (
                <li key={row.name} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => {
                      floating.close();
                      does[row.does]();
                    }}
                    className={PRESSABLE_MENU_ROW}
                  >
                    <Icon name={row.icon} size={18} stroke="light" className="text-text-2" />
                    <span className="grow">{row.name}</span>
                    {row.fact ? <span className={FACT}>{row.fact}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </FloatingPanel>
      </div>
      <div className="flex flex-col gap-1 px-1">
        {isRenaming ? (
          <div
            onKeyDown={(event) => {
              // Escape gives the name back and closes the field.
              if (event.key !== "Escape") return;
              event.preventDefault();
              setRenaming(false);
            }}
          >
            <TextField label="Name" labelHidden value={card.name} {...NAME_RULES} initialFocus onCommit={onRename} onDone={(said) => said === null && setRenaming(false)} />
          </div>
        ) : (
          <button type="button" onClick={onOpen} className={classNames("min-w-0 truncate rounded-xs text-left type-title", PRESS, "hovered:text-text-2")}>
            {card.name}
          </button>
        )}
        <span className="type-caption text-text-2">{card.roofWords}</span>
      </div>
      <div className="px-1">
        {card.facts ? (
          <Stats className="flex gap-7">
            <Stat label="Capacity" value={card.facts.capacity.number} unit={card.facts.capacity.unit} />
            <Stat label="Energy, year 1" value={card.facts.energy.number} unit={card.facts.energy.unit} />
          </Stats>
        ) : (
          // The numbers cannot exist yet: what they wait for stands in their place, never a figure (guidelines.md).
          <p data-testid="card-waiting" className="flex min-h-10.5 items-center type-small text-text-2">
            {card.waiting}
          </p>
        )}
      </div>
      <p className="px-1 type-caption text-text-3">{card.edited}</p>
    </article>
  );
}
