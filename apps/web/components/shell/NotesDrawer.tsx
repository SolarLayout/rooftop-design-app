"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { NumberField } from "@/components/ui/NumberField";
import { SheetGrip } from "@/components/ui/SheetGrip";
import { introOf, keepWordsOf, NOTE_FIELD_RANGES, reviewTitleOf, type Note, type NoteFieldId } from "./notes-view";

type PanelProps = {
  notes: readonly Note[];
  onClose: () => void;
  onTryAgain: () => void;
  /** A value entered in a note's field, or kept: it is an edit of the design like any other, and the run follows. */
  onEnterValue: (id: NoteFieldId, value: number) => void;
  /** The name of the title in the page. */
  titleId: string;
};

// Phone: a bottom sheet. Tablet and desktop: from the right, as wide as the inspector, over it.
const PANEL = classNames(
  "flex max-h-3/4 w-full flex-col rounded-t-panel border border-b-0 border-line bg-chrome",
  "tablet:max-h-none tablet:w-inspector tablet:rounded-none tablet:border-0 tablet:border-l tablet:pr-safe-0 tablet:shadow-drawer",
);

function NoteRow({ note, onClose, onTryAgain, onEnterValue }: { note: Note } & Pick<PanelProps, "onClose" | "onTryAgain" | "onEnterValue">) {
  const { action, field } = note;
  return (
    <li className="flex gap-3 rounded-row border border-note-line bg-note-surface p-3.5">
      <span className="flex pt-px">
        <Icon name="note" size={20} label="Note" className="text-accent" />
      </span>
      <span className="flex min-w-0 grow flex-col gap-1">
        <span className="font-medium">{note.title}</span>
        <span className="type-body-touch desktop:type-body text-text-2">{note.reason}</span>
        {field ? (
          // The value is put right where it is read (V2 · 5): the field in the note, and Keep when the value is right.
          <span className="mt-2 flex flex-col gap-2">
            <NumberField label={field.label} detail={`${field.source} · ${note.where.split(" · ").at(-1) ?? ""}`} value={field.value} unit={field.unit} range={NOTE_FIELD_RANGES[field.id]} onCommit={(value) => onEnterValue(field.id, value)} />
            <Button
              kind="quiet"
              size="s"
              className="self-center"
              onClick={() => {
                onEnterValue(field.id, field.value);
                onClose();
              }}
            >
              {keepWordsOf(field)}
            </Button>
          </span>
        ) : null}
        <span className={field ? undefined : "mt-1.5 flex items-center gap-2.5"}>
          {field ? null : <span className="grow type-body-touch desktop:type-body text-text-3">{note.where}</span>}
          {field ? null : action.kind === "open" ? (
            <ButtonLink size="s" href={action.path} onClick={onClose}>
              {action.label}
            </ButtonLink>
          ) : (
            <Button
              size="s"
              onClick={() => {
                onClose();
                onTryAgain();
              }}
            >
              {action.label}
            </Button>
          )}
        </span>
      </span>
    </li>
  );
}

/** What is seen of the notes: their count, and each with its reason and where it leads. */
export function NotesPanel({ notes, onClose, onTryAgain, onEnterValue, titleId }: PanelProps) {
  const intro = introOf(notes);
  return (
    <div data-testid="notes-panel" data-drawer-panel className={PANEL}>
      <SheetGrip onClose={onClose} className="tablet:hidden" />
      <div className="flex shrink-0 items-center gap-2.5 pt-3 pr-2.5 pb-3 pl-4 tablet:pt-4.5 tablet:pr-3.5 tablet:pl-5">
        <h2 id={titleId} data-count={notes.length} className="grow type-title-touch desktop:type-title">
          {reviewTitleOf(notes.length)}
        </h2>
        <IconButton data-close kind="quiet" size="s" icon="close" iconSize={18} label="Close" onClick={onClose} />
      </div>
      {intro === null ? null : <p className="shrink-0 px-4 pb-2 type-body-touch text-text-2 tablet:px-5 desktop:type-body">{intro}</p>}
      <ul className="flex min-h-0 grow flex-col gap-2.5 overflow-y-auto px-4 pt-1 pb-safe-4 tablet:px-5 tablet:pb-safe-5">
        {notes.length === 0 ? (
          <li className="flex items-center gap-3 rounded-row border border-line bg-surface-1 p-3.5">
            <Icon name="tick" stroke="tick" size={20} label="Fits" className="text-ok" />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">Nothing to review</span>
              <span className="type-body-touch desktop:type-body text-text-2">Every check of the design fits.</span>
            </span>
          </li>
        ) : (
          notes.map((note) => <NoteRow key={note.id} note={note} onClose={onClose} onTryAgain={onTryAgain} onEnterValue={onEnterValue} />)
        )}
      </ul>
    </div>
  );
}

type Props = Omit<PanelProps, "titleId"> & { open: boolean };

/**
 * The notes to review, over the screen: the dialog of the browser, so that the focus goes in, stays in
 * and goes back. Escape closes it, and a press beside it. It comes and goes in the time of the panels
 * (`drawer-motion`): the panel slides, and the dialog stays until it has left, so the panel is always there.
 */
export function NotesDrawer({ open, onClose, ...panel }: Props) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      // On phone the handle comes first; the button that closes says what it does.
      element.querySelector<HTMLElement>("[data-close]")?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // What is pressed is the dialog itself only where the panel is not.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={classNames(
        "drawer-motion fixed inset-0 size-full max-h-none max-w-none items-end justify-end bg-transparent text-text outline-none",
        // On tablet and desktop it stands over the inspector, under the top bar.
        "backdrop:bg-dim open:flex tablet:items-stretch tablet:pt-safe-topbar-tablet tablet:backdrop:bg-transparent desktop:pt-safe-topbar",
      )}
    >
      <NotesPanel {...panel} onClose={onClose} titleId={titleId} />
    </dialog>
  );
}
