"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";
import type { ButtonKind } from "./button-look";
import { classNames } from "./class-names";
import { IconButton } from "./IconButton";
import { SheetGrip } from "./SheetGrip";

export type DialogAction = {
  label: string;
  kind: ButtonKind;
  onPress: () => void;
  /**
   * An action that waits for a field of the dialog to be answered. It is shown as waiting and can still
   * be pressed: the press leaves the field, which commits what was typed, and the action then has it.
   */
  waits?: boolean;
};

type PanelProps = {
  /** What is asked, or what happened. It is the name of the dialog. */
  title: string;
  /** The text of the dialog. It is its description. */
  children: ReactNode;
  /**
   * What can be done, in the order of the design: the quiet one first, the primary one last. The
   * focus goes to the first, which is the one that changes nothing.
   */
  actions: readonly DialogAction[];
  onClose: () => void;
  /** The names of the title and of the text in the page. */
  names: { title: string; text: string };
};

const SHEET = "w-full rounded-t-panel border border-b-0 border-line bg-chrome px-4 pb-4";
const PANEL = classNames(
  "tablet:w-110 tablet:max-w-full tablet:rounded-panel tablet:border-b tablet:border-line-strong tablet:bg-surface-1",
  "tablet:px-5.5 tablet:pt-5.5 tablet:pb-5 tablet:shadow-panel",
);

/** What is seen of a dialog: a panel in the middle of the screen, a bottom sheet on phone. */
export function DialogPanel({ title, children, actions, onClose, names }: PanelProps) {
  return (
    <div data-testid="dialog-panel" className={classNames("flex flex-col gap-2.5", SHEET, PANEL)}>
      <SheetGrip onClose={onClose} className="tablet:hidden" />
      <div className="flex items-start gap-row">
        <h2 id={names.title} className="grow type-lens-touch">
          {title}
        </h2>
        {/* On phone the sheet has its handle, and the first action closes it as well. */}
        <span className="hidden tablet:flex">
          <IconButton kind="quiet" size="xs" icon="close" iconSize={18} label="Close" onClick={onClose} />
        </span>
      </div>
      <div id={names.text} className="text-text-2">
        {children}
      </div>
      {/* On phone the actions are under each other, the last one on top. */}
      <div data-testid="dialog-actions" className="mt-1 flex flex-col-reverse gap-2 tablet:mt-2.5 tablet:flex-row tablet:justify-end">
        {actions.map((action, index) => (
          <Button key={action.label} kind={action.kind} size="sheet" data-first-action={index === 0 || undefined} aria-disabled={action.waits || undefined} onClick={action.onPress}>
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

type Props = Omit<PanelProps, "names"> & {
  open: boolean;
  /**
   * Where the focus goes when the dialog opens: the first action, which changes nothing, so that Enter
   * by mistake does no harm; or the field marked to be answered, when the dialog asks for a number.
   */
  initialFocus?: "first-action" | "field";
};

/**
 * A question that must be answered before anything else. It is the dialog of the browser, opened over
 * everything: the focus goes in, stays in, and goes back to where it was. Escape closes it; a press
 * beside it does not.
 */
export function Dialog({ open, onClose, initialFocus = "first-action", ...panel }: Props) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const names = { title: `${id}-title`, text: `${id}-text` };

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      // The browser would take the first control, which is the one that closes. The first action
      // changes nothing and says so; a dialog that asks for a number puts the focus in its field.
      const field = initialFocus === "field" ? element.querySelector<HTMLElement>("[data-initial-focus]") : null;
      (field ?? element.querySelector<HTMLElement>("[data-first-action]"))?.focus();
    }
    if (!open && element.open) element.close();
  }, [open, initialFocus]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={names.title}
      aria-describedby={names.text}
      // Escape asks to close; whoever opened the dialog says that it is closed.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={classNames(
        "fixed inset-0 size-full max-h-none max-w-none items-end justify-center bg-transparent text-text outline-none",
        "backdrop:bg-dim open:flex tablet:items-center tablet:p-panel",
      )}
    >
      {open ? <DialogPanel {...panel} onClose={onClose} names={names} /> : null}
    </dialog>
  );
}
