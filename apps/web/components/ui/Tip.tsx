import type { ReactNode } from "react";
import { Button } from "./Button";
import { classNames } from "./class-names";
import { IconButton } from "./IconButton";

/** A row of a tip: the key or the gesture, in its chip, and what it does. */
export type TipRowOf = { key: string; does: string };

type Props = {
  title: string;
  rows: readonly TipRowOf[];
  /** Got it: the tip is gone for good. */
  onGotIt: () => void;
  /** The ×: the tips are hidden for now. */
  onClose: () => void;
  /** The way into the how-to of the move (D81): Show me how, beside Got it. */
  howTo?: ReactNode;
  className?: string;
};

const CARD = "flex flex-col gap-2.5 rounded-row border border-line-strong bg-surface-1 px-3.5 pt-3.5 pb-3 shadow-float";
const CHIP = "min-w-15.5 shrink-0 rounded-control border border-line-strong px-1.5 text-center type-unit font-semibold text-text";

/**
 * A small card that shows how to do a move the screen has just made possible (components.md, "Tip"; D79): the title
 * with an accent dot, two to four rows of a key or a gesture and what it does, Show me how where its move has a how-to,
 * Got it. It takes no focus.
 */
export function Tip({ title, rows, onGotIt, onClose, howTo, className }: Props) {
  return (
    <section role="note" aria-label={title} className={classNames(CARD, className)}>
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-accent" />
        <h2 className="grow type-body-touch desktop:type-body font-semibold text-text">{title}</h2>
        <IconButton label="Hide the tips" icon="close" iconSize={14} kind="quiet" size="xs" onClick={onClose} className="-my-2 -mr-2 text-text-3" />
      </div>
      <ul className="flex flex-col gap-2.5">
        {rows.map(({ key, does }) => (
          <li key={key} className="flex items-start gap-2.5">
            <kbd className={CHIP}>{key}</kbd>
            <span className="type-body-touch desktop:type-body text-text-2">{does}</span>
          </li>
        ))}
      </ul>
      <div className={classNames("flex items-center", howTo ? "justify-between" : "justify-end")}>
        {howTo}
        <Button kind="secondary" size="xs" onClick={onGotIt}>
          Got it
        </Button>
      </div>
    </section>
  );
}
