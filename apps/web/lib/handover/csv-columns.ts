// The columns of the hourly data by their plain names (V2 · 9, audit V2-94; plan/phase-09-plan.md, decision 8): each its
// name and unit, the file's own name of the column under it, for the header the file has. Pure.

export type CsvColumn = {
  /** The column's name in the file. */
  file: string;
  /** Its plain name; a column the app does not know is named as the file names it. */
  name: string;
  /** Under the name: the unit and the file's name; nothing for a column the app does not know. */
  under: string;
};

/** The six columns the engine writes (export_csv_bytes: the index named time_utc_hour_start, then the hourly frame's). */
const KNOWN: Readonly<Record<string, { name: string; unit: string }>> = {
  time_utc_hour_start: { name: "Hour", unit: "UTC" },
  ghi_w_m2: { name: "Sunlight on the ground", unit: "W/m²" },
  poa_eff_w_m2: { name: "Sunlight on the modules", unit: "W/m²" },
  t_cell_c: { name: "Cell temperature", unit: "°C" },
  p_dc_kw: { name: "DC power", unit: "kW" },
  p_ac_kw: { name: "AC power", unit: "kW" },
};

/** A column per name of the header, in the file's order. */
export const csvColumnsOf = (header: readonly string[]): CsvColumn[] =>
  header.map((file) => {
    const known = KNOWN[file];
    return known ? { file, name: known.name, under: `${known.unit} · ${file}` } : { file, name: file, under: "" };
  });
