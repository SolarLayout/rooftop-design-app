"use client";

import { SectionHeading } from "@/components/shell/help/SectionHeading";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { NumberField } from "@/components/ui/NumberField";
import { choiceAfterKey } from "@/components/ui/choice-keys";
import { StatusMark } from "@/components/ui/StatusMark";
import type { DesignResult, Project } from "@/lib/api";
import { customBoundsOf, customOf, customVerdictOf, refusedCardOf, type Custom } from "@/lib/studio/custom-fields";
import { foldedWordsOf, type OptionCard } from "@/lib/studio/option-cards";
import type { FitProof } from "@/lib/studio/fit-proof";
import type { SeriesBar } from "@/lib/studio/series-bar";
import { measures } from "@/components/ui/measures";
import { withTrueMinus } from "@/components/shell/notes-view";
import { optionsRulesOf } from "@/lib/studio/options-rules";
import { byCount } from "@/lib/words/plural";
import type { Sized } from "@/lib/studio/strings-view";

const CARD = "flex w-full shrink-0 cursor-pointer items-center gap-3 rounded-row p-3 text-left focus-ring press-motion";
const FRAME = "flex flex-col rounded-row border";
const CHOSEN = "border-accent bg-note-surface shadow-halo-selected";
const NOT_CHOSEN = "border-line bg-surface-1 shadow-row hovered:border-line-hover";

/** One option (docs/design/components.md, "Option card"): the letter, why it is there, the facts, the energy, the mark. */
function Card({ card, onChoose, onKeyDown }: { card: OptionCard; onChoose: () => void; onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={card.isChosen}
      tabIndex={card.isChosen ? 0 : -1}
      data-key={card.key}
      data-testid="option-card"
      className={CARD}
      onClick={onChoose}
      onKeyDown={onKeyDown}
    >
      <span className={classNames("flex size-6.5 shrink-0 items-center justify-center rounded-control type-mono-touch desktop:type-mono font-medium", card.isChosen ? "bg-accent text-accent-ink" : "bg-control-active text-text")}>{card.letter}</span>
      <span className="flex min-w-0 grow flex-col">
        <span className="truncate type-body-touch desktop:type-body font-medium">{card.caption}</span>
        <span className="truncate type-body-touch desktop:type-body text-text-2">{card.facts}</span>
      </span>
      <span className="flex items-baseline gap-1">
        <span className="type-mono-touch desktop:type-mono font-medium">{card.energy}</span>
        <span className="type-unit text-text-3">MWh</span>
      </span>
      <StatusMark kind={card.mark.kind} label={card.mark.label} wordsShown={false} size={16} />
    </button>
  );
}

/** The proof behind Why: the lengths that fit at the voltage on a track, then the coldest morning and the hottest afternoon in plain words. */
function Proof({ proof, bar }: { proof: FitProof; bar: SeriesBar }) {
  return (
    <div data-testid="fit-proof" className="mx-3 mb-3 flex flex-col gap-3 rounded-control bg-well px-3 py-3 type-body-touch desktop:type-body">
      <p>{proof.heading}</p>
      <div className="flex flex-col gap-1">
        <div className="relative h-2 rounded-full bg-surface-2">
          {bar.band ? <div className="absolute top-0 left-at h-2 w-span rounded-full bg-ok opacity-band" style={measures({ at: bar.band.from, span: bar.band.to - bar.band.from })} /> : null}
          {bar.marker !== null ? <div className="absolute -top-1 left-at h-4 w-1 -translate-x-1/2 rounded-full bg-accent" style={measures({ at: bar.marker })} /> : null}
        </div>
        <div className="flex justify-between type-unit text-text-2">
          <span>{proof.atLeast}</span>
          <span>{proof.atMost}</span>
        </div>
      </div>
      {[proof.coldest, proof.hottest].map((one) => (
        <p key={one.when} className="flex flex-col gap-0.5">
          <span className="text-text-2">{one.when}</span>
          <span>{one.result}</span>
        </p>
      ))}
      {proof.detail ? <p className="text-text-2">{byCount(withTrueMinus(proof.detail))}</p> : null}
    </div>
  );
}

