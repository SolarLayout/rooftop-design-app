"use client";

import { SectionHeading } from "@/components/shell/help/SectionHeading";
import { classNames } from "@/components/ui/class-names";
import { NumberField } from "@/components/ui/NumberField";
import { shown } from "@/components/ui/number-entry";
import { Switch } from "@/components/ui/Switch";
import { edgeNamesOf, measurementsOf, type OutlineEvent, type OutlineState } from "@/lib/outline/outline-state";

type Props = {
  state: OutlineState;
  on: (event: OutlineEvent) => void;
  className?: string;
};

/** Lengths on the map: one decimal (docs/design/guidelines.md, "Lengths"). */
const LENGTH = { min: 0.1, max: 2000, decimals: 1 };

const TILE = "flex flex-col gap-0.5 rounded-row border border-line bg-surface-1 px-3.5 py-3 tablet:px-3 tablet:py-2 desktop:px-3.5 desktop:py-3";

/** One number of the outline: the area, the direction it faces, the corners. */
function Tile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className={TILE}>
      <span className="type-caption text-text-2">{label}</span>
      <code className="type-value-s">
        {value}
        {unit ? <span className="type-caption text-text-2"> {unit}</span> : null}
      </code>
    </div>
  );
}

/** The area, the direction the long side faces and the corners, as three tiles. */
export function MeasurementTiles({ state }: { state: OutlineState }) {
  const hemisphere = (state.frame?.centre.lat ?? 0) >= 0 ? "north" : "south";
  const measured = measurementsOf(state, hemisphere);
  return (
    <section className="grid grid-cols-3 gap-field" aria-label="Measurements">
      <Tile label="Area" value={measured.area === null ? "—" : shown(Math.round(measured.area), 0)} unit={measured.area === null ? undefined : "m²"} />
      <Tile label="Faces" value={measured.facing === null ? "—" : `${Math.round(measured.facing.degrees)}° ${measured.facing.compass}`} />
      <Tile label="Corners" value={measured.corners === 0 ? "—" : String(measured.corners)} />
    </section>
  );
}

/** The measurements of the outline, live, and the fields that correct it (the board "Find and outline"). */
export function OutlinePanel({ state, on, className }: Props) {
  const hemisphere = (state.frame?.centre.lat ?? 0) >= 0 ? "north" : "south";
  const measured = measurementsOf(state, hemisphere);
  const names = edgeNamesOf(state);

  return (
    <div className={classNames("flex flex-col gap-4 desktop:gap-5", className)}>
      <section className="flex flex-col gap-2.5" aria-label="Edges">
        <SectionHeading help="find.section.edges">Edges</SectionHeading>
        {state.closed ? (
          <div className="grid grid-cols-2 gap-field">
            {measured.edges.map((length, edge) => (
              <NumberField
                key={`${names[edge]}-${measured.edges.length}`}
                label={names[edge]}
                value={length}
                unit="m"
                range={LENGTH}
                labelInside
                onCommit={(typed) => on({ type: "edgeLength", edge, length: typed })}
              />
            ))}
          </div>
        ) : (
          <p role="status" className="type-small text-text-2">
            {measured.corners === 0
              ? "Click the first corner of the roof."
              : measured.corners < 3
                ? `${measured.corners} of at least 3 corners placed.`
                : `${measured.corners} corners placed. Click the first corner, or press Enter, to close the outline.`}
          </p>
        )}
        <div className="flex min-h-11 items-center gap-3">
          <span className="flex grow flex-col gap-0.5">
            <span id="square-the-corners">Square the corners</span>
            <span className="type-caption text-text-3">Snaps to 90° when you are within 3°</span>
          </span>
          <Switch label="Square the corners" on={state.squared} onChange={(squared) => on({ type: "squared", squared })} />
        </div>
      </section>

      <MeasurementTiles state={state} />
    </div>
  );
}
