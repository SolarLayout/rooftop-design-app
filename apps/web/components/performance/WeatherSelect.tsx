"use client";

import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import type { Project } from "@/lib/api";
import { WEATHER_ITEMS, weatherShownOf, WEATHER_LABELS, type WeatherSource } from "@/lib/flow/weather-source";
import type { WeatherLoad } from "./use-weather-load";

type Props = {
  /** The document's source and, for a CSV, its file: what the trigger says. */
  document: Pick<Project, "weather_source" | "weather_csv">;
  load: WeatherLoad;
  /** Hears "CSV file" chosen: the dialog that reads one. */
  onCsv: () => void;
  className?: string;
};

export const WEATHER_NOT_LOADED = "The weather was not loaded";

/**
 * The weather source in the header (plan/phase-08-plan.md, decision 12; components.md, "Select"): PVGIS TMY, NASA POWER
 * 2023 and CSV file, each with its fact. PVGIS or NASA chosen is downloaded first, the trigger saying the new name at once
 * with a turning ring; the document is edited once when the hours come. A CSV is read by its dialog before anything is
 * committed.
 */
export function WeatherSelect({ document, load, onCsv, className }: Props) {
  function choose(source: WeatherSource) {
    if (source === "csv") return onCsv();
    load.download(source);
  }

  return (
    <Select
      label="Weather"
      options={WEATHER_ITEMS}
      value={load.loading ?? document.weather_source}
      valueShown={load.loading ? WEATHER_LABELS[load.loading] : weatherShownOf(document)}
      busy={load.loading !== null}
      onChange={choose}
      className={classNames("w-full tablet:w-auto", className)}
    />
  );
}

/** A choice that could not be loaded (the board "Weather and assumptions"): the API's words under the select; the weather of before stays. */
export function WeatherNote({ message }: { message: string }) {
  return (
    <div
      data-testid="weather-failed"
      role="status"
      className="flex max-w-140 items-start gap-2.5 rounded-control border border-note-line bg-note-surface py-2.5 pr-3 pl-3 type-body-touch desktop:type-body text-text-2"
    >
      <Icon name="note" size={18} className="mt-px shrink-0 text-accent" />
      <span>
        <span className="block font-medium text-text">{WEATHER_NOT_LOADED}</span>
        {message}
      </span>
    </div>
  );
}
