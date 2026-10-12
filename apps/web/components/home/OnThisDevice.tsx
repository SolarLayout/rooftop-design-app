"use client";

import { useState } from "react";
import { classNames } from "@/components/ui/class-names";
import { Dialog } from "@/components/ui/Dialog";
import { deleteQuestionOf, type DesignCard as Card } from "@/lib/home/cards";
import { designsHeadOf } from "@/lib/home/home-view";
import { DesignCard } from "./DesignCard";

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
  cards: readonly Card[];
  className?: string;
};

/**
 * Your designs · on this device (V2 · 9, D105): the head with how many, and the cards of the designs kept here, three in a
 * row on desktop, two on tablet, one on phone. Delete asks first (decision 7): the dialog with the board's question, Cancel
 * with the focus so that Enter by mistake does no harm, Delete the primary action.
 */
export function OnThisDevice({ cards, onOpen, onRename, onDuplicate, onDownload, onDelete, className }: Props) {
  const [asked, setAsked] = useState<Card | null>(null);
  const question = asked ? deleteQuestionOf(asked.name) : null;
  const head = designsHeadOf(cards.length);

  return (
    <section aria-label={head.title} data-testid="your-designs" className={classNames("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="type-section">{head.title}</h2>
        <span className="type-body-touch desktop:type-body text-text-2">{head.count}</span>
      </div>
      {cards.length > 0 ? (
        <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {cards.map((card) => (
            <DesignCard
              key={card.id}
              card={card}
              onOpen={() => onOpen(card.id)}
              onRename={(name) => onRename(card.id, name)}
              onDuplicate={() => onDuplicate(card.id)}
              onDownload={() => onDownload(card.id)}
              onDelete={() => setAsked(card)}
            />
          ))}
        </div>
      ) : null}
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
