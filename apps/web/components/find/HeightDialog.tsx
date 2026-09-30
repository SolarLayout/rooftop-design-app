"use client";

import { useEffect, useRef, useState } from "react";
import { classNames } from "@/components/ui/class-names";
import { Dialog } from "@/components/ui/Dialog";
import { INPUT, WELL } from "@/components/ui/field-look";
import { NumberField } from "@/components/ui/NumberField";
import { HEIGHT, WORD_OF_KIND, type Shape } from "@/lib/outline/obstacles";

type Props = {
  /** The shape that awaits its height; null closes the dialog. */
  shape: Shape | null;
  /** The name the obstacle gets unless another is typed. */
  suggestedName: string;
  onAdd: (name: string, height: number) => void;
  onDiscard: () => void;
};

const FIELD = classNames("flex h-11 items-center gap-2 rounded-control px-3", WELL);

/**
 * The height of a shape drawn on the map, asked right after it is done (the board "Obstacles on the map
 * and their heights"): the imagery cannot give it. Nothing is preselected: the field is empty and the
 * primary action waits for a number. Remove takes the shape off the map.
 */
export function HeightDialog({ shape, suggestedName, onAdd, onDiscard }: Props) {
  const [name, setName] = useState("");
  const [height, setHeight] = useState<number | null>(null);
  // Enter commits the field and adds in one go: the latest values, not those of the render before.
  const latest = useRef({ name, height });
  useEffect(() => {
    latest.current = { name, height };
  });

  const word = shape ? WORD_OF_KIND[shape.kind].toLowerCase() : "";

  /** The dialog closes; the next shape starts afresh. */
  function finish(tell: () => void) {
    setName("");
    setHeight(null);
    tell();
  }

  function add() {
    const { name: typed, height: given } = latest.current;
    if (given === null) return;
    finish(() => onAdd(typed, given));
  }

  const discard = () => finish(onDiscard);

  return (
    <Dialog
      open={shape !== null}
      title={`Height of the ${word}`}
      initialFocus="field"
      onClose={discard}
      actions={[
        { label: "Remove", kind: "quiet", onPress: discard },
        { label: `Add the ${word}`, kind: "primary", waits: height === null, onPress: add },
      ]}
    >
      <p>The imagery cannot give it. Enter its height above the roof surface.</p>
      <div
        className="mt-3 grid grid-cols-2 gap-field"
        onKeyDown={(event) => {
          // Enter in a field commits it (the field hears the key first), then adds the obstacle.
          if (event.key === "Enter") setTimeout(add, 0);
        }}
      >
        <label className={FIELD}>
          <span className="grow text-text-2">Name</span>
          <input type="text" value={name} placeholder={suggestedName} autoComplete="off" onChange={(event) => setName(event.target.value)} className={classNames(INPUT, "w-24 text-right")} />
        </label>
        <NumberField label="Height" value={height} unit="m" range={HEIGHT} labelInside initialFocus onCommit={setHeight} />
      </div>
    </Dialog>
  );
}
