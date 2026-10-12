"use client";

import { useRef, useState } from "react";
import { classNames } from "@/components/ui/class-names";
import { LIST_GAP } from "@/components/ui/design-numbers";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { LIST, PRESSABLE_MENU_ROW } from "@/components/ui/list-look";
import { onMenuKeyDown } from "@/components/ui/menu-keys";
import { TextField } from "@/components/ui/TextField";
import { useFloating } from "@/components/ui/use-floating";
import { NAME_RULES } from "@/lib/flow/name-field";
import { CARD_MENU, type CardDoing, type DesignCard as Card } from "@/lib/home/cards";

/** What the card's menu does; each closes the menu first. */
export type CardActions = {
  onOpen: () => void;
  /** The name committed in the field, trimmed and never empty (the field refuses an empty name). */
  onRename: (name: string) => void;
  onDuplicate: () => void;
  /** Download the project file: the .rtd of that design (audit V2-62). */
  onDownload: () => void;
  /** Delete was taken: who holds the cards asks before anything is removed (decision 7). */
  onDelete: () => void;
};

type Props = CardActions & { card: Card; className?: string };

/** The icon of each row of the menu (`CARD_MENU`): rows of 44 like the switcher's, 240 wide. */
const ICONS: Record<CardDoing, IconName> = { open: "arrow-right", rename: "pencil", duplicate: "copy", download: "download", delete: "bin" };

export const MENU = "Menu";

const CARD = "relative flex flex-col overflow-hidden rounded-card border border-line bg-surface-1 text-text";
const PRESS = "cursor-pointer press-motion focus-ring";
/** The tile of the thumbnail across the card's top, a line under it: the plan of 320 by 180 in its own units (decision 6). */
const TILE = classNames("block aspect-thumbnail w-full overflow-hidden border-b border-line bg-surface-2 *:size-full", PRESS);

/**
 * A design kept on this device (plan/phase-10-plan.md, step 12, decisions 6 and 7; V2 · 9, D105): the tile of its plan across
 * the top, then its name with the menu of 32 beside it (Open, Rename, Duplicate, Download the project file, Delete), the roof's
 * words, its figures once it has run, "Edited …". The tile and the name
 * open the design; Rename turns the name into the text field in place, committed on Enter or on leaving it, Escape giving
 * the name back, an empty name refused with "A name is needed" under the field.
 */
export function DesignCard({ card, onOpen, onRename, onDuplicate, onDownload, onDelete, className }: Props) {
  const [floating, trigger] = useFloating({ side: "below", align: "end", gap: LIST_GAP });
  const panel = useRef<HTMLDivElement>(null);
  const [isRenaming, setRenaming] = useState(false);
  const does: Record<CardDoing, () => void> = { open: onOpen, rename: () => setRenaming(true), duplicate: onDuplicate, download: onDownload, delete: onDelete };

  function openTheMenu() {
    floating.open();
    // Without scrolling: a scroll of the page closes the panel (use-floating), and the first row may stand below the fold.
    panel.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }

  const menu = (
    <>
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
        className="-mt-1 -mr-1.5 shrink-0"
      />
      <FloatingPanel floating={floating} width="card">
        <div ref={panel}>
          <ul role="menu" aria-label={card.name} onKeyDown={onMenuKeyDown} className={LIST}>
            {CARD_MENU.map((row) => (
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
                  <Icon name={ICONS[row.does]} size={18} stroke="light" className="text-text-2" />
                  <span className="grow">{row.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </FloatingPanel>
    </>
  );

  return (
    <article aria-label={card.name} data-testid="design-card" className={classNames(CARD, className)}>
      {/* The thumbnail is the app's own SVG, kept with the design on this device (lib/device/thumbnail.ts): its colours are classes of the page's tokens. */}
      <button type="button" aria-label={`Open ${card.name}`} onClick={onOpen} className={TILE} dangerouslySetInnerHTML={{ __html: card.thumbnail }} />
      <div className="flex flex-col gap-1 p-4">
        <div className="flex items-start justify-between gap-2">
          {isRenaming ? (
            <div
              className="min-w-0 grow"
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
            <button type="button" onClick={onOpen} className={classNames("min-w-0 truncate rounded-control text-left type-strong-touch desktop:type-strong", PRESS, "hovered:text-text-2")}>
              {card.name}
            </button>
          )}
          {menu}
        </div>
        <span className="type-body-touch desktop:type-body text-text-2">{card.roofWords}</span>
        {card.figures ? (
          <span data-testid="card-figures" className="type-body-touch desktop:type-body">
            {card.figures}
          </span>
        ) : null}
        <span className="type-unit text-text-3">{card.edited}</span>
      </div>
    </article>
  );
}
