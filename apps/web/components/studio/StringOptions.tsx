"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { NumberField } from "@/components/ui/NumberField";
import { choiceAfterKey } from "@/components/ui/choice-keys";
import { StatusMark } from "@/components/ui/StatusMark";
import type { DesignResult, Project } from "@/lib/api";
import { customBoundsOf, customOf, refusedCardOf, type Custom } from "@/lib/studio/custom-fields";
import type { OptionCard } from "@/lib/studio/option-cards";
import type { Sized } from "@/lib/studio/strings-view";
import { SECTION } from "./inspector-look";

const CARD = "flex h-13 w-full shrink-0 cursor-pointer items-center gap-3 rounded-row border px-3 text-left focus-ring press-motion";
const CHOSEN = "border-accent bg-note-surface shadow-halo-selected";
const NOT_CHOSEN = "border-line bg-surface-1 shadow-row hovered:border-line-hover";

/** One option (docs/design/components.md, "Option card"): the letter, the caption, the numbers, the energy, the mark. */
function Card({ card, onChoose, onKeyDown }: { card: OptionCard; onChoose: () => void; onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={card.isChosen}
      tabIndex={card.isChosen ? 0 : -1}
      data-key={card.key}
      data-testid="option-card"
      className={classNames(CARD, card.isChosen ? CHOSEN : NOT_CHOSEN)}
      onClick={onChoose}
      onKeyDown={onKeyDown}
    >
      <span className={classNames("flex size-6.5 shrink-0 items-center justify-center rounded-item type-value-small font-medium", card.isChosen ? "bg-accent text-accent-ink" : "bg-control-active text-text")}>{card.letter}</span>
      <span className="flex min-w-0 grow flex-col">
        <span className="truncate type-small font-medium">{card.caption}</span>
        <span className="truncate type-value-xs text-text-2">{card.numbers}</span>
      </span>
      <span className="type-value-small font-medium">{card.energy}</span>
      <StatusMark kind={card.mark.kind} label={card.mark.label} wordsShown={false} size={16} />
    </button>
  );
}

/**
 * The options of the run (the boards "Studio, Strings lens" and "Options and your own"; plan/phase-07-plan.md,
 * decision 3): a group of which one is chosen; a press or an arrow key chooses another, at once, from the run's
 * answer.
 */
export function OptionCards({ cards, onChoose }: { cards: readonly OptionCard[]; onChoose: (key: string) => void }) {
  const heading = useId();
  const group = useRef<HTMLDivElement>(null);
  if (cards.length === 0) return null;
  const keys = cards.map((card) => card.key);
  const chosen = cards.find((card) => card.isChosen)?.key ?? keys[0]!;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const to = choiceAfterKey(keys, chosen, event.key);
    if (to === null) return;
    event.preventDefault();
    onChoose(to);
    group.current?.querySelector<HTMLButtonElement>(`[data-key="${to}"]`)?.focus();
  }

  return (
    <section aria-labelledby={heading} className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <h2 id={heading} className={SECTION}>
          Options
        </h2>
        <span className="ml-auto type-caption whitespace-nowrap text-text-3">series × strings · kWp · DC/AC · MWh</span>
      </div>
      <div ref={group} role="radiogroup" aria-labelledby={heading} className="flex flex-col gap-1.5">
        {cards.map((card) => (
          <Card key={card.key} card={card} onChoose={() => onChoose(card.key)} onKeyDown={onKeyDown} />
        ))}
      </div>
    </section>
  );
}

/**
 * The options of the Strings lens where there are none to offer (the board "Options and your own", "No string
 * length fits"): the engine's words stand under the bar as its verdict; here what can change it.
 */
export function NothingFits({ view }: { view: Sized }) {
  const heading = useId();
  if (!view.noOptions?.change) return null;
  return (
    <section aria-labelledby={heading} className="flex flex-col gap-2">
      <h2 id={heading} className={SECTION}>
        Options
      </h2>
      <p data-testid="nothing-fits" className="rounded-row border border-line bg-surface-1 px-4 py-3 text-center type-small text-text-2">
        {view.noOptions.change}
      </p>
    </section>
  );
}

const ADD = "flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-row border border-dashed border-line-strong type-small text-text-2 focus-ring hovered:border-line-hover hovered:text-text";