/** Under the chosen card: that it fits, in one line, and Why, which opens the proof. */
function Fits({ proof, bar }: { proof: FitProof; bar: SeriesBar }) {
  const [isOpen, setOpen] = useState(false);
  const body = useId();
  return (
    <>
      <div className="flex items-start gap-2 px-3 pb-3 pl-12.5">
        <span className="flex pt-0.5">
          <StatusMark kind={proof.fits.kind} label={proof.fits.kind === "fits" ? "Fits" : "Has a note"} wordsShown={false} size={16} />
        </span>
        <span data-testid="fit-line" className="grow type-body-touch desktop:type-body">
          {proof.fits.words}
        </span>
        <button type="button" aria-expanded={isOpen} aria-controls={body} onClick={() => setOpen((open) => !open)} className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-control type-body-touch desktop:type-body text-text-2 focus-ring hovered:text-text">
          Why
          <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={14} />
        </button>
      </div>
      {isOpen ? (
        <div id={body}>
          <Proof proof={proof} bar={bar} />
        </div>
      ) : null}
    </>
  );
}

type OptionCardsProps = {
  cards: readonly OptionCard[];
  /** The proof that the chosen length fits; none before the range is known. */
  proof: FitProof | null;
  bar: SeriesBar | null;
  onChoose: (key: string) => void;
};

/**
 * The options of the run, best first (V2 · 6, D102; the board "The Strings step"): a group of which one is chosen; a press
 * or an arrow key chooses another, at once, from the run's answer. Each says why it is there; the chosen one says that it
 * fits, with Why opening the proof. The options that miss the DC/AC target fold under one line.
 */
export function OptionCards({ cards, proof, bar, onChoose }: OptionCardsProps) {
  const heading = useId();
  const group = useRef<HTMLDivElement>(null);
  const folded = cards.filter((card) => card.miss !== null);
  const shown = cards.filter((card) => card.miss === null);
  // Every option misses the target: none to put first, so none is folded.
  const folds = shown.length > 0 && folded.length > 0;
  const [isFoldedOpen, setFoldedOpen] = useState(folded.some((card) => card.isChosen));
  if (cards.length === 0) return null;
  const visible = folds && !isFoldedOpen ? shown : cards;
  const keys = visible.map((card) => card.key);
  const chosen = cards.find((card) => card.isChosen)?.key ?? keys[0]!;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const to = choiceAfterKey(keys, chosen, event.key);
    if (to === null) return;
    event.preventDefault();
    onChoose(to);
    group.current?.querySelector<HTMLButtonElement>(`[data-key="${to}"]`)?.focus();
  }

  const frame = (card: OptionCard) => (
    <div key={card.key} className={classNames(FRAME, card.isChosen ? CHOSEN : NOT_CHOSEN)}>
      <Card card={card} onChoose={() => onChoose(card.key)} onKeyDown={onKeyDown} />
      {card.isChosen && proof && bar ? <Fits proof={proof} bar={bar} /> : null}
    </div>
  );

  return (
    <section aria-labelledby={heading} className="flex flex-col gap-1.5">
      <SectionHeading id={heading} help="studio.section.options">
        Options
      </SectionHeading>
      <div ref={group} role="radiogroup" aria-labelledby={heading} className="flex flex-col gap-1.5">
        {shown.map(frame)}
        {folds ? (
          <button type="button" aria-expanded={isFoldedOpen} data-testid="options-folded" onClick={() => setFoldedOpen((open) => !open)} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-row type-body-touch desktop:type-body text-text-2 focus-ring hovered:text-text">
            <StatusMark kind="note" label="Below the DC/AC target" wordsShown={false} size={14} />
            {foldedWordsOf(folded)}
            <Icon name={isFoldedOpen ? "chevron-up" : "chevron-down"} size={14} />
          </button>
        ) : null}
        {folds ? (isFoldedOpen ? folded.map(frame) : null) : folded.map(frame)}
      </div>
    </section>
  );
}

/** The options while the strings are sized for the first time: their heading, and three blocks where the cards will stand (V2 · 5). */
export function OptionsWaiting() {
  const heading = useId();
  return (
    <section aria-labelledby={heading} data-testid="options-waiting" className="flex flex-col gap-1.5">
      <SectionHeading id={heading} help="studio.section.options">
        Options
      </SectionHeading>
      {[0, 1, 2].map((one) => (
        <span key={one} aria-hidden="true" className="block h-14 rounded-row bg-surface-2 breathing" />
      ))}
    </section>
  );
}

/**
 * Too few positions for an option, or none (the board "Options and your own"): the API's words, in the place of the
 * options. Where no string length fits, the problem at the step's head says it (V2 · 5) and nothing stands here.
 */
