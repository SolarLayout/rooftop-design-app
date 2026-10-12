"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { WAYS, type Way } from "@/lib/outline/first-step";

type Props = {
  /** The search, first in the column. */
  search: ReactNode;
  /** A way under the search was pressed. */
  onWay: (way: Way) => void;
};

const ICONS: Record<Way, IconName> = { locate: "locate", hand: "pencil" };

/** Find's first step (V2 · 4, D98): the search first, its examples in its list while it is empty, the two other ways under it as rows. */
export function FirstStep({ search, onWay }: Props) {
  return (
    <div className="flex flex-col gap-group">
      {search}
      <ul aria-label="Other ways to start" className="flex flex-col border-t border-line-subtle">
        {WAYS.map(({ way, title, words }) => (
          <li key={way} className="border-b border-line-subtle">
            <button type="button" onClick={() => onWay(way)} className="flex min-h-16 w-full cursor-pointer items-center gap-3 py-2.5 text-left focus-ring desktop:min-h-14">
              <Icon name={ICONS[way]} size={18} className="shrink-0 text-text-2" />
              <span className="flex grow flex-col gap-0.5">
                <span className="font-medium">{title}</span>
                <span className="type-body-touch text-text-2 desktop:type-body">{words}</span>
              </span>
              <Icon name="chevron-right" size={16} className="shrink-0 text-text-3" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
