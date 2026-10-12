"use client";

import { NumberField } from "@/components/ui/NumberField";
import { Segmented } from "@/components/ui/Segmented";
import { Slider } from "@/components/ui/Slider";
import { Stepper } from "@/components/ui/Stepper";
import type { ArraySpec, Roof } from "@/lib/api";
import { ARRAY_RANGES, mountingHintOf, mountingOf, mountingSetByOf, type MountingId } from "@/lib/studio/array-fields";
import { ARRAY_DEFAULTS } from "@/lib/studio/defaults";
import { DEFAULT } from "@/lib/studio/set-by";
import { slopedTiltLineOf } from "@/lib/studio/array-view";
import { ReadOut, ROW, WithSetBy } from "./inspector-look";

/** What a field does to the array once it is committed. */
export type ArrayChange = (array: ArraySpec) => ArraySpec;

type Props = {
  array: ArraySpec;
  roof: Roof;
  onChange: (change: ArrayChange) => void;
};

const ORIENTATIONS: { value: ArraySpec["orientation"]; label: string }[] = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

const TILT = { min: ARRAY_RANGES.tilt_deg.min, max: ARRAY_RANGES.tilt_deg.max, step: 1 };
const EW_TILT = { min: ARRAY_RANGES.ew_tilt_deg.min, max: ARRAY_RANGES.ew_tilt_deg.max, step: 1 };

/**
 * The mounting of the modules (plan step 14, functional-inventory.md 1.3): the fields of the roof
 * type, as the board draws them, inside the Array step's summary row (V2 · 3), each saying who set it with Reset for the
 * user's value. A slider commits on release, a segmented control and a stepper at once, a number field on Enter or blur.
 */
export function ArrayMounting({ array, roof, onChange }: Props) {
  const set = <Id extends MountingId>(id: Id, value: ArraySpec[Id]) => onChange((before) => (before[id] === value ? before : { ...before, [id]: value }));

  const field = (id: MountingId) => {
    switch (id) {
      case "tilt_deg":
        return <Slider key={id} label="Tilt" value={array.tilt_deg} scale={TILT} unit="°" onCommit={(value) => set("tilt_deg", value)} />;
      case "ew_tilt_deg":
        return <Slider key={id} label="East-west tilt" value={array.ew_tilt_deg} scale={EW_TILT} unit="°" hint="Each side, away from the ridge" onCommit={(value) => set("ew_tilt_deg", value)} />;
      case "orientation":
        return (
          <div key={id} className={ROW}>
            <span className="text-text">Orientation</span>
            <Segmented label="Orientation" options={ORIENTATIONS} value={array.orientation} onChange={(value) => set("orientation", value)} />
          </div>
        );
      case "modules_in_tilt":
        return <Stepper key={id} label="Modules in tilt" value={array.modules_in_tilt} range={ARRAY_RANGES.modules_in_tilt} onCommit={(value) => set("modules_in_tilt", value)} />;
      case "clearance_m":
        return <NumberField key={id} label="Clearance under the lower edge" value={array.clearance_m} unit="m" range={ARRAY_RANGES.clearance_m} onCommit={(value) => set("clearance_m", value)} />;
      case "ew_ridge_gap_m":
        return <NumberField key={id} label="Ridge gap" value={array.ew_ridge_gap_m} unit="m" range={ARRAY_RANGES.ew_ridge_gap_m} onCommit={(value) => set("ew_ridge_gap_m", value)} />;
    }
  };

  const sloped = roof.roof_type === "sloped_flush" ? slopedTiltLineOf(roof) : null;
  const setBy = mountingSetByOf(array, roof.roof_type);

  return (
    <>
      {sloped ? <ReadOut label="Tilt" value={sloped.value} line={sloped.line} /> : null}
      {mountingOf(roof.roof_type).map((id) => (
        <WithSetBy key={id} setBy={setBy[id] ?? DEFAULT} words={mountingHintOf(id, setBy[id] ?? DEFAULT)} onReset={() => set(id, ARRAY_DEFAULTS[id])}>
          {field(id)}
        </WithSetBy>
      ))}
    </>
  );
}
