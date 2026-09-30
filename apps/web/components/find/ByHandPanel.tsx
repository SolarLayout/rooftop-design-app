"use client";

import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { IconButton } from "@/components/ui/IconButton";
import { NumberField } from "@/components/ui/NumberField";
import { Segmented } from "@/components/ui/Segmented";
import type { ByHand, Row, Shape } from "@/lib/outline/by-hand";
import type { OutlineState } from "@/lib/outline/outline-state";
import { MeasurementTiles } from "./OutlinePanel";

type Props = {
  hand: ByHand;
  /** What changed of what is entered; the screen makes the roof of it. */
  onChange: (change: Partial<ByHand>) => void;
  state: OutlineState;
  className?: string;
};

/** Coordinates: five decimals (docs/design/guidelines.md, "Coordinates"); north and east positive. */
const LATITUDE = { min: -90, max: 90, decimals: 5 };
const LONGITUDE = { min: -180, max: 180, decimals: 5 };
/** Lengths in a field: two decimals; the range of the desktop app (plan/reference/functional-inventory.md, 1.1). */
const LENGTH = { min: 0.1, max: 2000, decimals: 2 };
/** An angle that is set: a whole number, clockwise from north. */
const FACES = { min: 0, max: 359, decimals: 0 };
/** A corner: metres east and north of the middle of the roof. */
const CORNER = { min: -5000, max: 5000, decimals: 2 };

const SECTION = "type-section text-text-3 uppercase";
const SHAPES: { value: Shape; label: string }[] = [
  { value: "rectangle", label: "Rectangle" },
  { value: "corners", label: "Corners" },
];

/**
 * The roof entered by its measurements (the board "Enter dimensions by hand"): the place, then a
 * rectangle by its length, its width and where its long side faces, or a table of corners; then the
 * same tiles as for a roof drawn on the map.
 */
export function ByHandPanel({ hand, onChange, state, className }: Props) {
  const rows = hand.rows;

  function changeRow(index: number, change: Partial<Row>) {
    onChange({ rows: rows.map((row, n) => (n === index ? { ...row, ...change } : row)) });
  }

  return (
    <div className={classNames("flex flex-col gap-4 desktop:gap-5", className)}>
      <section className="flex flex-col gap-2.5" aria-label="Place">
        <h2 className={SECTION}>Place</h2>
        {/* One under the other: a coordinate with five decimals and its label need the whole row. */}
        <div className="grid grid-cols-1 gap-field">
          <NumberField label="Latitude" value={hand.lat} unit="°" range={LATITUDE} labelInside wide onCommit={(lat) => onChange({ lat })} />
          <NumberField label="Longitude" value={hand.lon} unit="°" range={LONGITUDE} labelInside wide onCommit={(lon) => onChange({ lon })} />
        </div>
        <p className="type-caption text-text-3">From the search above, or typed. Five decimals; north and east are positive.</p>
      </section>

      <section className="flex flex-col gap-2.5" aria-label="Shape">
        <h2 className={SECTION}>Shape</h2>
        <Segmented label="Shape" options={SHAPES} value={hand.shape} onChange={(shape) => onChange({ shape })} fill />
        {hand.shape === "rectangle" ? (
          <div className="flex flex-col gap-field">
            <div className="grid grid-cols-2 gap-field">
              <NumberField label="Length" value={hand.length} unit="m" range={LENGTH} labelInside onCommit={(length) => onChange({ length })} />
              <NumberField label="Width" value={hand.width} unit="m" range={LENGTH} labelInside onCommit={(width) => onChange({ width })} />
            </div>
            <NumberField label="Long side faces" value={hand.faces} unit="°" range={FACES} labelInside onCommit={(faces) => onChange({ faces })} />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5" data-testid="corner-table">
            <div className="flex items-center gap-2 type-caption text-text-3">
              <span className="w-14 shrink-0">Corner</span>
              <span className="grow basis-0 pr-6 text-right">East</span>
              <span className="grow basis-0 pr-6 text-right">North</span>
              <span className="w-9 shrink-0" />
            </div>
            {rows.map((row, index) => (
              <div key={index} data-testid="corner-row" className="flex items-center gap-2">
                <span className="w-14 shrink-0 type-small">{index + 1}</span>
                <NumberField label={`East of corner ${index + 1}`} labelHidden value={row.east} unit="m" range={CORNER} labelInside onCommit={(east) => changeRow(index, { east })} className="grow basis-0" />
                <NumberField label={`North of corner ${index + 1}`} labelHidden value={row.north} unit="m" range={CORNER} labelInside onCommit={(north) => changeRow(index, { north })} className="grow basis-0" />
                <IconButton label={`Remove corner ${index + 1}`} icon="bin" iconSize={16} kind="quiet" size="s" onClick={() => onChange({ rows: rows.filter((_, n) => n !== index) })} className="shrink-0" />
              </div>
            ))}
            <Button size="s" icon="plus" onClick={() => onChange({ rows: [...rows, { east: null, north: null }] })} className="self-start">
              Add a corner
            </Button>
            <p className="type-caption text-text-3">Metres east and north of the middle of the roof, in order around it. Three at least.</p>
          </div>
        )}
      </section>

      <MeasurementTiles state={state} />
    </div>
  );
}
