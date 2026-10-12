"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { choiceOf, rememberChoice } from "@/lib/device/remembered-choice";

export const PERFORMANCE_TABS = [
  { value: "month", label: "By month" },
  { value: "years", label: "Over 25 years" },
  { value: "losses", label: "Where the energy goes" },
  { value: "assumptions", label: "Assumptions" },
] as const;

export type PerformanceTab = (typeof PERFORMANCE_TABS)[number]["value"];

const IDS = PERFORMANCE_TABS.map((tab) => tab.value) as [PerformanceTab, ...PerformanceTab[]];

/** The tab of Performance opened last, on this device. */
export const PERFORMANCE_TAB_KEY = "rooftop.performance-tab";

const storageOrNull = () => (typeof window === "undefined" ? null : window.localStorage);
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const snapshot = (): PerformanceTab => {
  const storage = storageOrNull();
  return storage ? choiceOf(storage, PERFORMANCE_TAB_KEY, IDS) : IDS[0];
};

/** The tab opened last on this device, By month the first time; taking another remembers it. */
function useRememberedTab(): [PerformanceTab, (tab: PerformanceTab) => void] {
  const tab = useSyncExternalStore(subscribe, snapshot, () => IDS[0]);
  const take = (next: PerformanceTab) => {
    const storage = storageOrNull();
    if (storage) rememberChoice(storage, PERFORMANCE_TAB_KEY, next);
    for (const listener of listeners) listener();
  };
  return [tab, take];
}

type Props = {
  /** The body of each tab. Where the energy goes is given both its views: the eleven steps, and the engine's 21. */
  month: ReactNode;
  years: ReactNode;
  losses: (allSteps: { isOpen: boolean; open: () => void; close: () => void }) => ReactNode;
  assumptions: ReactNode;
};

/**
 * The four tabs under the figures (V2 · 8, D104; D35): By month, Over 25 years, Where the energy goes, Assumptions, one view
 * at a time in one card, the last opened remembered on the device. Where the energy goes opens on its eleven steps; All 21
 * steps shows the engine's chain in its place until the user goes back or leaves the tab.
 */
export function PerformanceTabs({ month, years, losses, assumptions }: Props) {
  const [tab, setTab] = useRememberedTab();
  const [isAllSteps, setAllSteps] = useState(false);
  const take = (next: PerformanceTab) => {
    setAllSteps(false);
    setTab(next);
  };
  const body: Record<PerformanceTab, ReactNode> = {
    month,
    years,
    losses: losses({ isOpen: isAllSteps, open: () => setAllSteps(true), close: () => setAllSteps(false) }),
    assumptions,
  };
  return (
    <section data-testid="performance-tabs" aria-label="The design's energy in detail" className="desktop:rounded-card desktop:border desktop:border-line desktop:bg-surface-1 desktop:px-6 desktop:pb-6">
      <Tabs label="The design's energy in detail" tabs={PERFORMANCE_TABS} value={tab} onChange={take}>
        {body[tab]}
      </Tabs>
    </section>
  );
}
