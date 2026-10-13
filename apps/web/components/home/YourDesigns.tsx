"use client";

import Image from "next/image";
import { useState } from "react";
import { classNames } from "@/components/ui/class-names";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/TextField";
import { NAME_RULES } from "@/lib/flow/name-field";
import { deleteQuestionOf, type DesignCard as Row } from "@/lib/home/cards";
import { DEMO, DEMO_PICTURE, DESIGN_COLUMNS, designsHeadOf } from "@/lib/home/home-view";
import { DesignMenu } from "./DesignMenu";

/** What is done with a design of the device, by its id. */
export type DeviceActions = {
  onOpen: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDownload: (id: string) => void;
  /** Delete was confirmed in the dialog. */
  onDelete: (id: string) => void;
};

type Props = DeviceActions & {
  /** The designs kept on this device, the newest edited first. */
  cards: readonly Row[];
  /** Open the demo, its row pressed. */
  onOpenDemo: () => void;
  className?: string;
};

const PRESS = "cursor-pointer press-motion focus-ring";
// A row: on desktop the columns of the table (`columns-designs`), 72 high; under it the plan, the name with the place and the
// energy under it, and the menu, at least 72 high.
// The whole row opens its design (the owner, 2026-10-13); its buttons are there for the keyboard, their press the row's.
const ROW = "flex min-h-18 cursor-pointer items-center gap-3 px-3 transition-colors duration-press hovered:bg-surface-1 desktop:grid desktop:h-18 desktop:grid-cols-designs desktop:gap-4 desktop:px-4.5";
const THUMB = classNames("block h-12 w-16 shrink-0 overflow-hidden rounded-control bg-surface-2 desktop:w-18 *:size-full", PRESS);
const FIGURE = "hidden text-right type-mono text-text desktop:block";
const HEAD = "hidden h-10 items-center gap-4 border-b border-line-subtle px-4.5 type-unit text-text-3 desktop:grid desktop:grid-cols-designs";

/**
 * Your designs · on this device (D120: direction B's table in direction A's Home): the head with how many, then a row each,
 * the demo first and marked Demo, then the designs kept here, the newest edited first. On desktop the plan, the design, the
 * place, kWp, MWh a year, when it was edited and its menu; on phone and tablet the plan, the name, the place and the energy,
 * the menu. The plan and the name open the design; Rename turns the name into its field in place; Delete asks first.
 */
