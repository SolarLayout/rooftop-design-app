"use client";

import { Fragment } from "react";
import { SummaryRow } from "@/components/shell/SummaryRow";
import { useSize } from "@/components/shell/use-screen-size";
import { classNames } from "@/components/ui/class-names";
import { NumberField } from "@/components/ui/NumberField";
import type { WeatherSummary } from "@/lib/api";
import type { Assumption, AssumptionFields, LevelsField, RowFieldId } from "@/lib/performance/assumption-fields";
import { weatherFactsOf, type AssumptionRow } from "@/lib/performance/assumption-rows";
import { NoteLine } from "./NoteLine";

type Props = {
  rows: readonly AssumptionRow[];
  fields: AssumptionFields;
  /** The run's weather, said when the Weather row is open; null before a run. */
  weather: WeatherSummary | null;
  /** The engine's notes on the weather, in its words. */
  notes: readonly string[];
  /** Hears a field committed: an edit of the document, which the run follows. */
  onField: (id: RowFieldId, value: number) => void;
  /** Hears a level committed in one of the three fields. */
  onLevel: (index: number, value: number) => void;
  className?: string;
};

function LevelsRow({ field, onLevel }: { field: LevelsField; onLevel: Props["onLevel"] }) {
  return (
    <div data-testid="assumption" data-assumption="p_levels" className="flex min-h-10 flex-wrap items-center justify-between gap-row">
      <span className="text-text">{field.label}</span>
      <span className="flex flex-wrap items-center gap-x-0.5">
        {field.levels.map((level, index) => (
          <Fragment key={index}>
            {index > 0 ? <span className="mx-1 text-text-3">·</span> : null}
            <span className="type-mono-touch text-text-2 desktop:type-mono">P</span>
            <NumberField form="chip" label={`Level ${index + 1}`} value={level} range={field.range} onCommit={(entered) => onLevel(index, entered)} className="w-13 tablet:w-10" />
          </Fragment>
        ))}
      </span>
    </div>
  );
}

function Fields({ fields, onField, onLevel }: { fields: readonly Assumption[] } & Pick<Props, "onField" | "onLevel">) {
  return (
    <>
      {fields.map((field) =>
        field.kind === "levels" ? (
          <LevelsRow key="levels" field={field} onLevel={onLevel} />
        ) : (
          <div key={field.id} data-testid="assumption" data-assumption={field.id}>
            <NumberField label={field.label} value={field.value} unit={field.unit ?? undefined} range={field.range} detail={field.hint} onCommit={(value) => onField(field.id, value)} />
          </div>
        ),
      )}
    </>
  );
}

/**
 * The assumptions of the run (V2 · 8, D104; the board "V2 · 8 · Performance", state 3): one summary row each, its facts on
 * one line and who set it, in two columns on desktop; opened, its fields in place. The weather's row says its hours,
 * temperatures and horizon and the engine's notes; the weather itself is chosen beside the lead. Roof albedo has its one
 * home here (audit V2-61). The rows stand before a system voltage too: the assumptions are inputs (decision 15).
 */
export function Assumptions({ rows, fields, weather, notes, onField, onLevel, className }: Props) {
  const size = useSize();
  const fieldsOf = { albedo: fields.albedo, ageing: fields.ageing, uncertainty: fields.uncertainty, co2: fields.co2 } as const;
  const rowOf = (row: AssumptionRow) => (
    <SummaryRow key={row.id} id={`performance.${row.id}`} title={row.title} facts={row.facts} setBy={row.setBy}>
      {row.id === "weather" ? (
        <>
          {weather ? <p className="type-body-touch desktop:type-body text-text-2">{weatherFactsOf(weather)}</p> : null}
          {notes.length > 0 ? (
            <ul data-testid="weather-notes" className="flex flex-col gap-1.5">
              {notes.map((note) => (
                <NoteLine key={note} words={note} testId="weather-note" />
              ))}
            </ul>
          ) : null}
          <p className="type-body-touch desktop:type-body text-text-3">At the top of the page, choose the weather beside the energy.</p>
        </>
      ) : (
        <Fields fields={fieldsOf[row.id]} onField={onField} onLevel={onLevel} />
      )}
    </SummaryRow>
  );
  // On desktop two columns, read across as the board has them: a row opened grows its own column and moves no other.
  const columns = size === "desktop" ? [rows.filter((_, index) => index % 2 === 0), rows.filter((_, index) => index % 2 === 1)] : [rows];
  return (
    <div data-testid="assumptions" className={classNames("grid desktop:grid-cols-2 desktop:items-start desktop:gap-x-10", className)}>
      {columns.map((column, index) => (
        <div key={index} className="flex min-w-0 flex-col">
          {column.map(rowOf)}
        </div>
      ))}
    </div>
  );
}
