"use client";

import { useStore } from "zustand";
import { useStores, useView } from "@/components/shell/stores";
import { Button } from "@/components/ui/Button";
import { iconButtonLook } from "@/components/ui/button-look";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { measures } from "@/components/ui/measures";
import { Segmented } from "@/components/ui/Segmented";
import { northWordsOf } from "@/lib/scene/projection";
import { bearingDegOf, type StageStore } from "@/lib/scene/stage-store";
import { cameraOf, groundOf, isPanelHiddenOf, isSunViewOf } from "@/lib/stores/view-store";

type Props = { stage: StageStore; className?: string };

/** The two ways to look: Plan, or the 3D that Fit and the sun's eye are views of. */
type Look = "3d" | "plan";

const LOOKS = [
  { value: "3d", label: "3D", name: "3D view" },
  { value: "plan", label: "Plan", name: "Plan view" },
] as const satisfies ReadonlyArray<{ value: Look; label: string; name: string }>;

/** Fit and the north control are of tablet and desktop; the phone board has 3D and Plan alone, and Imagery beside them. */
const NOT_ON_PHONE = "hidden items-center gap-2 tablet:flex";

/** The toggle of the ground under the roof (V2 · 7): the satellite imagery, or the plain grid. */
export const IMAGERY = "Imagery";

/**
 * The controls of the view, at the top right of the stage (docs/design/mockups/Main.dc.html): 3D or
 * Plan, Fit, the north control whose needle shows where north is and which turns the view north up, Sun (the Sun view,
 * D95), Imagery (V2 · 7) on every size, and Show panel while the work column is hidden (D99).
 */
export function ViewControls({ stage, className }: Props) {
  const { view } = useStores();
  const preset = useView(cameraOf);
  const bearingDeg = useStore(stage, bearingDegOf);
  const look: Look = preset === "plan" ? "plan" : "3d";
  const isSunView = useView(isSunViewOf);
  const isPanelHidden = useView(isPanelHiddenOf);

  return (
    <div className={classNames("absolute z-stage-overlay flex flex-wrap items-center justify-end gap-2 tablet:flex-nowrap", className)}>
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
      {/* Sun is a view of the stage on every step (D95): pressed, its shadows, its time, the sun's arc and the shade map.
          On phone it stands alone at the top right, the others on a line under it, clear of the time at the top left. */}
      <div className="-order-1 flex basis-full justify-end tablet:order-none tablet:basis-auto">
        <Button size="s" icon="sun" aria-pressed={isSunView} onClick={() => view.getState().showSunView(!isSunView)} className={isSunView ? "bg-control-active" : undefined}>
          Sun
        </Button>
      </div>
      <Imagery />
      {/* The work column hidden on desktop: its way back, beside the view controls (D99). */}
      {isPanelHidden ? (
        <span className="hidden desktop:contents">
          <Button size="s" icon="panel" onClick={() => view.getState().hidePanel(false)}>
            Show panel
          </Button>
        </span>
      ) : null}
    </div>
  );
}

/**
 * Imagery (V2 · 7, D103; audit V2-35): one toggle in the view controls, in place of the Layers button and its panel of one
 * switch. Pressed, the satellite imagery is the ground under the roof; again, the plain grid (D57, D70). Of the view, not of
 * the design.
 */
function Imagery() {
  const { view } = useStores();
  const ground = useView(groundOf);
  const isOn = ground === "imagery";
  return (
    <Button size="s" icon="layers" aria-pressed={isOn} onClick={() => view.getState().setGround(isOn ? "plain" : "imagery")} className={isOn ? "bg-control-active" : undefined}>
      {IMAGERY}
    </Button>
  );
}
