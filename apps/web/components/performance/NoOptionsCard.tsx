import { useId } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import type { Decision } from "@/lib/performance/page-view";

const CARD =
  "flex flex-col gap-3.5 rounded-card border border-accent bg-note-surface px-4 py-4.5 shadow-halo-decision tablet:flex-row tablet:items-center tablet:gap-4 tablet:px-6 tablet:py-5.5";

/**
 * Before there are options (plan/phase-08-plan.md, decision 15; D37; the board "Performance, states"): the API's title
 * and message, word for word, on the surface of a decision, leading to the Strings lens where that is decided. No
 * voltage is offered here, and nothing of energy is shown.
 */
export function NoOptionsCard({ decision }: { decision: Decision }) {
  const heading = useId();
  return (
    <section data-testid="energy-waits" aria-labelledby={heading} className={CARD}>
      <div className="flex min-w-0 grow items-start gap-3 tablet:items-center tablet:gap-4">
        <Icon name="note" size={22} className="mt-0.5 shrink-0 text-accent tablet:mt-0" />
        <div className="flex min-w-0 grow flex-col gap-1">
          <h2 id={heading} className="type-title">
            {decision.title}
          </h2>
          <p className="text-text-2">{decision.message}</p>
        </div>
      </div>
      <ButtonLink href={decision.path} className="tablet:shrink-0">
        Open the Strings lens
        <Icon name="arrow-right" size={16} className="text-text-2" />
      </ButtonLink>
    </section>
  );
}
