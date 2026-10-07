import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { StatusMark } from "@/components/ui/StatusMark";
import { useHelp } from "./HelpProvider";

// What a help topic's body is drawn with (D80): short headings, plain words, the user's own on-screen words in mono, a note
// in the note's colours. Only these; a topic imports nothing.

function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-row border border-note-line bg-note-surface px-3.5 py-3 type-small text-text-2">
      <StatusMark kind="note" label="Note" wordsShown={false} size={16} />
      <div>{children}</div>
    </div>
  );
}

/** A link to another topic: it opens in the sheet, and Back returns. */
function HelpLink({ k, children }: { k: string; children: ReactNode }) {
  const help = useHelp();
  return (
    <button type="button" onClick={() => help?.follow(k)} className="cursor-pointer text-accent underline decoration-accent/40 underline-offset-2 focus-ring">
      {children}
    </button>
  );
}

export const HELP_KIT: MDXComponents = {
  h2: ({ children }) => <h3 className="mt-2 type-title text-text first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="text-text-2">{children}</p>,
  ul: ({ children }) => <ul className="flex list-disc flex-col gap-1 pl-5 text-text-2">{children}</ul>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
  code: ({ children }) => <code className="rounded-xs bg-surface-2 px-1.5 py-px type-value-small text-text">{children}</code>,
  Callout,
  HelpLink,
};
