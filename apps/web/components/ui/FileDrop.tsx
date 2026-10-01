"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { Button } from "./Button";
import { classNames } from "./class-names";
import { carriesFiles, fileOf } from "./dropped-file";
import { Icon } from "./Icon";
import { ProgressRing } from "./ProgressRing";
import { StatusMark } from "./StatusMark";

/** What the field is told by who uses it: it waits, a file is held before it is read, the file is read, or the file was refused. */
export type FileDropState =
  | { kind: "rest" }
  /** A file is held and will be read later: its name, and `detail` says what it is and when it is read. */
  | { kind: "held"; file: string; detail: string }
  | { kind: "reading"; file: string }
  /** `reason` is in the words of who refused: of the engine. */
  | { kind: "refused"; reason: string };

type Props = {
  /** What to drop here: "Drop the module file here". It is the name of the field. */
  title: string;
  /** Which file it is: "A PAN file of PVsyst". */
  detail: string;
  /** What is said while a file is held over the field: what letting go does. */
  whenOver: string;
  /** The endings that the file chooser offers, as ".pan". */
  accept: string;
  state: FileDropState;
  /** Hears the file. Reading it, and refusing it, is for who uses the field. */
  onFile: (file: File) => void;
  /** For the kit: the field as it looks while a file is held over it. */
  shownAs?: "over";
  className?: string;
};

type Look = { surface: string; mark: ReactNode; colourOfMark: string; title: ReactNode; detail: ReactNode; button: string | null };

// On phone the button stands under the words and is as wide as the field; from tablet on it stands at their right.
const FRAME = "flex min-h-22 flex-col justify-center gap-3.5 rounded-row border px-4.5 py-3 tablet:flex-row tablet:items-center";

/**
 * A field that takes one file, by a drop or through the file chooser: the button makes it usable
 * without dragging, and by keyboard. It gives the file to who uses it; what becomes of the file it is
 * told: held for later, read, or refused.
 */
export function FileDrop({ title, detail, whenOver, accept, state, onFile, shownAs, className }: Props) {
  const input = useRef<HTMLInputElement>(null);
  // A file that is held over the field enters and leaves every element inside it; the field is left
  // when it was left as often as it was entered.
  const entered = useRef(0);
  const [isHeldOver, setHeldOver] = useState(false);

  const takesAFile = state.kind !== "reading";
  const isOver = takesAFile && (isHeldOver || shownAs === "over");

  function give(files: ArrayLike<File> | null) {
    const file = fileOf(files);
    if (file && takesAFile) onFile(file);
  }

  const onDrag = {
    onDragEnter(event: DragEvent<HTMLDivElement>) {
      if (!carriesFiles(event.dataTransfer.types)) return;
      event.preventDefault();
      entered.current += 1;
      setHeldOver(true);
    },
    onDragOver(event: DragEvent<HTMLDivElement>) {
      // Without this the browser opens the file instead of giving it to the field.
      if (carriesFiles(event.dataTransfer.types)) event.preventDefault();
    },
    onDragLeave() {
      entered.current = Math.max(0, entered.current - 1);
      if (entered.current === 0) setHeldOver(false);
    },
    onDrop(event: DragEvent<HTMLDivElement>) {
      if (!carriesFiles(event.dataTransfer.types)) return;
      event.preventDefault();
      entered.current = 0;
      setHeldOver(false);
      give(event.dataTransfer.files);
    },
  };

  const look: Look = (() => {
    if (isOver) {
      return {
        surface: "border-dashed border-accent bg-note-surface shadow-halo-selected",
        mark: <Icon name="upload" size={20} />,
        colourOfMark: "text-accent",
        title: "Let go to load the file",
        detail: whenOver,
        button: null,
      };
    }
    if (state.kind === "held") {
      return {
        surface: "border-line bg-surface-2",
        mark: <Icon name="file" size={20} stroke="light" />,
        colourOfMark: "text-accent",
        title: <code className="type-value-s">{state.file}</code>,
        detail: state.detail,
        button: "Choose another",
      };
    }
    if (state.kind === "reading") {
      return {
        surface: "border-line bg-well shadow-well",
        mark: <ProgressRing size={20} />,
        colourOfMark: "text-text-2",
        title: "Reading the file",
        detail: <span className="type-value-xs">{state.file}</span>,
        button: null,
      };
    }
    if (state.kind === "refused") {
      return {
        surface: "border-note-line bg-note-surface",
        mark: <StatusMark kind="note" label="Note" wordsShown={false} size={20} />,
        colourOfMark: "text-accent",
        title: "This file was not loaded",
        detail: state.reason,
        button: "Choose another",
      };
    }
    return {
      surface: "border-dashed border-line-strong",
      mark: <Icon name="upload" size={20} />,
      colourOfMark: "text-text-2",
      title,
      detail,
      button: "Choose a file",
    };
  })();

  return (
    <div
      role="group"
      aria-label={title}
      data-testid="file-drop"
      className={classNames(FRAME, "press-motion", look.surface, className)}
      {...onDrag}
    >
      <div className="flex min-w-0 grow items-center gap-3.5">
        <span data-testid="file-drop-icon" className={classNames("flex shrink-0", look.colourOfMark)}>
          {look.mark}
        </span>
        <p role="status" className="flex min-w-0 grow flex-col gap-0.5">
          <span className="font-medium">{look.title}</span>
          <span className="type-caption break-words text-text-2">{look.detail}</span>
        </p>
      </div>
      {look.button ? (
        <Button size="s" onClick={() => input.current?.click()}>
          {look.button}
        </Button>
      ) : null}
      <input
        ref={input}
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => {
          give(event.target.files);
          // So that the same file can be chosen again.
          event.target.value = "";
        }}
      />
    </div>
  );
}
