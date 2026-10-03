import { classNames } from "@/components/ui/class-names";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusMark } from "@/components/ui/StatusMark";
import type { Saving } from "@/lib/device/saving";

export type { Saving };

type Props = {
  state: Saving;
  /** In the top bar, or under the name of the design in the project switcher. */
  look?: "bar" | "menu";
  /** A design that could not be saved says why in the notes. */
  onOpenNotes: () => void;
  className?: string;
};

const WORDS: Record<Exclude<Saving, "not-saved">, string> = {
  saved: "Saved on this device",
  saving: "Saving",
  "not-kept": "Not kept on this device",
};

const TYPE = { bar: "type-small", menu: "type-caption" };
const DOT = "size-1.75 shrink-0 rounded-full";

const NOT_SAVED = classNames(
  "-mx-2.5 flex h-touch cursor-pointer items-center gap-2 rounded-row bg-transparent px-2.5 text-text",
  "press-motion focus-ring hovered:bg-surface-2 pressed:bg-control-pressed desktop:h-9 desktop:rounded-control",
);

/** Whether the design is kept on this device. */
export function SaveState({ state, look = "bar", onOpenNotes, className }: Props) {
  if (state === "not-saved") {
    return (
      <button type="button" data-testid="save-state" data-look={look} onClick={onOpenNotes} className={classNames(NOT_SAVED, TYPE[look], className)}>
        <StatusMark kind="note" label="Note" wordsShown={false} size={16} />
        Not saved
      </button>
    );
  }

  return (
    <span data-testid="save-state" data-look={look} className={classNames("flex items-center gap-2 whitespace-nowrap text-text-2", TYPE[look], className)}>
      {state === "saved" ? <span data-testid="saving-mark" className={classNames(DOT, "bg-ok pulsing")} /> : null}
      {state === "saving" ? <ProgressRing size={12} /> : null}
      {state === "not-kept" ? <span data-testid="saving-mark" className={classNames(DOT, "border-dot border-text-3")} /> : null}
      {WORDS[state]}
    </span>
  );
}
