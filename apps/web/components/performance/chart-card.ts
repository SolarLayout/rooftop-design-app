import { classNames } from "@/components/ui/class-names";

// The look the two chart cards share (the boards "Energy to grid by month" and "25 years").

/** The card: on desktop padded 22 and 24, on tablet 20, on phone 18 and 16. */
export const CHART_CARD = "flex flex-col rounded-card border border-line bg-surface-1 px-4 py-4.5 shadow-card tablet:p-5 desktop:px-6 desktop:py-5.5";

export const CHART_TITLE = "type-section";

/** The unit at the right of the title. */
export const CHART_UNIT = "type-body-touch desktop:type-body text-text-2";

/** The Chart and Table tabs of a chart card. */
export const CHART_TABS = [
  { value: "chart", label: "Chart" },
  { value: "table", label: "Table" },
] as const;

export type ChartTab = (typeof CHART_TABS)[number]["value"];

/** The body of a tab while a run is on its way: the values of before, dimmed. */
export const dimmed = (isDimmed: boolean) => classNames(isDimmed && "opacity-updating");
