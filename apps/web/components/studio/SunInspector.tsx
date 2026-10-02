"use client";

import { useId, useState } from "react";
import { useProject, useStores } from "@/components/shell/stores";
import { useSun } from "@/components/scene/use-sun";
import { classNames } from "@/components/ui/class-names";
import { NumberField } from "@/components/ui/NumberField";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { Stat } from "@/components/ui/Stat";
import { hourOf } from "@/lib/scene/keepout";
import { projectOf } from "@/lib/stores/project-store";
import { dateOf, dayOfChoice, dayOfYearOf, daysOf, designDayLineOf, designDayOfYear, partsOf, sunAtOf } from "@/lib/studio/sun-time";
import { SECTION } from "./inspector-look";
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
        <p className="type-caption text-text-2">{time.day ? "The sun is down" : "The sun's day is on its way"}</p>
      )}
    </section>
  );
}

/**
 * The inspector of the Sun lens (the board "Studio, Sun lens" on three sizes): the day and where the sun
 * stands; the shading figures and what is drawn on the roof come with their pull requests. On phone the
 * timeline stands at the top, since the stage of 252 has no room for it.
 */
export function SunInspector({ size }: { size: Size }) {
  return (
    <div className="flex flex-col gap-section tablet:grid tablet:grid-cols-2 tablet:gap-x-8 desktop:flex desktop:flex-col">
      {size === "phone" ? <SunTimeline size="phone" className="border-b border-line-subtle pb-4" /> : null}
      <div className="flex flex-col gap-section">
        <DaySection size={size} />
        <SunAtSection />
      </div>
    </div>
  );
}
