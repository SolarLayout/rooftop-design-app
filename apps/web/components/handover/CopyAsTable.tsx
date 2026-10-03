"use client";

import { useToasts } from "@/components/shell/stores";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { COULD_NOT_COPY, copyTable } from "@/lib/handover/copy-table";

type Props = {
  /** The table as tab-separated text with a header line, what is shown in the order shown. */
  text: string;
  /** What the toast says once the text is on the clipboard: "Bill of materials copied as a table". */
  copied: string;
  /** Shown, and cannot be used: before options, or while nothing was ever there. */
  disabled?: boolean;
};

const LABEL = "Copy as table";

/**
 * "Copy as table" in the head of a table's preview (plan/phase-09-plan.md, decision 7; the board "Handover, states"): a
 * secondary button, on phone an icon button of 44 with the words as its name and its tooltip. The rows go to the clipboard
 * for a spreadsheet, and a toast of something done says so; a clipboard that refuses is a note with what to do.
 */
export function CopyAsTable({ text, copied, disabled = false }: Props) {
  const toasts = useToasts();

  async function copy() {
    if (disabled) return;
    try {
      await copyTable(text);
      toasts.show({ kind: "done", words: copied });
    } catch {
      toasts.show({ kind: "note", words: COULD_NOT_COPY });
    }
  }

  return (
    <>
      <span className="flex tablet:hidden">
        <Tooltip words={LABEL}>
          <IconButton kind="secondary" size="l" icon="copy" iconSize={18} label={LABEL} aria-disabled={disabled || undefined} onClick={() => void copy()} />
        </Tooltip>
      </span>
      <span className="hidden tablet:flex">
        <Button kind="secondary" icon="copy" aria-disabled={disabled || undefined} onClick={() => void copy()}>
          {LABEL}
        </Button>
      </span>
    </>
  );
}
