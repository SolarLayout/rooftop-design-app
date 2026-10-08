"use client";

import { useEffect, useId, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { Dialog, type DialogAction } from "@/components/ui/Dialog";
import { carriesFiles, fileOf } from "@/components/ui/dropped-file";
import { Icon } from "@/components/ui/Icon";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Select } from "@/components/ui/Select";
import { StatusMark } from "@/components/ui/StatusMark";
import { ApiError, type CallOptions, type EquipmentFile } from "@/lib/api";
import type { Kind } from "@/lib/equipment/catalog";
import { base64Of, libraryFileOf } from "@/lib/equipment/library-file";
import type { PickerSort } from "@/lib/equipment/picker";

/** A column of the list: its head, its width, whether it sorts, and whether it is shown on desktop alone. */
export type PickerColumn = { key: string; head: string; width: string; sorts: boolean; isDesktopOnly?: boolean };

/**
 * A row of the list, in words. `cells` follow the columns after the first, which is the model's. `mark`: a reason for the
 * exclamation mark under the maker (an inverter rated under the system voltage set), or none.
 */
export type PickerRow = { file: string; model: string; second: string; cells: readonly string[]; phone: string; preliminary: boolean; mark?: string | null };

export type PickerWords = {
  /** "Choose a module" */
  title: string;
  /** "module", "inverter" */
  thing: string;
  /** "modules", "inverters" */
  things: string;
  /** "Use this module" */
  use: string;
  /** "PAN", "OND" */
  fileKind: string;
  /** The endings the file chooser offers: ".pan,.PAN" */
  accept: string;
};

type Props<Read> = {
  open: boolean;
  onClose: () => void;
  kind: Kind;
  words: PickerWords;
  /** The file of the design's equipment: tagged "In this design" when it is of the library, and the list opens on it. */
  current: string | null;
  /** The filters: the search and the range sliders. */
  filters: ReactNode;
  search: string;
  isFiltered: boolean;
  onClearSearch: () => void;
  onClearFilters: () => void;
  /** The rows shown, in their order; null while the catalog loads. */
  rows: readonly PickerRow[] | null;
  total: number;
  loadError: string | null;
  onRetry: () => void;
  columns: readonly PickerColumn[];
  sort: PickerSort;
  onSort: (key: string) => void;
  /** The orders of the select that stands for the heads on phone. */
  orders: ReadonlyArray<{ value: string; label: string }>;
  onOrder: (order: string) => void;
  /** The API's reading of a file: what was read, or a refusal in the engine's words. */
  readBy: (file: EquipmentFile, options: CallOptions) => Promise<Read>;
  /** Hears the file once the API read it; what becomes of it is for who opened the picker. */
  onRead: (read: Read) => void;
};

type Reading = { kind: "idle" } | { kind: "reading"; file: string; isOwn: boolean } | { kind: "refused"; reason: string };
const IDLE: Reading = { kind: "idle" };

/** Why a file was not loaded: the words of the engine, or what the browser could not do. */
function reasonOf(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : `The file could not be read (${String(error)}). Choose another.`;
}

function Tag({ look, children }: { look: "here" | "note"; children: ReactNode }) {
  return (
    <span
      className={classNames(
        "inline-flex h-4.5 shrink-0 items-center rounded-xs border px-1.5 type-caption-s font-medium",
        look === "note" ? "border-note-line bg-note-surface text-accent" : "border-line-strong bg-surface-2 text-text",
      )}
    >
      {children}
    </span>
  );
}

/**
 * The picker of the app's library of PAN and OND files (D75; the boards "UI fixes · Choose a module or an inverter"): the
 * filters, the count, the list that sorts by its heads, the file of one's own, and the foot. A row chosen and used is
 * fetched from the library and read by the API as a dropped file is; a file the API refuses leaves the equipment of
 * before in place and says why (D32). Closing gives up a file that is being read.
 */
