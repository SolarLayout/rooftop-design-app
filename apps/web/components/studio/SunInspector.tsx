"use client";

import { useId, useState } from "react";
import { useProject, useResults, useStores, useView } from "@/components/shell/stores";
import { useSun } from "@/components/scene/use-sun";
import { classNames } from "@/components/ui/class-names";
import { NumberField } from "@/components/ui/NumberField";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { Stat } from "@/components/ui/Stat";
import { Switch } from "@/components/ui/Switch";
import { hourOf } from "@/lib/geometry/keepout";
import { projectOf } from "@/lib/stores/project-store";
import { sunFailureOf } from "@/lib/stores/results-store";
import { onTheRoofOf, sunTabOf, type OnTheRoof, type SunTab } from "@/lib/stores/view-store";
import { dateOf, dayOfChoice, dayOfYearOf, daysOf, designDayLineOf, designDayOfYear, partsOf, sunAtOf } from "@/lib/studio/sun-time";
import { ReadOut, SECTION } from "./inspector-look";
import { ShadeMapSection, ShadingSection } from "./SunShading";
import { SunTimeline } from "./Time";
import type { Size } from "./use-size";
import { useTime } from "./use-time";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_OPTIONS = MONTHS.map((label, index) => ({ value: String(index + 1), label }));

/** The choice of the Day control that is not one of the three days. */
const ANY_DATE = "any";

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
  const chosen = isAnyDate || !isOneOfThem ? ANY_DATE : String(shownDay);
  const parts = partsOf(shownDay);

  function setDay(dayOfYear: number) {
    view.getState().setSunTime({ ...view.getState().sunTime, day: dayOfChoice(dayOfYear, designDoy, lat) });
  }

  return (
    <section aria-labelledby={heading} className="flex flex-col gap-3">
      <h2 id={heading} className={SECTION}>
        Day
      </h2>
      <Segmented
        label="Day"
        fill
        options={[...days.map((day) => ({ value: String(day.dayOfYear), label: day.label })), { value: ANY_DATE, label: "Any date" }]}
        value={chosen}
        onChange={(value) => {
          setAnyDate(value === ANY_DATE);
          if (value !== ANY_DATE) setDay(Number(value));
        }}
      />
      {chosen === ANY_DATE ? (
        <div className={classNames("flex gap-field", size === "phone" && "flex-col")}>
          <NumberField label="Day" labelInside value={parts.day} range={{ min: 1, max: 31, decimals: 0 }} onCommit={(day) => setDay(dayOfYearOf(day, parts.month))} className="shrink-0" />
          <Select label="Month" options={MONTH_OPTIONS} value={String(parts.month)} onChange={(month) => setDay(dayOfYearOf(parts.day, Number(month)))} className="grow" />
        </div>
      ) : null}
      <p className="type-caption text-text-3">
        {chosen === ANY_DATE ? `Day ${shownDay} · the design day is ${dateOf(designDayOfYear(designDoy, lat)).long}` : designDayLineOf(designDoy, lat)}
      </p>
    </section>
  );
}

/** Where the sun stands at the time: its height and its bearing, as tiles. */
function SunAtSection() {
  const sun = useSun();
  const time = useTime();
  const tiles = sunAtOf(sun);
  const failure = useResults(sunFailureOf);
  const heading = useId();
  return (
    <section aria-labelledby={heading} className="flex flex-col gap-3">
      <h2 id={heading} className={SECTION}>
        Sun at {hourOf(time.time.hour)}
      </h2>
      {tiles ? (
        <dl className="grid grid-cols-2 gap-2">
          <Stat look="tile" label="Height" value={tiles.height.value} unit={tiles.height.unit} />
          <Stat look="tile" label="Bearing" value={tiles.bearing.value} unit={tiles.bearing.unit} />
        </dl>
      ) : (
        <p className="type-caption text-text-2">{time.day ? "The sun is down" : failure ? "The sun was not fetched" : "The sun's day is on its way"}</p>
      )}
    </section>
  );
}

type Switched = { what: keyof OnTheRoof; label: string; line: (window: string) => string };

const ON_THE_ROOF: readonly Switched[] = [
  { what: "sunPath", label: "Sun path", line: () => "The arc the sun follows on this day" },
  { what: "window", label: "Shade-free window", line: (window) => `Thick part of the arc, ${window}` },
  { what: "shadowOutlines", label: "Calculated shadow outlines", line: () => "The engine's shadows, drawn over what you see" },
];

/**
 * What the Sun lens draws on the roof (the boards "Studio, Sun lens" and "Sun path and shadow outlines";
 * plan/phase-06-plan.md, decision 16): the sun path, its window thicker, and the engine's shadow outlines.
 * The window is of the path: it is dim while the path is off. Of the view, not of the design.
 */
function OnTheRoofSection({ size }: { size: Size }) {
  const { view } = useStores();
  const shown = useView(onTheRoofOf);
  const project = useProject(projectOf);
  const heading = useId();
  const window = project ? `${hourOf(project.array.window_start_h)} to ${hourOf(project.array.window_end_h)}` : "";
  return (
    <section aria-labelledby={heading} className="flex flex-col gap-3">
      <h2 id={heading} className={SECTION}>
        On the roof
      </h2>
      <div className={classNames("flex flex-col", size === "phone" ? "divide-y divide-line-subtle" : "gap-3")}>
        {ON_THE_ROOF.map(({ what, label, line }) => {
          const isDim = what === "window" && !shown.sunPath;
          return (
            <ReadOut key={what} label={label} value={null} line={line(window)} className={classNames(size === "phone" && "py-2.5", isDim && "opacity-disabled")}>
              <Switch label={label} on={shown[what]} disabled={isDim} onChange={(on) => view.getState().showOnTheRoof(what, on)} />
            </ReadOut>
          );
        })}
      </div>
    </section>
  );
}

const TABS = [
  { value: "shadows", label: "Shadows" },
  { value: "shade-map", label: "Shade map" },
] as const satisfies ReadonlyArray<{ value: SunTab; label: string }>;

/**
 * The inspector of the Sun lens (the boards "Studio, Sun lens" on three sizes and "Shade map"): Shadows or
 * Shade map at its top. Shadows: the day, where the sun stands, shading over the year, what is drawn on the
 * roof. Shade map: what the map colours with its steps, and shading over the year. On phone the timeline
 * stands at the top, since the stage of 252 has no room for it. On tablet two columns.
 */
export function SunInspector({ size }: { size: Size }) {
  const { view } = useStores();
  const tab = useView(sunTabOf);
  const tabs = <Segmented label="Sun lens" fill options={TABS} value={tab} onChange={(chosen) => view.getState().showSunTab(chosen)} />;
  return (
    <div className="flex flex-col gap-section tablet:grid tablet:grid-cols-2 tablet:gap-x-8 desktop:flex desktop:flex-col">
      {size === "phone" ? <SunTimeline size="phone" className="border-b border-line-subtle pb-4" /> : null}
      {tab === "shadows" ? (
        <>
          <div className="flex flex-col gap-section">
            {tabs}
            <DaySection size={size} />
            <SunAtSection />
          </div>
          <div className="flex flex-col gap-section">
            <ShadingSection />
            <OnTheRoofSection size={size} />
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-section">
            {tabs}
            <ShadeMapSection size={size} />
          </div>
          <ShadingSection />
        </>
      )}
    </div>
  );
}
