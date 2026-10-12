import type { ReactNode } from "react";
import { FirstMeeting } from "@/components/shell/FirstMeeting";
import { Present } from "@/components/shell/TopBar";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { HANDOVER } from "@/lib/routes";

type Props = {
  /** What stands under the title: a weather being loaded, or a run that failed. */
  under?: ReactNode;
};

const CONTINUE = "Continue to Handover";

/**
 * The head of Performance (V2 · 8, D104; D95): the title with its line the first time the word is met (D96), and the page's
 * own actions at its right, Present and the primary that leads on. On phone the primary is pinned over the tab bar
 * (`PinnedContinue`); Present stands from tablet up, as on every page.
 */
export function PerformanceHeader({ under }: Props) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="type-title-touch desktop:type-title">Performance</h1>
        <FirstMeeting word="Performance" />
        {under}
      </div>
      <div className="hidden shrink-0 items-center gap-3 tablet:flex">
        <Present />
        <ButtonLink kind="primary" size="xl" icon="arrow-right" href={HANDOVER} className="flex-row-reverse" data-testid="step-primary">
          {CONTINUE}
        </ButtonLink>
      </div>
    </header>
  );
}

/** On phone, the primary across the width over the tab bar, where the thumb is (the board "V2 · 8 · Performance", phone). */
export function PinnedContinue() {
  return (
    <div className="sticky bottom-0 -mx-page-x-phone mt-auto border-t border-line-subtle bg-chrome px-page-x-phone py-3 tablet:hidden">
      <ButtonLink kind="primary" size="xl" icon="arrow-right" href={HANDOVER} className="w-full flex-row-reverse" data-testid="step-primary-pinned">
        {CONTINUE}
      </ButtonLink>
    </div>
  );
}
