"use client";

import { MARK } from "@/components/shell/help/picture-parts";
import { classNames } from "@/components/ui/class-names";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SECTION } from "@/components/ui/section-look";
import { EXAMPLES, type FirstStep as Panel, type Way } from "@/lib/outline/first-step";

type Props = {
  panel: Panel;
  /** A way to start was pressed. */
  onWay: (way: Way) => void;
  /** An example was pressed: its words go into the search. */
  onExample: (text: string) => void;
  className?: string;
};

// The cards of the ways in the roof type's look (RoofTypeChoice), the icon in the accent.
const CARD = classNames(
  "flex min-h-13 w-full cursor-pointer items-center gap-3 rounded-row border border-line bg-control px-3.5 py-2.5 text-left shadow-raised press-motion focus-ring",
  "hovered:raised-by-hover hovered:shadow-raised-hover pressed:lowered-by-press",
);
const EXAMPLE = "flex h-11 w-full cursor-pointer items-center gap-3 rounded-item px-2.5 text-left focus-ring hovered:bg-surface-2 desktop:h-9";
// The steps to come are numbered in the marks of the help's steps, quiet; the one in hand is lit.
const MARK_TO_COME = "bg-surface-2 text-text-2 shadow-none";

const ICONS: Record<Way, IconName> = { search: "search", locate: "locate", hand: "pencil" };

/** Find's first step (D85): the ways to start, what the search understands, and the three steps. */
export function FirstStep({ panel, onWay, onExample, className }: Props) {
  return (
    <div className={classNames("flex flex-col gap-5", className)}>
      <section className="flex flex-col gap-2.5" aria-label="Start here">
        <h2 className={SECTION}>Start here</h2>
        <div className="flex flex-col gap-1.5">
          {panel.ways.map(({ way, title, words }) => (
            <button key={way} type="button" onClick={() => onWay(way)} className={CARD}>
              <Icon name={ICONS[way]} size={18} className="shrink-0 text-accent" />
              <span className="flex grow flex-col">
                <span className="font-medium">{title}</span>
                <span className="type-caption text-text-2">{words}</span>
              </span>
              <Icon name="chevron-right" size={16} className="shrink-0 text-text-3" />
            </button>
          ))}
        </div>
      </section>

      {panel.examples ? (
        <section className="flex flex-col gap-1.5" aria-label="The search understands">
          <h2 className={SECTION}>The search understands</h2>
          <ul className="-mx-2.5 flex flex-col">
            {EXAMPLES.map((example) => (
              <li key={example.what}>
                <button type="button" aria-label={`${example.what}: ${example.shown}`} onClick={() => onExample(example.text)} className={EXAMPLE}>
                  <span className="w-22 shrink-0 type-small text-text-2">{example.what}</span>
                  <code className="min-w-0 truncate type-value-small text-text">{example.shown}</code>
                </button>
              </li>
            ))}
          </ul>
          <p className="type-caption text-text-3">Press one to put it in the search.</p>
        </section>
      ) : null}

      <section className="flex flex-col gap-3" aria-label="Three steps">
        <h2 className={SECTION}>Three steps</h2>
        <ol className="flex flex-col gap-2">
          {panel.steps.map((step, index) => (
            <li key={step.name} aria-current={index === 0 ? "step" : undefined} className="flex items-center gap-3">
              <span className={classNames(MARK, "size-6", index > 0 && MARK_TO_COME)}>{index + 1}</span>
              <span className="type-small text-text-2">
                <span className="font-medium text-text">{step.name}</span>: {step.words}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
