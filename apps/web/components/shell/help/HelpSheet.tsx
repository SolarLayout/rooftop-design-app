"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { SECTION } from "@/components/ui/section-look";
import { SheetGrip } from "@/components/ui/SheetGrip";
import { inTheDocsOf, type DocsPlace } from "@/lib/docs/docs";
import { ALIASES, MANIFEST } from "@/lib/help/manifest.gen";
import { resolvedKey, whereOf } from "@/lib/help/where";
import { useDocsHome } from "../use-docs-home";
import { HelpBody } from "./HelpBody";
import { useHelp } from "./HelpProvider";

// Desktop and tablet: from the right edge, the whole height of the window, 420 wide. Phone: from the bottom, the whole
// height but 48, with the grip (components.md, "Help disc and help sheet"; the owner, session 19).
const PANEL = classNames(
  "flex h-full w-full flex-col rounded-t-panel border border-b-0 border-line bg-chrome",
  "tablet:w-105 tablet:rounded-none tablet:border-0 tablet:border-l tablet:pt-safe-0 tablet:pr-safe-0 tablet:shadow-drawer",
);

const REGISTRY = { entries: MANIFEST, aliases: ALIASES };

/**
 * The help sheet (D80): where it was opened, Back once a link was followed, the topic's title and summary, its options
 * with the user's own marked, its body, its related topics. The browser's dialog, so that the focus goes in, stays in and
 * goes back to the disc; Escape, the ×, or a press beside it close it. It comes and goes as the drawers do.
 */
export function HelpSheet() {
  const help = useHelp();
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const relatedId = useId();
  const shown = help?.shown ?? null;
  const isOpen = shown !== null;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (isOpen && !element.open) {
      element.showModal();
      element.querySelector<HTMLElement>("[data-close]")?.focus();
    }
    if (!isOpen && element.open) element.close();
  }, [isOpen]);

  // A link followed shows its topic from the top.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [shown?.key]);

  if (!help) return null;
  const close = help.close;

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // React passes a dialog's cancel up through its parents: a picture opened large inside the sheet closes alone.
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="drawer-motion fixed inset-0 size-full max-h-none max-w-none items-end justify-end bg-transparent pt-safe-12 text-text outline-none backdrop:bg-dim open:flex tablet:items-stretch tablet:pt-0"
    >
      {shown ? (
        <div data-drawer-panel className={PANEL}>
          <SheetGrip onClose={close} className="tablet:hidden" />
          <div className="flex h-12 shrink-0 items-center gap-1 border-b border-line-subtle pr-2 pl-2.5">
            {help.canGoBack ? <IconButton label="Back" icon="chevron-left" iconSize={18} kind="quiet" size="s" onClick={help.back} /> : <span className="w-2.5" />}
            <span className="grow truncate type-body text-text-2">{whereOf(shown.entry.kind, pathname)}</span>
            <IconButton data-close label="Close help" icon="close" iconSize={18} kind="quiet" size="s" onClick={close} />
          </div>
          <div ref={scroller} className="flex min-h-0 grow flex-col gap-4 overflow-y-auto px-5 pt-4.5 pb-safe-6">
            <div className="flex flex-col gap-1.5">
              <h2 id={titleId} className="type-title-touch text-text desktop:type-title">
                {shown.entry.title}
              </h2>
              <p className="text-text-2">{shown.entry.summary}</p>
            </div>
            {shown.entry.values ? (
              <ul aria-label="Options" className="flex shrink-0 flex-col overflow-hidden rounded-row border border-line">
                {shown.entry.values.map(({ id, label, meaning }, index) => {
                  const isChosen = help.value === id;
                  return (
                    <li key={id} aria-current={isChosen || undefined} className={classNames("flex flex-col gap-0.5 px-3.5 py-2.5", index > 0 && "border-t border-line", isChosen && "bg-note-surface")}>
                      <span className="flex items-center gap-2 font-medium">
                        {label}
                        {isChosen ? <span className="rounded-control bg-accent px-1.5 type-unit font-semibold text-accent-ink">{help.mark}</span> : null}
                      </span>
                      <span className="type-body-touch desktop:type-body text-text-2">{meaning}</span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <HelpBody key={shown.key} entry={shown.entry} />
            {shown.entry.related.length > 0 ? (
              <div className="flex shrink-0 flex-col gap-1.5">
                <span id={relatedId} className={SECTION}>
                  Related
                </span>
                <ul aria-labelledby={relatedId} className="-mx-2 flex flex-col">
                  {shown.entry.related.map((raw) => {
                    const key = resolvedKey(raw, REGISTRY) as keyof typeof MANIFEST | null;
                    if (!key) return null;
                    const related = MANIFEST[key];
                    return (
                      <li key={key}>
                        <button type="button" onClick={() => help.follow(key)} className="flex w-full items-center gap-3 rounded-row px-2 py-2.5 text-left hovered:bg-surface-2 focus-ring">
                          <span className="flex min-w-0 grow flex-col gap-0.5">
                            <span className="font-medium">{related.title}</span>
                            <span className="line-clamp-2 type-body-touch desktop:type-body text-text-2">{related.summary}</span>
                          </span>
                          <Icon name="chevron-right" size={16} className="shrink-0 text-text-3" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            <InTheDocs place={shown.entry.docs} />
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

/** The page and section of the docs that tell more about the topic, opened in a new tab (D91), after its related topics. */
function InTheDocs({ place }: { place: DocsPlace | undefined }) {
  const id = useId();
  const row = inTheDocsOf(place, useDocsHome());
  if (!row) return null;
  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <span id={id} className={SECTION}>
        In the docs
      </span>
      <a aria-describedby={id} href={row.href} target="_blank" rel="noopener" className="-mx-2 flex items-center gap-3 rounded-row px-2 py-2.5 hovered:bg-surface-2 focus-ring">
        <Icon name="book" size={18} stroke="light" className="shrink-0 text-text-2" />
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className="font-medium">{row.title}</span>
          <span className="line-clamp-2 type-body-touch desktop:type-body text-text-2">{row.section}</span>
        </span>
        <Icon name="external" size={16} className="shrink-0 text-text-3" />
      </a>
    </div>
  );
}
