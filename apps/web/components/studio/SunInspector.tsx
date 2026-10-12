"use client";

import { SectionHeading } from "@/components/shell/help/SectionHeading";
import { ANY_DATE } from "@/lib/flow/day-choices";
import { useId, useState } from "react";
import { useProject, useStores, useView } from "@/components/shell/stores";
import { classNames } from "@/components/ui/class-names";
import { NumberField } from "@/components/ui/NumberField";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { hourOf } from "@/lib/geometry/keepout";
import { projectOf } from "@/lib/stores/project-store";
import { onTheRoofOf, sunTabOf, type OnTheRoof } from "@/lib/stores/view-store";
import { dateOf, dayOfChoice, dayOfYearOf, daysOf, designDayLineOf, designDayOfYear, partsOf } from "@/lib/flow/sun-time";
import { ReadOut } from "./inspector-look";
import { ShadeMapSection, ShadingSection } from "./SunShading";
import { SunTimeline } from "./Time";
import type { Size } from "@/components/shell/use-screen-size";
import { useTime } from "./use-time";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_OPTIONS = MONTHS.map((label, index) => ({ value: String(index + 1), label }));

/** The choice of the Day control that is not one of the three days. */

/**
 * The Day of the Sun lens (the boards "Studio, Sun lens" and "Time on the stage"; plan/phase-06-plan.md,
 * decision 2): 21 Dec, 21 Mar, 21 Jun and Any date, which opens a day and a month; the line says which day
 * is the design day. A day chosen sets the view's day, the design day as such so that it follows the array.
 */
function DaySection({ size }: { size: Size }) {
  const { view } = useStores();
  const project = useProject(projectOf);
  const time = useTime();
  const [isAnyDate, setAnyDate] = useState(false);
  const heading = useId();
  if (!project) return null;
  const { lat } = project.roof;
  const designDoy = project.array.design_doy ?? null;
  const days = daysOf(designDoy, lat);
  const shownDay = time.time.day === "design_day" ? designDayOfYear(designDoy, lat) : time.time.day;
  const isOneOfThem = days.some((day) => day.dayOfYear === shownDay);
  const chosen = isAnyDate || !isOneOfThem ? ANY_DATE.id : String(shownDay);
  const parts = partsOf(shownDay);

  function setDay(dayOfYear: number) {
    view.getState().setSunTime({ ...view.getState().sunTime, day: dayOfChoice(dayOfYear, designDoy, lat) });
  }

  return (
    <section aria-labelledby={heading} className="flex flex-col gap-3">
      <SectionHeading id={heading} help="studio.section.day" value={chosen}>
        Day
      </SectionHeading>
      <Segmented
        label="Day"
        fill
        options={[...days.map((day) => ({ value: String(day.dayOfYear), label: day.label })), { value: ANY_DATE.id, label: ANY_DATE.label }]}
        value={chosen}
        onChange={(value) => {
          setAnyDate(value === ANY_DATE.id);
          if (value !== ANY_DATE.id) setDay(Number(value));
        }}
      />
      {chosen === ANY_DATE.id ? (
        <div className={classNames("flex gap-field", size === "phone" && "flex-col")}>
          <NumberField label="Day" labelInside value={parts.day} range={{ min: 1, max: 31, decimals: 0 }} onCommit={(day) => setDay(dayOfYearOf(day, parts.month))} className="shrink-0" />
          <Select label="Month" options={MONTH_OPTIONS} value={String(parts.month)} onChange={(month) => setDay(dayOfYearOf(parts.day, Number(month)))} className="grow" />
        </div>
      ) : null}
      <p className="type-body-touch desktop:type-body text-text-3">
        {chosen === ANY_DATE.id ? `Day ${shownDay} · design day ${dateOf(designDayOfYear(designDoy, lat)).long}` : designDayLineOf(designDoy, lat)}
      </p>
    </section>
  );
}

type Switched = { what: keyof OnTheRoof | "shadeMap"; label: string; line: (window: string) => string };

const ON_THE_ROOF: readonly Switched[] = [
  { what: "sunPath", label: "Sun path", line: () => "The arc the sun follows on this day" },
  { what: "window", label: "Shade-free hours", line: (window) => `The thick part of the arc, ${window}` },
  { what: "shadowOutlines", label: "Shadow outlines", line: () => "The shadows the app computed, dashed, to compare" },
  { what: "shadeMap", label: "Shade map on the modules", line: () => "Each module coloured by its loss to shade" },
];

/**
 * What the Sun view draws on the roof (V2 · 7, D103; the board "The Roof and Array steps"; plan/phase-06-plan.md, decision
 * 16): the sun path, its shade-free hours thicker, the engine's shadow outlines, and the shade map on the modules. The hours
 * are of the path: they are dim while the path is off. Of the view, not of the design.
 */
function OnTheRoofSection({ size }: { size: Size }) {
  const { view } = useStores();
  const shown = useView(onTheRoofOf);
  const tab = useView(sunTabOf);
  const project = useProject(projectOf);
  const heading = useId();
  const window = project ? `${hourOf(project.array.window_start_h)} to ${hourOf(project.array.window_end_h)}` : "";
  return (
    <section aria-labelledby={heading} className="flex flex-col gap-3">
      <SectionHeading id={heading} help="studio.section.on-the-roof">
        On the roof
      </SectionHeading>
      <div className={classNames("flex flex-col", size === "desktop" ? "gap-3" : "divide-y divide-line-subtle")}>
        {ON_THE_ROOF.map(({ what, label, line }) => {
          const isDim = what === "window" && !shown.sunPath;
          const on = what === "shadeMap" ? tab === "shade-map" : shown[what];
          return (
            <ReadOut key={what} label={label} value={null} line={line(window)} className={classNames(size !== "desktop" && "py-2.5", isDim && "opacity-disabled")}>
              <Switch label={label} on={on} disabled={isDim} onChange={(next) => (what === "shadeMap" ? view.getState().showSunTab(next ? "shade-map" : "shadows") : view.getState().showOnTheRoof(what, next))} />
            </ReadOut>
          );
        })}
      </div>
    </section>
  );
}

/**
 * What the Sun view says of the shade, whatever the step (V2 · 7): the energy lost to shade by its cause, the four things the
 * view draws on the roof, the day, and, while the shade map is on, its steps. On desktop it is the card on the stage; on
 * tablet and phone it is the work column's content while the view is on.
 */
export function SunCardBody({ size }: { size: Size }) {
  const tab = useView(sunTabOf);
  return (
    <div className="flex flex-col gap-section">
      {/* On phone the stage has no room for the timeline: it heads the sheet. */}
      {size === "phone" ? <SunTimeline size="phone" className="border-b border-line-subtle pb-4" /> : null}
      <ShadingSection />
      <OnTheRoofSection size={size} />
      {tab === "shade-map" ? <ShadeMapSection size={size} /> : null}
      <DaySection size={size} />
    </div>
  );
}
