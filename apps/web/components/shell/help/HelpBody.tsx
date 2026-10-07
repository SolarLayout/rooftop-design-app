"use client";

import type { MDXContent } from "mdx/types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusMark } from "@/components/ui/StatusMark";
import type { HelpEntry } from "@/lib/help/types";
import { HELP_KIT } from "./help-kit";

type Body = { entry: HelpEntry; attempt: number } & ({ state: "ready"; Content: MDXContent } | { state: "failed" });

/**
 * A topic's body, loaded only when the topic is opened (D80): lines of skeleton while it comes, the body drawn with the
 * help's components, or, when it cannot be loaded, what happened and Try again. The title, the summary and the options
 * come with the page and stay.
 */
export function HelpBody({ entry }: { entry: HelpEntry }) {
  const [attempt, setAttempt] = useState(0);
  const [body, setBody] = useState<Body | null>(null);

  useEffect(() => {
    let isCurrent = true;
    entry.load().then(
      (module) => isCurrent && setBody({ entry, attempt, state: "ready", Content: module.default }),
      () => isCurrent && setBody({ entry, attempt, state: "failed" }),
    );
    return () => {
      isCurrent = false;
    };
  }, [entry, attempt]);

  const shown = body && body.entry === entry && body.attempt === attempt ? body : null;
  if (!shown) {
    return (
      <div aria-busy="true" aria-label="Loading the help" className="flex flex-col gap-2">
        <Skeleton kind="lead" className="w-2/3" />
        <Skeleton kind="text" className="w-full" />
        <Skeleton kind="text" className="w-5/6" />
      </div>
    );
  }
  if (shown.state === "failed") {
    return (
      <div role="status" className="flex flex-col items-start gap-2.5 rounded-row border border-note-line bg-note-surface px-3.5 py-3">
        <p className="flex items-start gap-2 type-small text-text-2">
          <StatusMark kind="note" label="Note" wordsShown={false} size={16} />
          This part of the help did not load. Check the connection and try again.
        </p>
        <Button size="s" onClick={() => setAttempt(attempt + 1)}>
          Try again
        </Button>
      </div>
    );
  }
  const { Content } = shown;
  return (
    <div className="flex flex-col gap-2.5">
      <Content components={HELP_KIT} />
    </div>
  );
}
