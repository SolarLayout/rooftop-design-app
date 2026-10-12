"use client";

import { useMemo, useState } from "react";
import { shown } from "@/components/ui/number-entry";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { api, type ModuleResponse } from "@/lib/api";
import {
  filteredModules,
  MODULE_COLUMNS,
  MODULE_START,
  nextPickerSort,
  orderOptions,
  powerScaleOf,
  sortedEntries,
  sortOfOrder,
  twinModels,
  type PickerSort,
  type Span,
} from "@/lib/equipment/picker";
import { moduleRowOf } from "@/lib/equipment/rows";
import { EquipmentPicker, type PickerColumn, type PickerRow, type PickerWords } from "./EquipmentPicker";
import { PickerSearch } from "./PickerSearch";
import { useEquipmentCatalog } from "./use-equipment-catalog";
import { useSize } from "@/components/shell/use-screen-size";

type Props = {
  open: boolean;
  /** The PAN file of the design. */
  current: string | null;
  onRead: (read: ModuleResponse) => void;
  onClose: () => void;
};

const WORDS: PickerWords = { title: "Choose a module", thing: "module", things: "modules", use: "Use this module", fileKind: "PAN", accept: ".pan,.PAN" };

// Bifaciality is on desktop alone (the board's tablet has no room for it).
const COLUMNS: readonly PickerColumn[] = [
  { key: "model", head: "Module", width: "", sorts: true },
  { key: "wp", head: "Wp", width: "w-16", sorts: true },
  { key: "efficiency_pct", head: "Efficiency %", width: "w-24", sorts: true },
  { key: "size", head: "Size m", width: "w-24", sorts: false },
  { key: "bifaciality", head: "Bifacial", width: "w-16", sorts: true, isDesktopOnly: true },
];

/** "Choose a module" (D75): the equipment picker over the library's modules, filtered by their power. */
export function ModulePicker({ open, current, onRead, onClose }: Props) {
  const { catalog, error, retry } = useEquipmentCatalog();
  // On phone the sliders have no ticks: their values stand above them, and the list needs the room.
  const hasTicks = useSize() !== "phone";
  const modules = useMemo(() => catalog?.modules ?? [], [catalog]);
  const scale = useMemo(() => powerScaleOf(modules), [modules]);
  const twins = useMemo(() => twinModels(modules), [modules]);
  const [search, setSearch] = useState("");
  // Null: at rest, the handles at the ends of the library's scale, whatever the catalog brings. Each opening mounts the
  // picker afresh, so that it opens at rest.
  const [span, setSpan] = useState<Span | null>(null);
  const [sort, setSort] = useState<PickerSort>(MODULE_START);
  const wp: Span = span ?? [scale.min, scale.max];

  const isFiltered = span !== null && (span[0] !== scale.min || span[1] !== scale.max);
  const rows: PickerRow[] | null = catalog
    ? sortedEntries(filteredModules(modules, { search, wp }), MODULE_COLUMNS, sort).map((entry) => {
        const row = moduleRowOf(entry, twins);
        return { file: entry.file, model: row.model, second: row.second, cells: [row.cells.wp, row.cells.efficiency, row.cells.size, row.cells.bifacial], phone: row.phone, preliminary: false };
      })
    : null;

  const filters = (
    <div className="grid grid-cols-1 items-end gap-4 desktop:grid-cols-2 desktop:gap-6">
      <PickerSearch value={search} onChange={setSearch} />
      <RangeSlider
        label="Power"
        isNamed
        value={wp}
        onCommit={setSpan}
        scale={scale}
        apart={0}
        format={(value) => shown(value, 0)}
        note="Wp"
        ticks={hasTicks ? [300, 400, 500, 650].filter((value) => value >= scale.min && value <= scale.max).map((value) => ({ value, label: shown(value, 0) })) : undefined}
      />
    </div>
  );

  return (
    <EquipmentPicker
      open={open}
      onClose={onClose}
      kind="modules"
      words={WORDS}
      current={current}
      filters={filters}
      search={search}
      isFiltered={isFiltered || search !== ""}
      onClearSearch={() => setSearch("")}
      onClearFilters={() => {
        setSearch("");
        setSpan(null);
      }}
      rows={rows}
      total={modules.length}
      loadError={error}
      onRetry={retry}
      columns={COLUMNS}
      sort={sort}
      onSort={(key) => setSort((now) => nextPickerSort(now, key, MODULE_COLUMNS, MODULE_START))}
      orders={orderOptions(MODULE_COLUMNS, MODULE_START)}
      onOrder={(order) => setSort(sortOfOrder(order))}
      readBy={api.parseModule}
      onRead={onRead}
    />
  );
}
