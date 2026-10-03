import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stat, Stats } from "@/components/ui/Stat";
import type { DemoCard as Card } from "@/lib/home/home-view";
import { RUNS_IN_THE_STUDIO } from "@/lib/home/open-project";

/** What is known of the demo: on its way from the API, here, or not come with the API's words. */
export type Demo = { kind: "on-its-way" } | { kind: "here"; card: Card } | { kind: "failed"; words: string };

type Props = {
  demo: Demo;
  /** Open the demo was pressed: it opens in the Studio, one press from a cold start. */
  onOpen: () => void;
  className?: string;
};

export const DEMO_PROJECT = "Demo project";
export const OPEN_THE_DEMO = "Open the demo";

const CARD = "flex flex-col gap-4 rounded-card border border-line bg-surface-1 p-4.5 shadow-card tablet:flex-row tablet:items-center tablet:gap-7 tablet:px-5.5";

/**
 * The demo's card of the approved board "Home": its name and its roof from the demo document, the capacity and the energy
 * of year 1 once the demo has run on this device (decision 5), Open the demo. On phone the card is stacked, the two
 * numbers side by side and the button as wide as the card.
 */
export function DemoCard({ demo, onOpen, className }: Props) {
  const card = demo.kind === "here" ? demo.card : null;
  return (
    <article aria-label={DEMO_PROJECT} data-testid="demo-card" data-state={demo.kind} className={classNames(CARD, className)}>
      <div className="flex min-w-0 flex-col gap-0.5 tablet:grow desktop:grow-0">
        <span className="type-caption text-text-2">{DEMO_PROJECT}</span>
        {card ? (
          <span data-testid="demo-name" className="type-title">
            {card.name}
          </span>
        ) : (
          <Skeleton kind="value" className="w-36" />
        )}
        {card ? (
          <span className="type-small text-text-2">{card.roofWords}</span>
        ) : demo.kind === "failed" ? (
          <span role="status" className="type-small text-text-2">
            {demo.words}
          </span>
        ) : (
          <Skeleton kind="text" className="w-48" />
        )}
      </div>
      {card?.facts ? (
        <Stats className="grid grid-cols-2 gap-4 tablet:flex tablet:gap-7">
          <Stat label="Capacity" value={card.facts.capacity.number} unit={card.facts.capacity.unit} />
          <Stat label="Energy, year 1" value={card.facts.energy.number} unit={card.facts.energy.unit} />
        </Stats>
      ) : (
        // Until the demo has run here its numbers do not exist: the reason stands in their place, never a figure (guidelines.md).
        <p className="type-small text-text-2 tablet:max-w-44">{RUNS_IN_THE_STUDIO}</p>
      )}
      <Button kind="secondary" size="l" onClick={onOpen} className="w-full tablet:w-auto">
        {OPEN_THE_DEMO}
        <Icon name="arrow-right" size={16} />
      </Button>
    </article>
  );
}
