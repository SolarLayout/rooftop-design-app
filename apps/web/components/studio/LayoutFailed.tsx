"use client";

import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useResults, useStores } from "@/components/shell/stores";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { StatusMark } from "@/components/ui/StatusMark";
import { layoutFailureOf, type Failure } from "@/lib/stores/results-store";
import { layoutFailedOf } from "./stage-view";

type Props = { className?: string };

/**
 * The chip on the stage when the layout asked for last did not come (docs/design/components.md, "Callout
 * on the stage", with the line of a note; the board "Studio, Array lens, states"): what failed, the
 * message of the API, and Try again, which asks once more. The last good modules stay under it. A layout
 * that lands takes it away; Escape closes it until the next failure.
 */
export function LayoutFailed({ className }: Props) {
  const { flow } = useStores();
  const failure = useResults(layoutFailureOf);
  const words = useResults(useShallow(layoutFailedOf));
  const [closed, setClosed] = useState<Failure | null>(null);
  const isShown = words !== null && failure !== closed;

  useEffect(() => {
    if (!isShown) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setClosed(failure);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isShown, failure]);

  if (!isShown) return null;

  return (
    <div
      data-testid="layout-failed"
      role="status"
      className={classNames("flex flex-col gap-1.5 rounded-row border border-note-line bg-surface-1 px-3.5 py-2.5 shadow-float", className)}
    >
      <span className="flex items-center gap-2 type-small font-medium text-text">
        <StatusMark kind="note" label="Note" wordsShown={false} size={16} />
        {words.title}
      </span>
      <span className="type-caption text-text-2">{words.message}</span>
      <div className="-mb-1 -ml-3.5 flex">
        <Button kind="quiet" size="s" onClick={flow.tryAgain}>
          {words.action}
        </Button>
      </div>
    </div>
  );
}
