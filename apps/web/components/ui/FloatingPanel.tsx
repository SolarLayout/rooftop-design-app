"use client";

import type { ReactNode } from "react";
import { floatingPanelLook, type OnTouch, type PanelWidth } from "./floating-panel-look";
import { SheetGrip } from "./SheetGrip";
import type { Floating } from "./use-floating";

type Props = {
  /** Of `useFloating`. */
  floating: Floating;
  /** How wide the panel is on desktop: a list of choices, the project switcher's menu, the search's places, the menu of a card. As a sheet it is as wide as the screen. */
  width?: PanelWidth;
  /**
   * On phone and tablet: a bottom sheet over a dimmed screen (the lists and the menus), or floating beside its control
   * at its width as on desktop (the Layers panel of the stage, decision D57: the ground it changes must stay in sight).
   */
  onTouch?: OnTouch;
  children: ReactNode;
};

/**
 * What floats beside the control that opened it: a list of choices, the menu of the project switcher.
 * On phone and tablet it is a bottom sheet, which a press on its handle, or a drag of it downwards, closes;
 * asked to stay floating there, it is beside its control on every size, and what is in it has the surface.
 */
export function FloatingPanel({ floating, width = "list", onTouch = "sheet", children }: Props) {
  return (
    <div {...floating.panel} className={floatingPanelLook(width, onTouch)}>
      {onTouch === "sheet" ? (
        <>
          <SheetGrip onClose={floating.close} className="desktop:hidden" />
          <div className="min-h-0 grow overflow-y-auto px-safe-4 pt-2 pb-safe-4 desktop:overflow-visible desktop:p-0">{children}</div>
        </>
      ) : (
        children
      )}
    </div>
  );
}
