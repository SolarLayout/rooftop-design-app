import { HEIGHTS, RADII, SPACES, TYPE_STYLES } from "./principles-data";
import { Section } from "./Example";

// Each class written out, so that the stylesheet makes it.
const STYLE: Record<string, string> = {
  display: "type-display",
  "display-touch": "type-display-touch",
  figure: "type-figure",
  "figure-touch": "type-figure-touch",
  title: "type-title",
  "title-touch": "type-title-touch",
  heading: "type-heading",
  section: "type-section",
  body: "type-body",
  "body-touch": "type-body-touch",
  strong: "type-strong",
  "strong-touch": "type-strong-touch",
  mono: "type-mono",
  "mono-touch": "type-mono-touch",
  unit: "type-unit",
};
const SPACE_BAR: Record<number, string> = { 4: "w-1", 8: "w-2", 12: "w-3", 16: "w-4", 24: "w-6", 40: "w-10", 64: "w-16" };
const HEIGHT: Record<number, string> = { 32: "h-8", 40: "h-10", 48: "h-12" };
const CORNER: Record<string, string> = { control: "rounded-control", row: "rounded-row", card: "rounded-card", panel: "rounded-panel" };

/** V2's principles (D94): the type styles, the spacing, the control heights and the radii, as the board "V2 · 1" shows them. */
export function Principles() {
  return (
    <Section title="Principles">
      <div data-testid="kit-type" className="flex flex-col gap-row">
        {TYPE_STYLES.map((style) => (
          <div key={style.name} className="flex flex-wrap items-baseline justify-between gap-x-6 border-b border-line-subtle pb-2">
            <span className={STYLE[style.name]}>{style.sample}</span>
            <span className="type-body text-text-2">
              <code className="type-mono text-text">type-{style.name}</code> · {style.use}
            </span>
          </div>
        ))}
      </div>
      <div data-testid="kit-space" className="flex flex-col gap-row">
        {SPACES.map((space) => (
          <div key={space.px} className="flex items-center gap-3">
            <span className={`h-3 shrink-0 rounded-control bg-accent ${SPACE_BAR[space.px]}`} />
            <span className="type-body text-text-2">
              {space.px} · {space.name}: {space.use}
            </span>
          </div>
        ))}
      </div>
      <div data-testid="kit-heights" className="flex flex-wrap items-end gap-6">
        {HEIGHTS.map((height) => (
          <div key={height.name} className="flex flex-col items-start gap-1">
            <span className={`flex w-24 items-center justify-center rounded-control border border-line-strong bg-control type-strong ${HEIGHT[height.desktop]}`}>{height.desktop}</span>
            <span className="type-body text-text-2">
              {height.name} · {height.touch} on touch
            </span>
          </div>
        ))}
      </div>
      <div data-testid="kit-radii" className="flex flex-wrap gap-6">
        {RADII.map((radius) => (
          <div key={radius.name} className="flex flex-col items-start gap-1">
            <span className={`size-16 border border-line-strong bg-surface-2 ${CORNER[radius.name]}`} />
            <span className="type-body text-text-2">
              {radius.name} · {radius.px}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}
