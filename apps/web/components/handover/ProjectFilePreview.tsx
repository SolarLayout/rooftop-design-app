"use client";

import { useState } from "react";
import { classNames } from "@/components/ui/class-names";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import type { DesignResult, Project } from "@/lib/api";
import { NAME_RULES } from "@/lib/flow/name-field";
import { projectFileViewOf, type ContentRow } from "@/lib/handover/project-file";

type Props = {
  document: Project;
  design: DesignResult | null;
  /** The size of the file the API wrote for this edit of the document; null while it has not come. */
  bytes: number | null;
  /** The file is on its way: a skeleton stands for its size. Neither this nor bytes: the file did not come, and its size is left out. */
  isWaitingForBytes: boolean;
  /** The name was committed in the field. */
  onRename: (name: string) => void;
};

// The card (the board "Handover, previews", last part): the name as a field, under it the file's name in mono with its size and
// the format, then what is in it as rows of label and value, a line under each.
const CARD = "flex flex-col gap-4.5 rounded-card border border-line bg-surface-1 p-4 shadow-card tablet:px-6 tablet:py-5.5";
const UNDER_THE_FIELD = "flex flex-col gap-0.5 tablet:pl-21";
const ROW = "flex min-h-7 items-baseline gap-3 border-b border-line-subtle";
const ROW_LABEL = "w-33 shrink-0 text-text-2 tablet:w-42";

function Content({ row }: { row: ContentRow }) {
  return (
    <div data-testid="in-the-file" className={ROW}>
      <span className={ROW_LABEL}>{row.label}</span>
      {row.value === null ? (
        <Skeleton kind="text" className="my-2 w-40" />
      ) : (
        <span className={classNames("min-w-0 break-words", row.isFileName && "type-value-small text-text")}>{row.value}</span>
      )}
    </div>
  );
}

/**
 * The body of the project file (plan/phase-09-plan.md, decisions 9 and 13): the name as a text field, the file's name as the
 * API will write it following the words as they are typed, its size, "Format 2", and
 * what the .rtd embeds.
 */
export function ProjectFilePreview({ document, design, bytes, isWaitingForBytes, onRename }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const view = projectFileViewOf({ document, design, bytes, draft });

  return (
    <section data-testid="project-file" aria-label="Project file" className={CARD}>
      <div className="flex flex-col gap-0.5">
        <TextField label="Name" value={document.name} {...NAME_RULES} onCommit={onRename} onDraft={setDraft} />
        <div className={UNDER_THE_FIELD}>
          <span className="flex items-baseline gap-2.5">
            <code data-testid="file-name" className="type-value-small font-medium">
              {view.fileName}
            </code>
            {view.size !== null ? (
              <span data-testid="file-size" className="type-caption text-text-2">
                {view.size}
              </span>
            ) : isWaitingForBytes ? (
              <Skeleton kind="text" className="w-12" />
            ) : null}
          </span>
          <span className="type-caption text-text-2">{view.format}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <h3 className="type-section text-text-3">What is in it</h3>
        <div className="flex flex-col">
          {view.contents.map((row) => (
            <Content key={row.label} row={row} />
          ))}
        </div>
      </div>
    </section>
  );
}