export function YourDesigns({ cards, onOpenDemo, onOpen, onRename, onDuplicate, onDownload, onDelete, className }: Props) {
  const [asked, setAsked] = useState<Row | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const question = asked ? deleteQuestionOf(asked.name) : null;
  const head = designsHeadOf(cards.length);
  const [title, where] = head.title.split(" · ");

  return (
    <section aria-label={head.title} data-testid="your-designs" className={classNames("flex flex-col gap-3.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="type-title-touch desktop:type-title">
          {title} <span className="type-body-touch text-text-3 desktop:type-section">· {where}</span>
        </h2>
        {head.count ? <span className="type-mono text-text-3">{head.count}</span> : null}
      </div>
      <div role="table" aria-label={head.title} className="overflow-hidden rounded-card border border-line-subtle bg-ground">
        <div role="row" className={HEAD}>
          <span role="columnheader" aria-label="Plan" />
          {DESIGN_COLUMNS.map((column) => (
            <span key={column} role="columnheader" className={column === "kWp" || column === "MWh per year" || column === "Edited" ? "text-right" : undefined}>
              {column}
            </span>
          ))}
          <span role="columnheader" aria-label="Menu" />
        </div>

        <div role="row" data-testid="demo-row" onClick={onOpenDemo} className={classNames(ROW, "bg-accent/4 hovered:bg-accent/8", cards.length > 0 && "border-b border-line-subtle")}>
          <button type="button" role="cell" aria-label={`${DEMO.action}: ${DEMO.name}`} className={THUMB}>
            {/* The demo's own picture, the hero's: the roof as Present shows it. */}
            <Image src={DEMO_PICTURE} alt="" width={144} height={96} className="size-full object-cover" />
          </button>
          <span role="cell" className="flex min-w-0 grow flex-col desktop:flex-row desktop:items-center desktop:gap-2.5">
            <button type="button" className={classNames("flex min-w-0 items-center gap-2 rounded-control text-left type-strong-touch desktop:type-strong", PRESS)}>
              <span className="truncate">{DEMO.name}</span>
              <span className="inline-flex h-5.5 items-center rounded-control bg-accent/14 px-2 type-unit text-accent">{DEMO.badge}</span>
            </button>
            <span className="type-body-touch text-text-2 desktop:hidden">
              {DEMO.place} · {DEMO.mwh} MWh
            </span>
          </span>
          <span role="cell" className="hidden truncate type-body text-text-2 desktop:block">
            {DEMO.place}
          </span>
          <span role="cell" className={FIGURE}>
            {DEMO.kwp}
          </span>
          <span role="cell" className={FIGURE}>
            {DEMO.mwh}
          </span>
          <span role="cell" className="shrink-0 text-right">
            <button type="button" className={classNames("rounded-control type-strong-touch text-accent desktop:type-strong hovered:text-accent-hover", PRESS)}>
              <span className="desktop:hidden">{DEMO.open}</span>
              <span className="hidden desktop:inline">{DEMO.action}</span>
            </button>
          </span>
          <span role="cell" className="hidden desktop:block" />
        </div>

        {cards.map((card, index) => (
          <div key={card.id} role="row" data-testid="design-row" onClick={() => renaming !== card.id && onOpen(card.id)} className={classNames(ROW, index < cards.length - 1 && "border-b border-line-subtle")}>
            {/* The plan is the app's own SVG, kept with the design on this device (lib/device/thumbnail.ts): its colours are classes of the page's tokens. */}
            <button type="button" role="cell" aria-label={`Open ${card.name}`} className={THUMB} dangerouslySetInnerHTML={{ __html: card.thumbnail }} />
            <span role="cell" className="flex min-w-0 grow flex-col">
              {renaming === card.id ? (
                <span
                  className="min-w-0"
                  onKeyDown={(event) => {
                    // Escape gives the name back and closes the field.
                    if (event.key !== "Escape") return;
                    event.preventDefault();
                    setRenaming(null);
                  }}
                >
                  <TextField label="Name" labelHidden value={card.name} {...NAME_RULES} initialFocus onCommit={(name) => onRename(card.id, name)} onDone={(said) => said === null && setRenaming(null)} />
                </span>
              ) : (
                <button type="button" className={classNames("min-w-0 truncate rounded-control text-left type-strong-touch desktop:type-strong hovered:text-text-2", PRESS)}>
                  {card.name}
                </button>
              )}
              <span className="type-body-touch text-text-2 desktop:hidden">{card.mwh === null ? card.place : `${card.place} · ${card.mwh} MWh`}</span>
              <span className="hidden truncate type-unit text-text-3 desktop:block">{card.roofWords}</span>
            </span>
            <span role="cell" className="hidden truncate type-body text-text-2 desktop:block">
              {card.place}
            </span>
            <span role="cell" className={FIGURE}>
              {card.kwp}
            </span>
            <span role="cell" className={FIGURE}>
              {card.mwh}
            </span>
            <span role="cell" className="hidden text-right type-body text-text-3 desktop:block">
              {card.edited}
            </span>
            {/* The menu and its rows do what they say; they do not open the design. */}
            <span role="cell" className="shrink-0" onClick={(event) => event.stopPropagation()}>
              <DesignMenu
                name={card.name}
                does={{
                  open: () => onOpen(card.id),
                  rename: () => setRenaming(card.id),
                  duplicate: () => onDuplicate(card.id),
                  download: () => onDownload(card.id),
                  delete: () => setAsked(card),
                }}
              />
            </span>
          </div>
        ))}
      </div>
      <Dialog
        open={asked !== null}
        title={question?.title ?? ""}
        onClose={() => setAsked(null)}
        actions={[
          { label: "Cancel", kind: "quiet", onPress: () => setAsked(null) },
          {
            label: "Delete",
            kind: "primary",
            onPress: () => {
              if (asked) onDelete(asked.id);
              setAsked(null);
            },
          },
        ]}
      >
        <p>{question?.body}</p>
      </Dialog>
    </section>
  );
}
