"use client";

import { useState } from "react";
import { classNames } from "@/components/ui/class-names";
import { Dialog } from "@/components/ui/Dialog";
import { deleteQuestionOf, type DesignCard as Card } from "@/lib/home/cards";
import { onThisDeviceWordsOf } from "@/lib/home/home-view";
import { DesignCard } from "./DesignCard";

/** What is done with a design of the device, by its id. */
export type DeviceActions = {
  onOpen: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onSaveACopy: (id: string) => void;
  /** Delete was confirmed in the dialog. */
  onDelete: (id: string) => void;
};

type Props = DeviceActions & {
  /** The designs kept on this device, the newest edited first. */
  cards: readonly Card[];
  className?: string;
};

export const ON_THIS_DEVICE = "On this device";

/**
 * The section "On this device" of the approved board: its label, its words, and the cards of the designs kept here, three in
 * a row on desktop, two on tablet, one on phone. Delete asks first (decision 7): the dialog with the board's question, Cancel
 * with the focus so that Enter by mistake does no harm, Delete the primary action.
 */
export function OnThisDevice({ cards, onOpen, onRename, onDuplicate, onSaveACopy, onDelete, className }: Props) {
  const [asked, setAsked] = useState<Card | null>(null);
  const question = asked ? deleteQuestionOf(asked.name) : null;

  return (
    <section aria-label={ON_THIS_DEVICE} className={classNames("flex flex-col gap-1.5", className)}>
      <h2 className="type-section text-text-3">{ON_THIS_DEVICE}</h2>
      <p className="text-text-2">{onThisDeviceWordsOf(cards.length)}</p>
      {cards.length > 0 ? (
        <div className="mt-2.5 grid gap-3 tablet:grid-cols-2 tablet:gap-4 desktop:grid-cols-3">
          {cards.map((card) => (
            <DesignCard
              key={card.id}
              card={card}
              onOpen={() => onOpen(card.id)}
              onRename={(name) => onRename(card.id, name)}
              onDuplicate={() => onDuplicate(card.id)}
              onSaveACopy={() => onSaveACopy(card.id)}
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
