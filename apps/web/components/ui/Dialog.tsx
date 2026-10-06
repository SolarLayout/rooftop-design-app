"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";
import type { ButtonKind } from "./button-look";
import { classNames } from "./class-names";
import { actionLook, dialogLook, panelLook, type ActionShown, type DialogSize } from "./dialog-look";
import { IconButton } from "./IconButton";
import { ProgressRing } from "./ProgressRing";
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
  /** Where the action is shown: on every size, on the phone's sheet alone, or on the panel alone. */
  shown?: ActionShown;
  /** What the action does is under way: the turning ring before its words, and a press does nothing more. */
  busy?: boolean;
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
  /** The names of the title and of the text in the page; no text when the dialog's text is no description of it. */
  names: { title: string; text: string | null };
  /** The kit's dialog, or the wide one of the equipment picker, which is the whole sheet on phone (D75). */
  size?: DialogSize;
  /** What stands at the left of the actions from tablet on: the file chosen in the picker. */
  foot?: ReactNode;
};

/** What is seen of a dialog: a panel in the middle of the screen, a bottom sheet on phone. */
export function DialogPanel({ title, children, actions, onClose, names, size = "narrow", foot }: PanelProps) {
  return (
    <div data-testid="dialog-panel" className={panelLook(size)}>
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
      <div id={names.text ?? undefined} className={classNames("text-text-2", size === "wide" && "flex min-h-0 grow flex-col")}>
        {children}
      </div>
      {/* On phone the actions are under each other, the last one on top. */}
      <div data-testid="dialog-actions" className="mt-1 flex flex-col-reverse gap-2 tablet:mt-2.5 tablet:flex-row tablet:items-center tablet:justify-end">
        {foot ? <div className="hidden min-w-0 grow tablet:block">{foot}</div> : null}
        {actions.map((action) => (
          <span key={action.label} className={actionLook(action.shown ?? "always")}>
            <Button
              kind={action.kind}
              size="sheet"
              data-action
              aria-disabled={action.waits || action.busy || undefined}
              aria-busy={action.busy || undefined}
              onClick={action.busy ? undefined : action.onPress}
            >
              {action.busy ? <ProgressRing size={16} /> : null}
              {action.label}
            </Button>
          </span>
        ))}
      </div>
    </div>
  );
}

type Props = Omit<PanelProps, "names"> & {
  open: boolean;
  /** The dialog's text describes it (the default); the picker's text is its list, which is none. */
  isDescribed?: boolean;
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
export function Dialog({ open, onClose, initialFocus = "first-action", isDescribed = true, ...panel }: Props) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const names = { title: `${id}-title`, text: isDescribed ? `${id}-text` : null };

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      // The browser would take the first control, which is the one that closes. The first action
      // changes nothing and says so; a dialog that asks for a number puts the focus in its field.
      // The first action is the first one shown at this size: an action can be for the phone's sheet or the panel alone.
      const field = initialFocus === "field" ? element.querySelector<HTMLElement>("[data-initial-focus]") : null;
      const first = Array.from(element.querySelectorAll<HTMLElement>("[data-action]")).find((action) => action.offsetParent !== null);
      (field ?? first)?.focus();
    }
    if (!open && element.open) element.close();
  }, [open, initialFocus]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={names.title}
      aria-describedby={names.text ?? undefined}
      // Escape asks to close; whoever opened the dialog says that it is closed.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={dialogLook(panel.size ?? "narrow")}
    >
      {open ? <DialogPanel {...panel} onClose={onClose} names={names} /> : null}
    </dialog>
  );
}
