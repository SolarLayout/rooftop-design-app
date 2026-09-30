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
import { cameraOf } from "@/lib/stores/view-store";

type Props = { stage: StageStore; className?: string };

/** The two ways to look: Plan, or the 3D that Fit and the sun's eye are views of. */
type Look = "3d" | "plan";

const LOOKS = [
  { value: "3d", label: "3D", name: "3D view" },
  { value: "plan", label: "Plan", name: "Plan view" },
] as const satisfies ReadonlyArray<{ value: Look; label: string; name: string }>;

/** Fit and the north control are of tablet and desktop; the phone board has 3D and Plan alone. */
const NOT_ON_PHONE = "hidden items-center gap-2 tablet:flex";

/**
 * The controls of the view, at the top right of the stage (docs/design/mockups/Main.dc.html): 3D or
 * Plan, Fit, and the north control whose needle shows where north is and which turns the view north up.
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
    </div>
  );
}