type YourOwnProps = {
  document: Project;
  design: DesignResult;
  onSave: (custom: Custom) => void;
  onRemove: () => void;
};

/** The three fields of your own option, begun from the chosen one or its own, each bounded by what fits (decision 9). */
function CustomFields({ first, design, action, onSave, onCancel }: { first: Custom; design: DesignResult; action: string; onSave: (custom: Custom) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Custom>(first);
  const bounds = customBoundsOf(design, draft);
  const set = (at: 0 | 1 | 2) => (value: number) => setDraft((before) => before.map((one, index) => (index === at ? value : one)) as Custom);
  const heading = useId();
  return (
    <section aria-labelledby={heading} data-testid="custom-fields" className="flex flex-col gap-2 rounded-row border border-line bg-surface-1 p-3.5 shadow-card">
      <div className="flex items-center gap-3">
        <h3 id={heading} className="type-small font-medium">
          Your own
        </h3>
        <span className="ml-auto type-caption text-text-3">series × strings × inverters</span>
      </div>
      <NumberField label="Series" detail={bounds.series.hint} value={draft[0]} range={bounds.series.range} onCommit={set(0)} initialFocus />
      <NumberField label="Strings" detail={bounds.strings.hint} value={draft[1]} range={bounds.strings.range} onCommit={set(1)} />
      <NumberField label="Inverters" detail={bounds.inverters.hint} value={draft[2]} range={bounds.inverters.range} onCommit={set(2)} />
      <div className="flex justify-end gap-2 pt-1">
        <Button kind="quiet" size="s" onClick={onCancel}>
          Cancel
        </Button>
        <Button kind="primary" size="s" onClick={() => onSave(draft)}>
          {action}
        </Button>
      </div>
    </section>
  );
}

/**
 * Your own option (the board "Options and your own"; plan/phase-07-plan.md, decisions 8 and 9): Add your own while
 * there is none; its fields to add or change it; Change and Remove under its card, or under the engine's words
 * when the engine could not build it.
 */
export function YourOwn({ document, design, onSave, onRemove }: YourOwnProps) {
  const [isEditing, setEditing] = useState(false);
  const refused = refusedCardOf(document, design);
  const save = (custom: Custom) => {
    setEditing(false);
    onSave(custom);
  };
  if (isEditing) return <CustomFields first={customOf(document, design)} design={design} action={document.custom ? "Change" : "Add"} onSave={save} onCancel={() => setEditing(false)} />;
  if (!document.custom) {
    return (
      <button type="button" className={ADD} onClick={() => setEditing(true)}>
        <Icon name="plus" size={14} />
        Add your own
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {refused ? (
        <div data-testid="custom-refused" className="flex items-start gap-3 rounded-row border border-note-line bg-surface-1 p-3">
          <span className="flex size-6.5 shrink-0 items-center justify-center rounded-item bg-control-active type-value-small font-medium">{refused.letter}</span>
          <span className="flex min-w-0 grow flex-col gap-1">
            <span className="type-small font-medium">Your own</span>
            <span className="type-value-xs text-text-2">{refused.numbers}</span>
            <span className="type-caption font-medium text-text">{refused.title}</span>
            <span className="type-caption text-text-2">{refused.detail}</span>
          </span>
          <StatusMark kind="note" label={refused.title} wordsShown={false} size={16} />
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button kind="quiet" size="s" onClick={() => setEditing(true)}>
          Change
        </Button>
        <Button kind="quiet" size="s" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>
  );
}

/**
 * The engine's note on the options: the target and how many strings an inverter takes; after its " ! ", the options
 * that miss the target, with a note mark (the desktop app's way of saying it).
 */
export function OptionsNote({ note }: { note: string | null }) {
  if (!note) return null;
  const [about, missed] = note.split(" ! ");
  return (
    <div data-testid="options-note" className="flex flex-col gap-1.5 type-caption text-text-3">
      <p>{about}</p>
      {missed ? (
        <p className="flex items-start gap-2 text-text-2">
          <StatusMark kind="note" label="Outside the DC/AC target" wordsShown={false} size={14} />
          {missed}
        </p>
      ) : null}
    </div>
  );
}