export function EquipmentPicker<Read>(props: Props<Read>) {
  const { open, onClose, kind, words, current, rows, columns, sort, readBy, onRead } = props;
  const id = useId();
  const [chosen, setChosen] = useState<string | null>(null);
  const [reading, setReading] = useState<Reading>(IDLE);
  const call = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const hasOpenedOn = useRef(false);
  // Each opening mounts the picker afresh (its key is the opening's): nothing chosen, nothing being read.

  const rowId = (file: string) => `${id}-${file}`;
  const isReading = reading.kind === "reading";
  const canUse = chosen !== null && chosen !== current && !isReading;

  // The list opens on the design's own when it is of the library, once its rows are in.
  useEffect(() => {
    if (!open || hasOpenedOn.current || rows === null || current === null) return;
    hasOpenedOn.current = true;
    document.getElementById(rowId(current))?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rows, current]);

  useEffect(() => {
    if (chosen !== null) document.getElementById(rowId(chosen))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen]);

  function giveUp() {
    call.current?.abort();
    call.current = null;
  }

  function close() {
    giveUp();
    setReading(IDLE);
    onClose();
  }

  async function read(file: string, isOwn: boolean, fileOfTheCall: (signal: AbortSignal) => Promise<EquipmentFile>) {
    giveUp();
    const thisCall = new AbortController();
    call.current = thisCall;
    setReading({ kind: "reading", file, isOwn });
    try {
      const answer = await readBy(await fileOfTheCall(thisCall.signal), { signal: thisCall.signal });
      if (thisCall.signal.aborted) return;
      call.current = null;
      setReading(IDLE);
      onRead(answer);
    } catch (error) {
      if (thisCall.signal.aborted) return;
      call.current = null;
      setReading({ kind: "refused", reason: reasonOf(error) });
    }
  }

  function take(file: string | null = chosen) {
    if (file === null || file === current || isReading) return;
    void read(file, false, (signal) => libraryFileOf(kind, file, (url, init) => fetch(url, init), signal));
  }

  function takeOwn(file: File | null) {
    if (!file || isReading) return;
    void read(file.name, true, async () => ({ name: file.name, base64: base64Of(new Uint8Array(await file.arrayBuffer())) }));
  }

  function onListKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!rows || rows.length === 0) return;
    const at = chosen === null ? -1 : rows.findIndex((row) => row.file === chosen);
    const next = (() => {
      switch (event.key) {
        case "ArrowDown":
          return Math.min(rows.length - 1, at + 1);
        case "ArrowUp":
          return Math.max(0, at - 1);
        case "Home":
          return 0;
        case "End":
          return rows.length - 1;
        default:
          return null;
      }
    })();
    if (next !== null) {
      event.preventDefault();
      setChosen(rows[next]?.file ?? null);
    } else if (event.key === "Enter" && chosen !== null) {
      event.preventDefault();
      take();
    }
  }

  const actions: DialogAction[] = [
    { label: "Cancel", kind: "quiet", onPress: close, shown: "panel" },
    { label: `Choose ${words.fileKind === "OND" ? "an" : "a"} ${words.fileKind} file of your own`, kind: "secondary", onPress: () => input.current?.click(), shown: "phone" },
    { label: reading.kind === "reading" && !reading.isOwn ? "Reading" : words.use, kind: "primary", onPress: () => take(), waits: !canUse, busy: reading.kind === "reading" && !reading.isOwn },
  ];

  const foot = chosen ? <code className="block truncate type-value-xs text-text-3">{chosen}</code> : null;

  return (
    <Dialog open={open} title={words.title} onClose={close} actions={actions} size="wide" foot={foot} isDescribed={false}>
      <div className="flex min-h-0 grow flex-col gap-3.5 text-text">
        {props.filters}
        <CountLine {...props} shown={rows?.length ?? 0} />
        <div
          ref={list}
          role="listbox"
          tabIndex={0}
          aria-label={words.title}
          aria-activedescendant={chosen ? rowId(chosen) : undefined}
          onKeyDown={onListKey}
          className="flex min-h-30 grow flex-col overflow-hidden rounded-row border border-line bg-well shadow-well focus-ring tablet:h-100 tablet:grow-0 tablet:shrink"
        >
          <Heads columns={columns} sort={sort} onSort={props.onSort} />
          <div className="min-h-0 grow overflow-y-auto">
            {rows === null ? (
              <Waiting error={props.loadError} onRetry={props.onRetry} />
            ) : rows.length === 0 ? (
              <Nothing {...props} />
            ) : (
              rows.map((row) => (
                <Row
                  key={row.file}
                  id={rowId(row.file)}
                  row={row}
                  columns={columns}
                  isChosen={row.file === chosen}
                  isCurrent={row.file === current}
                  onChoose={() => setChosen(row.file)}
                  onUse={() => take(row.file)}
                />
              ))
            )}
          </div>
        </div>
        <OwnFile words={words} reading={reading} onFile={takeOwn} onChoose={() => input.current?.click()} />
        <input
          ref={input}
          type="file"
          accept={words.accept}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(event) => {
            takeOwn(fileOf(event.currentTarget.files));
            event.currentTarget.value = "";
          }}
        />
        {reading.kind === "refused" ? (
          <p role="status" className="flex items-start gap-2.5 rounded-row border border-note-line bg-note-surface px-3.5 py-3 type-caption text-text-2">
            <StatusMark kind="note" label="Note" wordsShown={false} size={18} />
            <span className="flex flex-col gap-0.5">
              <span className="type-body font-medium text-text">This {words.thing} was not loaded</span>
              <span>
                {/[.!?]$/.test(reading.reason) ? reading.reason : `${reading.reason}.`} The {words.thing} of before is kept.
              </span>
            </span>
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

function CountLine<Read>({ words, total, shown, isFiltered, onClearFilters, sort, orders, onOrder }: Props<Read> & { shown: number }) {
  const clear = isFiltered ? (
    <button type="button" onClick={onClearFilters} className="cursor-pointer text-text-2 underline underline-offset-3 hovered:text-text focus-ring">
      Clear the filters
    </button>
  ) : null;
  return (
    <div className="flex items-center justify-between gap-3 type-caption text-text-2 tablet:type-small">
      <span role="status">
        {shown} of {total}
        <span className="hidden tablet:inline"> {words.things}</span>
        {clear ? <span className="tablet:hidden"> · {clear}</span> : null}
      </span>
      <span className="hidden tablet:inline">{clear}</span>
      <Select label="Order" options={orders} value={`${sort.key}:${sort.direction}`} onChange={onOrder} className="tablet:hidden" />
    </div>
  );
}

function Heads({ columns, sort, onSort }: { columns: readonly PickerColumn[]; sort: PickerSort; onSort: (key: string) => void }) {
  return (
    <div role="presentation" className="hidden h-8 shrink-0 items-center gap-3.5 border-b border-line bg-surface-1 pr-3.5 pl-2.5 type-caption text-text-3 tablet:flex tablet:h-touch desktop:h-8">
      <span className="w-4 shrink-0" />
      {columns.map((column, index) => {
        const place = classNames(index === 0 ? "min-w-0 grow justify-start" : classNames(column.width, "shrink-0 justify-end"), column.isDesktopOnly && "hidden desktop:flex");
        if (!column.sorts) return <span key={column.key} className={classNames("flex", place)}>{column.head}</span>;
        const isActive = sort.key === column.key;
        return (
          <button
            key={column.key}
            type="button"
            onClick={() => onSort(column.key)}
            className={classNames("flex h-full cursor-pointer items-center gap-1 whitespace-nowrap rounded-xs focus-ring", place, isActive ? "font-medium text-text" : "hovered:text-text-2")}
          >
            {column.head}
            {isActive ? <span className="sr-only">, sorted {sort.direction === "ascending" ? "upwards" : "downwards"}</span> : null}
            {isActive ? <Icon name={sort.direction === "ascending" ? "arrow-up" : "arrow-down"} size={14} /> : <Icon name="sort" size={14} />}
          </button>
        );
      })}
    </div>
  );
}

type RowProps = { id: string; row: PickerRow; columns: readonly PickerColumn[]; isChosen: boolean; isCurrent: boolean; onChoose: () => void; onUse: () => void };

function Row({ id, row, columns, isChosen, isCurrent, onChoose, onUse }: RowProps) {
  const tags = (
    <>
      {isCurrent ? <Tag look="here">In this design</Tag> : null}
      {row.preliminary ? <Tag look="note">Preliminary</Tag> : null}
    </>
  );
  return (
    <div
      id={id}
      role="option"
      aria-selected={isChosen}
      onClick={onChoose}
      onDoubleClick={onUse}
      className={classNames(
        "flex cursor-pointer items-center gap-2.5 border-b border-l-tab border-b-line-subtle py-2 pr-3 pl-2 last:border-b-0 tablet:gap-3.5 tablet:pr-3.5",
        // A row with a mark holds a third line, so it grows.
        row.mark ? "tablet:py-2.5" : "tablet:h-15 tablet:py-0 desktop:h-13",
        isChosen ? "border-l-accent bg-control-active shadow-halo-selected" : "border-l-transparent hovered:bg-surface-1",
      )}
    >
      <span className="flex w-4 shrink-0 text-accent">{isChosen ? <Icon name="tick" size={16} /> : null}</span>
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium">{row.model}</span>
          {tags}
        </span>
        <span className="truncate type-caption text-text-2">{row.second}</span>
        <span className="truncate type-value-xs text-text-2 tablet:hidden">{row.phone}</span>
        {row.mark ? (
          <span className="flex min-w-0 items-center gap-1.5 type-caption text-text-2">
            <StatusMark kind="note" label="Rated under the voltage set" wordsShown={false} size={14} />
            <span className="truncate">{row.mark}</span>
          </span>
        ) : null}
      </span>
      {columns.slice(1).map((column, index) => (
        <span key={column.key} className={classNames("hidden shrink-0 text-right type-value-s whitespace-nowrap tablet:block", column.width, column.isDesktopOnly && "tablet:hidden desktop:block")}>
          {row.cells[index]}
        </span>
      ))}
    </div>
  );
}

function Waiting({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 py-6 text-center">
      {error ? (
        <>
          <span className="text-text-2">{error}</span>
          <Button size="s" onClick={onRetry}>
            Try again
          </Button>
        </>
      ) : (
        <span className="flex items-center gap-2.5 text-text-2">
          <ProgressRing size={16} />
          Loading the library
        </span>
      )}
    </div>
  );
}

function Nothing<Read>({ words, search, onClearSearch, onClearFilters }: Props<Read>) {
  const isSearched = search.trim() !== "";
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 py-6 text-center">
      <span>{isSearched ? `No ${words.thing} in the app matches “${search.trim()}”.` : `No ${words.thing} in the app within these filters.`}</span>
      <span className="type-caption text-text-2">
        The search reads the maker, the model and the file’s name. {words.fileKind === "OND" ? "An" : "A"} {words.fileKind} file of your own is taken below.
      </span>
      <Button size="s" onClick={isSearched ? onClearSearch : onClearFilters}>
        {isSearched ? "Clear the search" : "Clear the filters"}
      </Button>
    </div>
  );
}

type OwnFileProps = { words: PickerWords; reading: Reading; onFile: (file: File | null) => void; onChoose: () => void };

/** The file of one's own, from tablet on: a slim drop under the list, its button opening the chooser. */
function OwnFile({ words, reading, onFile, onChoose }: OwnFileProps) {
  const entered = useRef(0);
  const [isOver, setOver] = useState(false);
  const isReadingOwn = reading.kind === "reading" && reading.isOwn;

  const onDrag = {
    onDragEnter(event: DragEvent<HTMLDivElement>) {
      if (!carriesFiles(event.dataTransfer.types)) return;
      event.preventDefault();
      entered.current += 1;
      setOver(true);
    },
    onDragOver(event: DragEvent<HTMLDivElement>) {
      if (carriesFiles(event.dataTransfer.types)) event.preventDefault();
    },
    onDragLeave() {
      entered.current = Math.max(0, entered.current - 1);
      if (entered.current === 0) setOver(false);
    },
    onDrop(event: DragEvent<HTMLDivElement>) {
      if (!carriesFiles(event.dataTransfer.types)) return;
      event.preventDefault();
      entered.current = 0;
      setOver(false);
      onFile(fileOf(event.dataTransfer.files));
    },
  };

  return (
    <div
      {...onDrag}
      className={classNames(
        "hidden h-13 shrink-0 items-center gap-3 rounded-row border border-dashed pr-2 pl-3.5 tablet:flex tablet:h-15 desktop:h-13",
        isOver ? "border-accent bg-note-surface shadow-halo-selected" : "border-line-strong",
      )}
    >
      {isReadingOwn ? <ProgressRing size={16} /> : <Icon name="upload" size={18} className={isOver ? "text-accent" : "text-text-2"} />}
      <span role="status" className="min-w-0 grow truncate text-text-2">
        {isReadingOwn ? (
          <>
            Reading the file <code className="type-value-xs">{reading.file}</code>
          </>
        ) : isOver ? (
          "Let go to load the file"
        ) : (
          `Or drop ${words.fileKind === "OND" ? "an" : "a"} ${words.fileKind} file of your own here`
        )}
      </span>
      <Button size="s" onClick={onChoose} disabled={reading.kind === "reading"}>
        Choose a file
      </Button>
    </div>
  );
}
