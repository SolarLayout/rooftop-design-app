import type { ComponentProps } from "react";
import { classNames } from "./class-names";
import { IconButton } from "./IconButton";
import { StatusMark } from "./StatusMark";
import type { ToastKind } from "./toast-queue";

type Props = Omit<ComponentProps<"div">, "children"> & {
  /** Something was done, or there is a note. */
  kind: ToastKind;
  words: string;
  /** What can be done about it, as "Undo". */
  action?: { label: string; onPress: () => void };
  /** With it the toast has a button to close it. */
  onClose?: () => void;
};

const ACTION = classNames(
  "inline-flex h-touch shrink-0 cursor-pointer items-center rounded-item bg-transparent px-2.5 font-medium text-accent",
  "press-motion focus-ring hovered:bg-surface-2 pressed:bg-control-pressed",
  "desktop:h-8 desktop:font-medium",
);

/** A few words about what was done, or a note. Where toasts are shown is `Toaster`. */
export function Toast({ kind, words, action, onClose, className, ...rest }: Props) {
  return (
    <div
      data-testid="toast"
      className={classNames(
        "flex min-h-12 max-w-full items-center gap-2.5 rounded-row border border-line-strong bg-surface-1 py-2 pr-2 pl-3.5 shadow-float",
        className,
      )}
      {...rest}
    >
      {kind === "done" ? (
        <StatusMark kind="fits" label="Done" wordsShown={false} size={18} />
      ) : (
        <StatusMark kind="note" label="Note" wordsShown={false} size={20} />
      )}
      <span className="grow pr-1.5">{words}</span>
      {action ? (
        <button type="button" onClick={action.onPress} className={ACTION}>
          {action.label}
        </button>
      ) : null}
      {onClose ? <IconButton kind="quiet" size="xs" icon="close" iconSize={18} label="Close" onClick={onClose} /> : null}
    </div>
  );
}
