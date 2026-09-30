"use client";

import { classNames } from "@/components/ui/class-names";
import { Segmented } from "@/components/ui/Segmented";
import type { Roof } from "@/lib/api";

export type RoofType = Roof["roof_type"];

/** The three roof types of the engine, in the words of the boards. */
export const ROOF_TYPES: { id: RoofType; name: string; short: string; caption: string }[] = [
  { id: "flat_tilted", name: "Flat, tilted rows", short: "Tilted rows", caption: "Rows facing the equator" },
  { id: "flat_ew", name: "Flat, east-west", short: "East-west", caption: "Back-to-back, low tilt" },
  { id: "sloped_flush", name: "Sloped, flush", short: "Sloped", caption: "Modules follow the roof pitch" },
];

type Props = { value: RoofType; onChange: (value: RoofType) => void; className?: string };

const CARD = classNames(
  "flex h-13 cursor-pointer items-center gap-3 rounded-row border px-3.5 text-left shadow-raised press-motion focus-ring",
  "hovered:raised-by-hover hovered:shadow-raised-hover pressed:lowered-by-press",
);
const CARD_TAKEN = "border-accent bg-note-surface";
const CARD_NOT_TAKEN = "border-line bg-control";

/** The drawing of each roof type, as the board draws it: rows, back-to-back rows, a pitched roof. */
function RoofTypeIcon({ id, taken }: { id: RoofType; taken: boolean }) {
  const path = id === "flat_tilted" ? "M1 16h26M4 14l6-5M12 14l6-5M20 14l6-5" : id === "flat_ew" ? "M1 16h26M3 14l5-4 5 4M15 14l5-4 5 4" : "M1 16 14 5l13 11M5 10.5l9-7.5 9 7.5";
  return (
    <svg viewBox="0 0 28 18" aria-hidden="true" className={classNames("h-4.5 w-7 shrink-0 fill-none stroke-icon-light", taken ? "stroke-accent" : "stroke-text-2")} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

/** The roof type: three cards on desktop, a segmented control on phone and tablet (the boards of Find). */
export function RoofTypeChoice({ value, onChange, className }: Props) {
  return (
    <div className={className}>
      <div role="group" aria-label="Roof type" className="hidden flex-col gap-1.5 desktop:flex">
        {ROOF_TYPES.map(({ id, name, caption }) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === value}
            onClick={() => onChange(id)}
            className={classNames(CARD, id === value ? CARD_TAKEN : CARD_NOT_TAKEN)}
          >
            <RoofTypeIcon id={id} taken={id === value} />
            <span className="flex grow flex-col">
              <span className="font-medium">{name}</span>
              <span className="type-caption text-text-2">{caption}</span>
            </span>
          </button>
        ))}
      </div>
      <Segmented
        label="Roof type"
        options={ROOF_TYPES.map(({ id, short }) => ({ value: id, label: short }))}
        value={value}
        onChange={onChange}
        fill
        className="desktop:hidden"
      />
    </div>
  );
}
