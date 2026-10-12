"use client";

import { useId, useRef } from "react";
import { useStore } from "zustand";
import { useStores, useView } from "@/components/shell/stores";
import { Button } from "@/components/ui/Button";
import { iconButtonLook } from "@/components/ui/button-look";
import { classNames } from "@/components/ui/class-names";
import { LIST_GAP } from "@/components/ui/design-numbers";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { FLOATING_SURFACE } from "@/components/ui/list-look";
import { measures } from "@/components/ui/measures";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { useFloating } from "@/components/ui/use-floating";
import { northWordsOf } from "@/lib/scene/projection";
import { bearingDegOf, type StageStore } from "@/lib/scene/stage-store";
import { cameraOf, groundOf } from "@/lib/stores/view-store";

type Props = { stage: StageStore; className?: string };

/** The two ways to look: Plan, or the 3D that Fit and the sun's eye are views of. */
type Look = "3d" | "plan";

const LOOKS = [
  { value: "3d", label: "3D", name: "3D view" },
  { value: "plan", label: "Plan", name: "Plan view" },
] as const satisfies ReadonlyArray<{ value: Look; label: string; name: string }>;

/** Fit and the north control are of tablet and desktop; the phone board has 3D and Plan alone, and Layers beside them. */
const NOT_ON_PHONE = "hidden items-center gap-2 tablet:flex";

/** The words of the Layers button, its panel and its one switch (the board "Stage, Layers"). */
export const LAYERS = "Layers";
export const SATELLITE_IMAGERY = "Satellite imagery";
export const OFF_THE_PLAIN_GRID = "Off: the plain grid";

/**
 * The controls of the view, at the top right of the stage (docs/design/mockups/Main.dc.html): 3D or
 * Plan, Fit, the north control whose needle shows where north is and which turns the view north up, and
 * the Layers button (the board "Stage, Layers") on every size.
 */
export function ViewControls({ stage, className }: Props) {
  const { view } = useStores();
  const preset = useView(cameraOf);
  const bearingDeg = useStore(stage, bearingDegOf);
  const look: Look = preset === "plan" ? "plan" : "3d";

  return (
    <div className={classNames("absolute z-stage-overlay flex items-center gap-2", className)}>
      <Segmented label="View" options={LOOKS} value={look} onChange={(chosen) => view.getState().setCamera(chosen)} />
      <div className={NOT_ON_PHONE}>
        <Button size="s" aria-label="Fit the roof" onClick={() => view.getState().setCamera("fit")}>
          Fit
        </Button>
        <button
          type="button"
          aria-label={northWordsOf(bearingDeg)}
          className={iconButtonLook("secondary", "s", "square")}
          onClick={() => view.getState().turnNorthUp()}
        >
          {/* North is as far counter-clockwise from up as the view looks east of it. */}
          <span className="flex turned" style={measures({ turn: -bearingDeg })}>
            <Icon name="north" size={22} />
          </span>
        </button>
      </div>
      <Layers />
    </div>
  );
}

/**
 * The Layers button and its panel (the board "Stage, Layers"; decision D57): a secondary icon button that looks
 * pressed while its panel is open; the panel floats 6 under it with their right edges in line, on every size, and
 * holds one switch, Satellite imagery, with the hint of what the other position gives. The switch takes effect at
 * once, so that the ground changes under the roof while the panel is open. Escape, the button and a press beside
 * the panel close it, as its close at the top right does (D70), and the focus goes back to the button. The switch is
 * off at first: the plain grid. What it sets is of the view, not of the design.
 */
function Layers() {
  const { view } = useStores();
  const ground = useView(groundOf);
  const [floating, trigger] = useFloating({ side: "below", align: "end", gap: LIST_GAP });
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  function open() {
    floating.open();
    // The focus goes to the switch, so that the space bar turns it; without scrolling, since a scroll closes the panel.
    panel.current?.querySelector<HTMLElement>('[role="switch"]')?.focus({ preventScroll: true });
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label={LAYERS}
        aria-haspopup="dialog"
        aria-expanded={floating.isOpen}
        aria-controls={id}
        className={iconButtonLook("secondary", "s", "square", floating.isOpen)}
        onClick={() => (floating.isOpen ? floating.close() : open())}
      >
        {/* The icon is in text-2 at rest, in text under the pointer and while the panel is open; 22 on touch, 20 on desktop. */}
        <span className={classNames("flex", floating.isOpen ? "text-text" : "text-text-2 within-hovered:text-text")}>
          <Icon name="layers" size={22} className="desktop:size-5" />
        </span>
      </button>
      <FloatingPanel floating={floating} width="card" onTouch="floating">
        <div ref={panel} id={id} role="dialog" aria-label={LAYERS} className={FLOATING_SURFACE}>
          <div className="flex items-center justify-between gap-2 pl-2.5">
            <p className="type-section text-text-3">{LAYERS}</p>
            <IconButton kind="quiet" size="xs" icon="close" iconSize={18} label="Close" onClick={floating.closeAndGoBack} />
          </div>
          <div className="flex min-h-12 items-center gap-3 px-2.5 pt-0.5 pb-1.5 desktop:min-h-11">
            <div className="flex min-w-0 grow flex-col gap-0.5">
              <span>{SATELLITE_IMAGERY}</span>
              <span className="type-body-touch desktop:type-body text-text-3">{OFF_THE_PLAIN_GRID}</span>
            </div>
            <Switch label={SATELLITE_IMAGERY} on={ground === "imagery"} onChange={(on) => view.getState().setGround(on ? "imagery" : "plain")} />
          </div>
        </div>
      </FloatingPanel>
    </>
  );
}
