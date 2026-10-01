"use client";

import type { ReactNode } from "react";
import { NumberField } from "@/components/ui/NumberField";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import type { ArraySpec, LayoutResponse, Roof } from "@/lib/api";
import { hourOf } from "@/lib/scene/keepout";
import { ARRAY_RANGES, designDayOf, pitchLineOf, spacingOf, withAzimuthDecided, withDesignDay, withPitchDecided, type Decided, type DesignDay, type SpacingId } from "@/lib/studio/array-fields";
import { azimuthLineOf, shadedLineOf, WINDOW_SCALE, WINDOW_TICKS, windowCommitted } from "@/lib/studio/array-view";
import type { ArrayChange } from "./ArrayMounting";
import { ReadOut, ROW, SECTION } from "./inspector-look";

type Props = {
  array: ArraySpec;
  roofType: Roof["roof_type"];
  /** The last layout; null while none came, when the engine's values are not known yet. */
  layout: LayoutResponse | null;
  onChange: (change: ArrayChange) => void;
};

const DESIGN_DAYS: { value: DesignDay; label: string }[] = [
  { value: "winter", label: "Winter solstice" },
  { value: "june", label: "21 Jun" },
  { value: "march", label: "21 Mar" },
];

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
          <span data-testid="read-out-line" className="type-caption text-text-3">
            {decided.line}
          </span>
        )}
      </div>
      {toggle}
    </div>
  );
}

/**
 * The spacing of the rows and the shade-free window (plan step 15, functional-inventory.md 1.3): the
 * pitch and the azimuth, which the engine decides unless the switch is off; the window in solar hours;
 * the design day; whether shaded positions are used. The document keeps null where the engine decides.
 */
export function ArraySpacing({ array, roofType, layout, onChange }: Props) {
  const set = <Id extends "window_start_h" | "window_end_h" | "allow_shaded" | "row_pitch_m" | "azimuth_deg">(id: Id, value: ArraySpec[Id]) =>
    onChange((before) => (before[id] === value ? before : { ...before, [id]: value }));

  const field = (id: SpacingId) => {
    switch (id) {
      case "row_pitch_m":
        return (
          <DecidedField
            key={id}
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
            key={id}
            label="Azimuth"
            decided={azimuthLineOf(array, layout, roofType)}
            switchLabel="Follow the roof edge"
            onDecided={(byEngine) => onChange((before) => withAzimuthDecided(before, layout, byEngine))}
            field={<NumberField label="Azimuth" value={array.azimuth_deg ?? null} unit="°" range={ARRAY_RANGES.azimuth_deg} onCommit={(value) => set("azimuth_deg", value)} />}
          />
        );
    }
  };

  const spacing = spacingOf(roofType);

  return (
    <>
      {spacing.length > 0 ? (
        <section aria-label="Spacing" className="flex flex-col gap-row">
          <h2 className={SECTION}>Spacing</h2>
          {spacing.map(field)}
        </section>
      ) : null}
      <section aria-label="Shade-free window" className="flex flex-col gap-row">
        <h2 className={SECTION}>Shade-free window</h2>
        <RangeSlider
          label="Shade-free window"
          value={[array.window_start_h, array.window_end_h]}
          scale={WINDOW_SCALE}
          format={hourOf}
          note="solar time"
          ticks={WINDOW_TICKS}
          onCommit={(span) => {
            const [from, to] = windowCommitted(span);
            onChange((before) => (before.window_start_h === from && before.window_end_h === to ? before : { ...before, window_start_h: from, window_end_h: to }));
          }}
        />
        <div className={ROW}>
          <span className="text-text-2">Design day</span>
          <Segmented label="Design day" options={DESIGN_DAYS} value={designDayOf(array)} onChange={(day) => onChange((before) => withDesignDay(before, day))} />
        </div>
        <ReadOut label="Allow shaded positions" value={null} line={shadedLineOf(array.allow_shaded)}>
          <Switch label="Allow shaded positions" on={array.allow_shaded} onChange={(on) => set("allow_shaded", on)} />
        </ReadOut>
      </section>
    </>
  );
}
