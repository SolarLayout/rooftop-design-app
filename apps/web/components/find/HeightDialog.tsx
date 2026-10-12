"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { LIST_GAP } from "@/components/ui/design-numbers";
import { measures } from "@/components/ui/measures";
import { NumberField } from "@/components/ui/NumberField";
import { placeOf, type Box } from "@/components/ui/place-floating";
import { HEIGHT, WORD_OF_KIND, type Shape } from "@/lib/outline/obstacles";

type Props = {
  /** The shape that awaits its height; null closes the card. */
  shape: Shape | null;
  /** Where the shape stands on the screen; null while it is not known. */
  anchor: Box | null;
  onAdd: (height: number) => void;
  onDiscard: () => void;
};

/**
 * The height of a shape drawn on the map, asked beside it right after it is drawn (V2 · 4; the board "Find"): its kind,
 * Height above the roof with its field, Cancel and Add. Nothing is preselected: Add waits for a number. Escape cancels,
 * Enter adds. The shape takes the name of its kind and its count; it is renamed in the Studio.
 */
export function HeightDialog({ shape, anchor, onAdd, onDiscard }: Props) {
  const [height, setHeight] = useState<number | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{ x: number; y: number } | null>(null);
  // Enter commits the field and adds in one go: the latest value, not that of the render before.
  const latest = useRef(height);
  useEffect(() => {
    latest.current = height;
  });

  useLayoutEffect(() => {
    if (!shape || !anchor || !card.current) return setPlace(null);
    const { width, height: tall } = card.current.getBoundingClientRect();
    card.current.querySelector("input")?.focus({ preventScroll: true });
    const { x, y } = placeOf({ anchor, size: { width, height: tall }, screen: { width: window.innerWidth, height: window.innerHeight }, side: "right", align: "middle", gap: LIST_GAP });
    setPlace({ x, y });
  }, [shape, anchor]);

  if (!shape) return null;

  function finish(tell: () => void) {
    setHeight(null);
    tell();
  }

  function add() {
    const given = latest.current;
    if (given === null) return;
    finish(() => onAdd(given));
  }

  return (
    <div
      ref={card}
      role="dialog"
      aria-label={`Height of the ${WORD_OF_KIND[shape.kind].toLowerCase()}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") finish(onDiscard);
        // Enter in the field commits it (the field hears the key first), then adds the obstacle.
        if (event.key === "Enter") setTimeout(add, 0);
      }}
      // Unseen until it is placed beside the shape, so that it never shows elsewhere first.
      className={classNames("placed z-dialog flex w-64 flex-col gap-3 rounded-card border border-line bg-surface-1 p-4 shadow-float", place === null && "invisible")}
      style={measures(place ?? { x: 0, y: 0 })}
    >
      <p className="font-medium">{WORD_OF_KIND[shape.kind]}</p>
      <NumberField label="Height above the roof" value={height} unit="m" range={HEIGHT} onCommit={setHeight} />
      <div className="flex justify-end gap-2">
        <Button kind="quiet" size="s" onClick={() => finish(onDiscard)}>
          Cancel
        </Button>
        <Button kind="primary" size="s" aria-disabled={height === null || undefined} onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}
