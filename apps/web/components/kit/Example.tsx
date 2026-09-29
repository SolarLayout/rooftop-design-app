import type { ReactNode } from "react";

type Props = {
  /** The name the browser tests find the example by. */
  name: string;
  /** What the example shows, under it. */
  caption: string;
  children: ReactNode;
};

/** One component in one state, with its caption. */
export function Example({ name, caption, children }: Props) {
  return (
    <div data-testid={`kit-${name}`} className="flex flex-col items-start gap-1.5">
      {children}
      <span className="type-caption text-text-2">{caption}</span>
    </div>
  );
}

type SectionProps = { title: string; children: ReactNode };

/** A card of the kit: a title and what belongs under it. */
export function Section({ title, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-4.5 rounded-card border border-line bg-surface-1 p-card shadow-card">
      <h2 className="type-section text-text-3">{title}</h2>
      {children}
    </section>
  );
}

type RowProps = { label: string; children: ReactNode };

/** Examples that belong together, beside each other; they wrap where the screen is narrow. */
export function Row({ label, children }: RowProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="type-small text-text-2">{label}</h3>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">{children}</div>
    </div>
  );
}
