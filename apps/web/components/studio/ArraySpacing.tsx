"use client";

import type { ReactNode } from "react";
import { NumberField } from "@/components/ui/NumberField";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import type { ArraySpec, LayoutResponse, Roof } from "@/lib/api";
import { hourOf } from "@/lib/geometry/keepout";
import { HelpDisc } from "@/components/shell/help/HelpDisc";
import { ARRAY_RANGES, designDayLabelsOf, designDayOf, pitchLineOf, spacingOf, spacingSentenceOf, spacingSetByOf, windowSetByOf, withAzimuthDecided, withDesignDay, withPitchDecided, type Decided, type DesignDay, type SpacingId } from "@/lib/studio/array-fields";
import { ARRAY_DEFAULTS } from "@/lib/studio/defaults";
import { DEFAULT } from "@/lib/studio/set-by";
import { azimuthLineOf, shadedLineOf, WINDOW_SCALE, WINDOW_TICKS, windowCommitted } from "@/lib/studio/array-view";
import type { ArrayChange } from "./ArrayMounting";
import { ReadOut, ROW, WithSetBy } from "./inspector-look";

type Props = {
  array: ArraySpec;
  roof: Roof;
  /** The last layout; null while none came, when the engine's values are not known yet. */
  layout: LayoutResponse | null;
  onChange: (change: ArrayChange) => void;
};

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
      <ReadOut label={label} value={decided.value} line={decided.line} >
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
 * Spacing (V2 · 7, D103; the board "The Roof and Array steps"), inside the Array step's summary row: one sentence that says
 * why the rows stand where they do; the switch that gives the spacing to the shade-free hours (off, type it yourself); the
 * shade-free hours; the design day, which the rows are spaced for; the direction of the rows; and whether shaded positions are
 * used. Each says who set it, with Reset for the user's value. The ground coverage ratio and the profile angle are in the help.
 */
export function ArraySpacing({ array, roof, layout, onChange }: Props) {
  const roofType = roof.roof_type;
  const set = <Id extends "row_pitch_m" | "azimuth_deg">(id: Id, value: ArraySpec[Id]) => onChange((before) => (before[id] === value ? before : { ...before, [id]: value }));
  const setBy = spacingSetByOf(array, roofType);
  const windowBy = windowSetByOf(array, roof.lat);
  const window = (from: number, to: number) => onChange((before) => (before.window_start_h === from && before.window_end_h === to ? before : { ...before, window_start_h: from, window_end_h: to }));
  const shaded = (on: boolean) => onChange((before) => (before.allow_shaded === on ? before : { ...before, allow_shaded: on }));
  const sentence = spacingSentenceOf(array, layout, roofType, roof.lat);
  const days = designDayLabelsOf(roof.lat);
  const designDays: { value: DesignDay; label: string }[] = (["winter", "summer", "march"] as const).map((value) => ({ value, label: days[value] }));

  const field = (id: SpacingId) => {
    switch (id) {
      case "row_pitch_m":
        return (
          <DecidedField
            label="Row spacing from the shade-free hours"
            decided={{ ...pitchLineOf(array, layout), value: null, line: array.row_pitch_m == null ? "Off: type the spacing yourself" : (pitchLineOf(array, layout).line ?? "On: the shade-free hours decide it") }}
            switchLabel="Row spacing from the shade-free hours"
            onDecided={(byEngine) => onChange((before) => withPitchDecided(before, layout, byEngine))}
            field={<NumberField label="Row spacing" value={array.row_pitch_m ?? null} unit="m" range={ARRAY_RANGES.row_pitch_m} onCommit={(value) => set("row_pitch_m", value)} />}
          />
        );
      case "azimuth_deg":
        return (
          <DecidedField
            label="Direction (azimuth)"
            decided={azimuthLineOf(array, layout, roofType)}
            switchLabel="Follow the roof edge"
            onDecided={(byEngine) => onChange((before) => withAzimuthDecided(before, layout, byEngine))}
            field={<NumberField label="Direction (azimuth)" value={array.azimuth_deg ?? null} unit="°" range={ARRAY_RANGES.azimuth_deg} onCommit={(value) => set("azimuth_deg", value)} />}
          />
        );
    }
  };

  const spacing = spacingOf(roofType);
  return (
    <>
      {sentence ? (
        <p data-testid="spacing-sentence" className="type-body-touch desktop:type-body text-text">
          {sentence}
        </p>
      ) : null}
      {spacing.includes("row_pitch_m") ? (
        <WithSetBy setBy={setBy.row_pitch_m ?? DEFAULT} quietWhenDefault onReset={() => set("row_pitch_m", null)}>
          {field("row_pitch_m")}
        </WithSetBy>
      ) : null}
      <WithSetBy setBy={windowBy.window} onReset={() => window(ARRAY_DEFAULTS.window_start_h, ARRAY_DEFAULTS.window_end_h)}>
        <RangeSlider
          label="Shade-free hours"
          labelHelp={<HelpDisc topic="studio.section.shade-free-hours" />}
          isNamed
          value={[array.window_start_h, array.window_end_h]}
          scale={WINDOW_SCALE}
          format={hourOf}
          note="solar time"
          ticks={WINDOW_TICKS}
          onCommit={(span) => window(...windowCommitted(span))}
        />
      </WithSetBy>
      <WithSetBy setBy={windowBy.design_day} onReset={() => onChange((before) => withDesignDay(before, "winter", roof.lat))}>
        <div className="flex flex-col gap-1.5">
          <div className={ROW}>
            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-text">
              Design day
              <HelpDisc topic="studio.section.design-day" />
            </span>
            <Segmented label="Design day" options={designDays} value={designDayOf(array, roof.lat)} onChange={(day) => onChange((before) => withDesignDay(before, day, roof.lat))} />
          </div>
          <p className="type-body-touch desktop:type-body text-text-3">The day the rows are spaced for. {days.winter} has the longest shadows.</p>
        </div>
      </WithSetBy>
      {spacing.includes("azimuth_deg") ? (
        <WithSetBy setBy={setBy.azimuth_deg ?? DEFAULT} quietWhenDefault onReset={() => set("azimuth_deg", null)}>
          {field("azimuth_deg")}
        </WithSetBy>
      ) : null}
      <WithSetBy setBy={windowBy.allow_shaded} quietWhenDefault onReset={() => shaded(ARRAY_DEFAULTS.allow_shaded)}>
        <ReadOut label="Allow shaded positions" value={null} line={shadedLineOf(array.allow_shaded)}>
          <Switch label="Allow shaded positions" on={array.allow_shaded} onChange={shaded} />
        </ReadOut>
      </WithSetBy>
    </>
  );
}
