"use client";

import { SectionHeading } from "@/components/shell/help/SectionHeading";
import { SHAPES } from "@/lib/outline/shapes";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { IconButton } from "@/components/ui/IconButton";
import { NumberField } from "@/components/ui/NumberField";
import { Segmented } from "@/components/ui/Segmented";
import { CORNERS_HINT, LONG_SIDE_FACES, PLACE_HINT, placeOfPaste, type ByHand, type Row } from "@/lib/outline/by-hand";
import type { ClipboardEvent } from "react";

type Props = {
  hand: ByHand;
  /** What changed of what is entered; the screen makes the roof of it. */
  onChange: (change: Partial<ByHand>) => void;
  className?: string;
};

/** Coordinates: five decimals (docs/design/guidelines.md, "Coordinates"); north and east positive. */
const LATITUDE = { min: -90, max: 90, decimals: 5 };
const LONGITUDE = { min: -180, max: 180, decimals: 5 };
/** Lengths in a field: two decimals; the range of the desktop app (plan/reference/functional-inventory.md, 1.1). */
const LENGTH = { min: 0.1, max: 2000, decimals: 2 };
/** A corner: metres east and north of the place. */
const CORNER = { min: -5000, max: 5000, decimals: 2 };


/**
 * The roof entered by its measurements (V2 · 4; the board "Find", by hand): its length, its width and where its long side
 * faces, south, east, north or west; or a table of corners. The place is the one found, or typed; either way it stays in
 * its fields to be corrected (issue 238, item 4).
 */
export function ByHandPanel({ hand, onChange, className }: Props) {
  const rows = hand.rows;

  /** Coordinates or a maps link pasted into Latitude or Longitude fill both; anything else is the field's to read. */
  function pastePlace(event: ClipboardEvent<HTMLDivElement>) {
    const place = placeOfPaste(event.clipboardData.getData("text"));
    if (!place) return;
    event.preventDefault();
    onChange(place);
  }

  function changeRow(index: number, change: Partial<Row>) {
    onChange({ rows: rows.map((row, n) => (n === index ? { ...row, ...change } : row)) });
  }

  return (
    <div className={classNames("flex flex-col gap-4 desktop:gap-5", className)}>
      {/* The place stays while the roof is entered by hand, found or typed, so that a mistyped one can be corrected. */}
      <section className="flex flex-col gap-2.5" aria-label="Place">
        <SectionHeading help="find.section.place">Place</SectionHeading>
        {/* One under the other: a coordinate with five decimals and its label need the whole row. A pair or a maps link
            pasted into either fills both: without a map there is no search to paste it in. */}
        <div className="grid grid-cols-1 gap-field" onPaste={pastePlace}>
          <NumberField label="Latitude" value={hand.lat} unit="°" range={LATITUDE} labelInside wide onCommit={(lat) => onChange({ lat })} />
          <NumberField label="Longitude" value={hand.lon} unit="°" range={LONGITUDE} labelInside wide onCommit={(lon) => onChange({ lon })} />
        </div>
        <p className="type-body-touch desktop:type-body text-text-3">{PLACE_HINT}</p>
      </section>

      <section className="flex flex-col gap-2.5" aria-label="Shape">
        <SectionHeading help="find.section.shape" value={hand.shape}>
          Shape
        </SectionHeading>
        <Segmented label="Shape" options={SHAPES} value={hand.shape} onChange={(shape) => onChange({ shape })} fill />
        {hand.shape === "rectangle" ? (
          <div className="flex flex-col gap-field">
            <NumberField label="Length" value={hand.length} unit="m" range={LENGTH} onCommit={(length) => onChange({ length })} />
            <NumberField label="Width" value={hand.width} unit="m" range={LENGTH} onCommit={(width) => onChange({ width })} />
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-text-2">The long side faces</span>
              <Segmented
                label="The long side faces"
                options={LONG_SIDE_FACES.map(({ value, label }) => ({ value: String(value), label }))}
                value={hand.faces === null ? null : String(hand.faces)}
                onChange={(faces) => onChange({ faces: Number(faces) })}
                fill
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5" data-testid="corner-table">
            <div className="flex items-center gap-2 type-body-touch desktop:type-body text-text-3">
              <span className="w-14 shrink-0">Corner</span>
              <span className="grow basis-0 pr-6 text-right">East</span>
              <span className="grow basis-0 pr-6 text-right">North</span>
              <span className="w-9 shrink-0" />
            </div>
            {rows.map((row, index) => (
              <div key={index} data-testid="corner-row" className="flex items-center gap-2">
                <span className="w-14 shrink-0 type-body-touch desktop:type-body">{index + 1}</span>
                <NumberField label={`East of corner ${index + 1}`} labelHidden value={row.east} unit="m" range={CORNER} labelInside onCommit={(east) => changeRow(index, { east })} className="grow basis-0" />
                <NumberField label={`North of corner ${index + 1}`} labelHidden value={row.north} unit="m" range={CORNER} labelInside onCommit={(north) => changeRow(index, { north })} className="grow basis-0" />
                <IconButton label={`Remove corner ${index + 1}`} icon="bin" iconSize={16} kind="quiet" size="s" onClick={() => onChange({ rows: rows.filter((_, n) => n !== index) })} className="shrink-0" />
              </div>
            ))}
            <Button size="s" icon="plus" onClick={() => onChange({ rows: [...rows, { east: null, north: null }] })} className="self-start">
              Add a corner
            </Button>
            <p className="type-body-touch desktop:type-body text-text-3">{CORNERS_HINT}</p>
          </div>
        )}
      </section>
    </div>
  );
}
