"use client";

import type { ReactNode } from "react";
import { NumberField } from "@/components/ui/NumberField";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import type { ArraySpec, LayoutResponse, Roof } from "@/lib/api";
import { hourOf } from "@/lib/geometry/keepout";
import { ARRAY_RANGES, DESIGN_DAY_WORDS, designDayOf, pitchLineOf, spacingOf, spacingSetByOf, windowSetByOf, withAzimuthDecided, withDesignDay, withPitchDecided, type Decided, type DesignDay, type SpacingId } from "@/lib/studio/array-fields";
import { ARRAY_DEFAULTS } from "@/lib/studio/defaults";
import { DEFAULT } from "@/lib/studio/set-by";
import { azimuthLineOf, shadedLineOf, WINDOW_SCALE, WINDOW_TICKS, windowCommitted } from "@/lib/studio/array-view";
import type { ArrayChange } from "./ArrayMounting";
import { ReadOut, ROW, WithSetBy } from "./inspector-look";

type Props = {
  array: ArraySpec;
  roofType: Roof["roof_type"];
  /** The last layout; null while none came, when the engine's values are not known yet. */
  layout: LayoutResponse | null;
  onChange: (change: ArrayChange) => void;
};

const DESIGN_DAYS: { value: DesignDay; label: string }[] = (["winter", "june", "march"] as const).map((value) => ({ value, label: DESIGN_DAY_WORDS[value] }));

type DecidedFieldProps = {
  label: string;
  decided: Decided;
  /** The switch: on, the engine decides. */
  switchLabel: string;
  onDecided: (byEngine: boolean) => void;
  /** The field shown while the value is given. */
  field: ReactNode;
};

/** A value the engine decides unless told: read out with its switch on, a field with its switch off. */
function DecidedField({ label, decided, switchLabel, onDecided, field }: DecidedFieldProps) {
  const toggle = <Switch label={switchLabel} on={decided.isEngine} onChange={onDecided} />;
  if (decided.isEngine) {
    return (
      <ReadOut label={label} value={decided.value} line={decided.line}>
        {toggle}
      </ReadOut>
    );
  }
  return (
    <div data-testid="read-out" className="flex items-center gap-row">
      <div className="flex min-w-0 grow flex-col gap-0.5">
        {field}
        {decided.line === null ? null : (
          <span data-testid="read-out-line" className="type-body-touch desktop:type-body text-text-3">
            {decided.line}
          </span>
        )}
      </div>
      {toggle}
    </div>
  );
}

/**
 * The spacing of the rows (plan step 15, functional-inventory.md 1.3), inside the Array step's summary row (V2 · 3): the
 * pitch and the azimuth, which the engine decides unless the switch is off, each saying who set it; the switch gives the
 * value back to the engine. The document keeps null where the engine decides.
 */
export function ArraySpacing({ array, roofType, layout, onChange }: Props) {
  const set = <Id extends "row_pitch_m" | "azimuth_deg">(id: Id, value: ArraySpec[Id]) => onChange((before) => (before[id] === value ? before : { ...before, [id]: value }));
  const setBy = spacingSetByOf(array, roofType);

  const field = (id: SpacingId) => {
    switch (id) {
      case "row_pitch_m":
        return (
          <DecidedField
            label="Row pitch"
            decided={pitchLineOf(array, layout)}
            switchLabel="Shade-free row pitch"
            onDecided={(byEngine) => onChange((before) => withPitchDecided(before, layout, byEngine))}
            field={<NumberField label="Row pitch" value={array.row_pitch_m ?? null} unit="m" range={ARRAY_RANGES.row_pitch_m} onCommit={(value) => set("row_pitch_m", value)} />}
          />
        );
      case "azimuth_deg":
        return (
          <DecidedField
            label="Azimuth"
            decided={azimuthLineOf(array, layout, roofType)}
            switchLabel="Follow the roof edge"
            onDecided={(byEngine) => onChange((before) => withAzimuthDecided(before, layout, byEngine))}
            field={<NumberField label="Azimuth" value={array.azimuth_deg ?? null} unit="°" range={ARRAY_RANGES.azimuth_deg} onCommit={(value) => set("azimuth_deg", value)} />}
          />
        );
    }
  };

  return (
    <>
      {spacingOf(roofType).map((id) => (
        <WithSetBy key={id} setBy={setBy[id] ?? DEFAULT}>
          {field(id)}
        </WithSetBy>
      ))}
    </>
  );
}

type WindowProps = { array: ArraySpec; onChange: (change: ArrayChange) => void };

/**
 * The shade-free window in solar hours, the design day and whether shaded positions are used (plan step 15), inside the
 * Array step's summary row (V2 · 3), each saying who set it with Reset for the user's value.
 */
export function ShadeFreeWindow({ array, onChange }: WindowProps) {
  const setBy = windowSetByOf(array);
  const window = (from: number, to: number) => onChange((before) => (before.window_start_h === from && before.window_end_h === to ? before : { ...before, window_start_h: from, window_end_h: to }));
  const shaded = (on: boolean) => onChange((before) => (before.allow_shaded === on ? before : { ...before, allow_shaded: on }));

  return (
    <>
      <WithSetBy setBy={setBy.window} onReset={() => window(ARRAY_DEFAULTS.window_start_h, ARRAY_DEFAULTS.window_end_h)}>
        <RangeSlider
          label="Shade-free window"
          value={[array.window_start_h, array.window_end_h]}
          scale={WINDOW_SCALE}
          format={hourOf}
          note="solar time"
          ticks={WINDOW_TICKS}
          onCommit={(span) => window(...windowCommitted(span))}
        />
      </WithSetBy>
      <WithSetBy setBy={setBy.design_day} onReset={() => onChange((before) => withDesignDay(before, "winter"))}>
        <div className={ROW}>
          <span className="text-text-2">Design day</span>
          <Segmented label="Design day" options={DESIGN_DAYS} value={designDayOf(array)} onChange={(day) => onChange((before) => withDesignDay(before, day))} />
        </div>
      </WithSetBy>
      <WithSetBy setBy={setBy.allow_shaded} onReset={() => shaded(ARRAY_DEFAULTS.allow_shaded)}>
        <ReadOut label="Allow shaded positions" value={null} line={shadedLineOf(array.allow_shaded)}>
          <Switch label="Allow shaded positions" on={array.allow_shaded} onChange={shaded} />
        </ReadOut>
      </WithSetBy>
    </>
  );
}
