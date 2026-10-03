"use client";

import Link from "next/link";
import { NotBuiltYet } from "@/components/shell/NotBuiltYet";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { FIRST_ITEM, HANDOVER, HANDOVER_ITEMS, type HandoverItem } from "@/lib/routes";

type Props = {
  /** The item that is open; null at the list's own address, where desktop and tablet show the first item beside the list. */
  item: HandoverItem | null;
};

// The two columns of the boards "Handover" on three sizes (plan/phase-09-plan.md, decision 3): on desktop the list is 440
// wide with a line at its right, on tablet 300 wide beside the preview, on phone the list is the screen and an item is
// pushed over it. Only one of the two stands on phone.
const PAGE = "flex min-h-0 grow flex-col tablet:flex-row tablet:gap-5 tablet:p-6 desktop:gap-0 desktop:p-0";
const LIST = classNames(
  "flex-col gap-3 px-page-x-phone pt-2 pb-5",
  "tablet:w-75 tablet:shrink-0 tablet:gap-4.5 tablet:p-0",
  "desktop:w-handover-list desktop:border-r desktop:border-line-subtle desktop:pt-7 desktop:pr-6 desktop:pb-6 desktop:pl-10",
);
const PREVIEW = classNames("min-w-0 grow flex-col gap-3 px-page-x-phone pt-2 pb-5", "tablet:gap-4 tablet:p-0", "desktop:pt-7 desktop:pr-10 desktop:pb-6 desktop:pl-8");
const BACK = classNames(
  "-ml-2.5 flex h-touch items-center gap-1.5 self-start rounded-row px-2.5 text-text-2 select-none",
  "press-motion focus-ring hovered:text-text tablet:hidden",
);

const nameOf = (item: HandoverItem) => HANDOVER_ITEMS.find((one) => one.id === item)?.name ?? "";

/** The Handover workspace: the list of what is delivered, and the preview of the item that is open. */
export function Handover({ item }: Props) {
  const shown = item ?? FIRST_ITEM;

  return (
    <div className={PAGE}>
      <aside aria-label="Deliverables" className={classNames(LIST, item === null ? "flex" : "hidden tablet:flex")}>
        <div className="flex flex-col gap-1">
          <h1 className="type-lens-touch tablet:type-page">Handover</h1>
          <p className="type-small text-text-2 tablet:type-body-touch desktop:type-body">Everything the installer, the client and the utility need</p>
        </div>
        <NotBuiltYet />
      </aside>
      <main className={classNames(PREVIEW, item === null ? "hidden tablet:flex" : "flex")}>
        {/* On phone the item is pushed over the list: the row at the top leads back to it. */}
        <h1 className="sr-only tablet:hidden">Handover</h1>
        <Link href={HANDOVER} className={BACK}>
          <Icon name="chevron-left" size={16} />
          Handover
        </Link>
        <h2 className="type-lens-touch tablet:type-title">{nameOf(shown)}</h2>
        <NotBuiltYet />
      </main>
    </div>
  );
}
