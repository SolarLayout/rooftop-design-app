"use client";

import { useRef } from "react";
import { LIST_GAP } from "@/components/ui/design-numbers";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { LIST, PRESSABLE_MENU_ROW } from "@/components/ui/list-look";
import { onMenuKeyDown } from "@/components/ui/menu-keys";
import { useFloating } from "@/components/ui/use-floating";
import { CARD_MENU, type CardDoing } from "@/lib/home/cards";

/** What the menu of a design does; each closes the menu first. */
export type DesignActions = Record<CardDoing, () => void>;

type Props = {
  /** The design's name: the menu's name, for a screen reader. */
  name: string;
  does: DesignActions;
};

/** The icon of each row of the menu (`CARD_MENU`): rows of 44 like the switcher's, 240 wide. */
const ICONS: Record<CardDoing, IconName> = { open: "arrow-right", rename: "pencil", duplicate: "copy", download: "download", delete: "bin" };

export const MENU = "Menu";

/**
 * The menu of a design kept on this device (plan/phase-10-plan.md, decision 7; V2 · 9): a press of 32 at the end of its row
 * opens Open, Rename, Duplicate, Download the project file and Delete under it, the first row focused; ↓ and ↑ open it too.
 */
export function DesignMenu({ name, does }: Props) {
  const [floating, trigger] = useFloating({ side: "below", align: "end", gap: LIST_GAP });
  const panel = useRef<HTMLDivElement>(null);

  function openTheMenu() {
    floating.open();
    // Without scrolling: a scroll of the page closes the panel (use-floating), and the first row may stand below the fold.
    panel.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }

  return (
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
        className="shrink-0"
      />
      <FloatingPanel floating={floating} width="card">
        <div ref={panel}>
          <ul role="menu" aria-label={name} onKeyDown={onMenuKeyDown} className={LIST}>
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
}
