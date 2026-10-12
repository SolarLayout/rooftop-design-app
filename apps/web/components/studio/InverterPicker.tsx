"use client";

import { useMemo, useState } from "react";
import { shown } from "@/components/ui/number-entry";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { api, type InverterResponse } from "@/lib/api";
import {
  filteredInverters,
  INVERTER_COLUMNS,
  INVERTER_START,
  kwStopsOf,
  nextPickerSort,
  orderOptions,
  sortedEntries,
  sortOfOrder,
  voltageStopsOf,
  type PickerSort,
  type Span,
} from "@/lib/equipment/picker";
import { inverterRowOf, kwShown, ratedUnderOf } from "@/lib/equipment/rows";
import { EquipmentPicker, type PickerColumn, type PickerRow, type PickerWords } from "./EquipmentPicker";
import { PickerSearch } from "./PickerSearch";
import { useEquipmentCatalog } from "./use-equipment-catalog";
import { useSize } from "@/components/shell/use-screen-size";

type Props = {
  /** The design's system voltage: an inverter rated under it is marked (D88). */
  voltage: number | null;
  open: boolean;
  /** The OND file of the design. */
  current: string | null;
  onRead: (read: InverterResponse) => void;
  onClose: () => void;
};

const WORDS: PickerWords = { title: "Choose an inverter", thing: "inverter", things: "inverters", use: "Use this inverter", fileKind: "OND", accept: ".ond,.OND" };

// The maximum DC voltage is on desktop alone (the board's tablet has no room for it).
const COLUMNS: readonly PickerColumn[] = [
  { key: "model", head: "Inverter", width: "", sorts: true },
  { key: "ac_kw", head: "AC kW", width: "w-16", sorts: true },
  { key: "mppt", head: "MPPT", width: "w-14", sorts: true },
  { key: "window", head: "MPPT V", width: "w-24", sorts: false },
  { key: "vdc_max_v", head: "Max DC V", width: "w-20", sorts: true, isDesktopOnly: true },
];

/** The stops of the AC power that carry a tick, where the library reaches them. */
const KW_TICKS = [10, 50, 125];

/** "Choose an inverter" (D75): the equipment picker over the library's inverters, filtered by AC power and MPPT. */
export function InverterPicker({ voltage, open, current, onRead, onClose }: Props) {
  const { catalog, error, retry } = useEquipmentCatalog();
  // On phone the sliders have no ticks: their values stand above them, and the list needs the room.
  const hasTicks = useSize() !== "phone";
  const inverters = useMemo(() => catalog?.inverters ?? [], [catalog]);
  const stops = useMemo(() => kwStopsOf(inverters), [inverters]);
  const mostMppt = useMemo(() => Math.max(1, ...inverters.map((inverter) => inverter.mppt)), [inverters]);
  const volts = useMemo(() => voltageStopsOf(inverters), [inverters]);
  const [search, setSearch] = useState("");
  // Null: at rest, the handles at the ends of the library's scales, whatever the catalog brings. Each opening mounts the
  // picker afresh, so that it opens at rest.
  const [kwSpan, setKwSpan] = useState<Span | null>(null);
  const [mpptSpan, setMpptSpan] = useState<Span | null>(null);
  const [vdcSpan, setVdcSpan] = useState<Span | null>(null);
  const [sort, setSort] = useState<PickerSort>(INVERTER_START);
  const last = stops.length - 1;
  const kw: Span = kwSpan ?? [0, last];
  const mppt: Span = mpptSpan ?? [1, mostMppt];
  const lastVolts = volts.length - 1;
  const vdc: Span = vdcSpan ?? [0, lastVolts];

  const isFiltered = kw[0] !== 0 || kw[1] !== last || mppt[0] !== 1 || mppt[1] !== mostMppt || vdc[0] !== 0 || vdc[1] !== lastVolts;
  const rows: PickerRow[] | null = catalog
    ? sortedEntries(filteredInverters(inverters, { search, kw, mppt, vdc }, stops, volts), INVERTER_COLUMNS, sort).map((entry) => {
        const row = inverterRowOf(entry);
        return { file: entry.file, model: row.model, second: row.second, cells: [row.cells.kw, row.cells.mppt, row.cells.window, row.cells.vdc], phone: row.phone, preliminary: row.preliminary, mark: ratedUnderOf(entry.vdc_max_v, voltage) };
      })
    : null;

  const kwTicks = [0, ...KW_TICKS.map((value) => stops.indexOf(value)).filter((index) => index > 0 && index < last), last].map((index) => ({ value: index, label: kwShown(stops[index] ?? 0) }));
  const mpptTicks = [1, 5, 10, mostMppt].filter((value, index, all) => value <= mostMppt && all.indexOf(value) === index).map((value) => ({ value, label: shown(value, 0) }));

  const voltTicks = [0, lastVolts].map((index) => ({ value: index, label: shown(volts[index] ?? 0, 0) }));

  const filters = (
    <div className="grid grid-cols-1 items-end gap-x-4 gap-y-3 tablet:grid-cols-3 tablet:gap-y-4 desktop:gap-x-6">
      <PickerSearch value={search} onChange={setSearch} className="tablet:col-span-3" />
      <RangeSlider
        label="AC power"
        isNamed
        value={kw}
        onCommit={setKwSpan}
        scale={{ min: 0, max: last, step: 1, page: 3 }}
        apart={0}
        format={(index) => kwShown(stops[index] ?? 0)}
        note="kW"
        ticks={hasTicks ? kwTicks : undefined}
      />
      <RangeSlider
        label="MPPT"
        isNamed
        value={mppt}
        onCommit={setMpptSpan}
        scale={{ min: 1, max: mostMppt, step: 1 }}
        apart={0}
        format={(value) => shown(value, 0)}
        ticks={hasTicks ? mpptTicks : undefined}
      />
      <RangeSlider
        label="Max DC"
        isNamed
        value={vdc}
        onCommit={setVdcSpan}
        scale={{ min: 0, max: lastVolts, step: 1 }}
        apart={0}
        format={(index) => shown(volts[index] ?? 0, 0)}
        note="V"
        ticks={hasTicks ? voltTicks : undefined}
      />
    </div>
  );

  return (
    <EquipmentPicker
      open={open}
      onClose={onClose}
      kind="inverters"
      words={WORDS}
      current={current}
      filters={filters}
      search={search}
      isFiltered={isFiltered || search !== ""}
      onClearSearch={() => setSearch("")}
      onClearFilters={() => {
        setSearch("");
        setKwSpan(null);
        setMpptSpan(null);
        setVdcSpan(null);
      }}
      rows={rows}
      total={inverters.length}
      loadError={error}
      onRetry={retry}
      columns={COLUMNS}
      sort={sort}
      onSort={(key) => setSort((now) => nextPickerSort(now, key, INVERTER_COLUMNS, INVERTER_START))}
      orders={orderOptions(INVERTER_COLUMNS, INVERTER_START)}
      onOrder={(order) => setSort(sortOfOrder(order))}
      readBy={api.parseInverter}
      onRead={onRead}
    />
  );
}