export function NothingFits({ view }: { view: Sized }) {
  const heading = useId();
  if (!view.noOptions || view.noOptions.noLengthFits) return null;
  const { title, message } = view.noOptions;
  return (
    <section aria-labelledby={heading} className="flex flex-col gap-2">
      <SectionHeading id={heading} help="studio.section.options">
        Options
      </SectionHeading>
      {/* Too few positions, or none: the API's words, the verdict under the bar having none to say (step 21). */}
      <p data-testid="no-options" className="flex items-start gap-2.5 rounded-row border border-note-line bg-surface-1 px-4 py-3 type-body-touch desktop:type-body">
        <StatusMark kind="note" label={title} wordsShown={false} size={16} />
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">{title}</span>
          <span className="type-body-touch desktop:type-body text-text-2">{message}</span>
        </span>
      </p>
    </section>
  );
}

const ADD = "flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-row border border-dashed border-line-strong type-body-touch desktop:type-body text-text-2 focus-ring hovered:border-line-hover hovered:text-text";

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
  const verdict = customVerdictOf(design, draft);
  const set = (at: 0 | 1 | 2) => (value: number) => setDraft((before) => before.map((one, index) => (index === at ? value : one)) as Custom);
  const heading = useId();
  return (
    <section aria-labelledby={heading} data-testid="custom-fields" className="flex flex-col gap-2 rounded-row border border-line bg-surface-1 p-3.5 shadow-card">
      <div className="flex items-center gap-3">
        <h3 id={heading} className="type-body-touch desktop:type-body font-medium">
          Your own option
        </h3>
      </div>
      <NumberField label="Modules a string" detail={bounds.series.hint} value={draft[0]} range={bounds.series.range} onCommit={set(0)} initialFocus />
      <NumberField label="Strings" detail={bounds.strings.hint} value={draft[1]} range={bounds.strings.range} onCommit={set(1)} />
      <NumberField label="Inverters" detail={bounds.inverters.hint} value={draft[2]} range={bounds.inverters.range} onCommit={set(2)} />
      <p data-testid="custom-verdict" className="flex items-center gap-2 pt-1 type-body-touch desktop:type-body text-text-2">
        <StatusMark kind={verdict.kind} label={verdict.kind === "fits" ? "Fits" : "Outside the DC/AC target"} wordsShown={false} size={16} />
        {verdict.words}
      </p>
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
  if (isEditing) return <CustomFields first={customOf(document, design)} design={design} action={document.custom ? "Change option" : "Add option"} onSave={save} onCancel={() => setEditing(false)} />;
  if (!document.custom) {
    return (
      <button type="button" className={ADD} onClick={() => setEditing(true)}>
        <Icon name="plus" size={14} />
        Add your own option
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {refused ? (
        <div data-testid="custom-refused" className="flex items-start gap-3 rounded-row border border-note-line bg-surface-1 p-3">
          <span className="flex size-6.5 shrink-0 items-center justify-center rounded-control bg-control-active type-mono-touch desktop:type-mono font-medium">{refused.letter}</span>
          <span className="flex min-w-0 grow flex-col gap-1">
            <span className="type-body-touch desktop:type-body font-medium">Your own</span>
            <span className="type-body-touch desktop:type-body text-text-2">{refused.numbers}</span>
            <span className="type-body-touch desktop:type-body font-medium text-text">{refused.title}</span>
            <span className="type-body-touch desktop:type-body text-text-2">{refused.detail}</span>
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
 * How the options are made (V2 · 6, D102; audit V2-29): a line that opens three numbered lines, read from the engine's note
 * on the options, and one for the options that miss the DC/AC target. The paragraph of rules under the options is gone.
 */
export function HowTheOptionsAreMade({ note, options }: { note: string | null; options: DesignResult["options"] }) {
  const [isOpen, setOpen] = useState(false);
  const body = useId();
  if (!note) return null;
  const rules = optionsRulesOf(note, options);
  return (
    <div data-testid="options-rules" className="flex flex-col gap-2">
      <button type="button" aria-expanded={isOpen} aria-controls={body} onClick={() => setOpen((open) => !open)} className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-1 rounded-control type-body-touch desktop:type-body text-text-2 focus-ring hovered:text-text desktop:min-h-0">
        How the options are made
        <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={14} />
      </button>
      {isOpen ? (
        <div id={body} className="flex flex-col gap-2 rounded-row border border-line bg-surface-1 p-3.5 type-body-touch desktop:type-body">
          <ol className="flex list-decimal flex-col gap-1.5 pl-5">
            {rules.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          {rules.missed ? <p className="text-text-2">{rules.missed}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
