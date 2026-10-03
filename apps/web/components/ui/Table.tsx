import { classNames } from "./class-names";
import { Icon } from "./Icon";
import { StatusMark } from "./StatusMark";
import { cardOf, cellLinesOf, columnsOfTable, type CellLine, type Column } from "./table-cells";
import { ariaSortOf, nextSort, type Sort } from "./table-sort";

type Props<Row> = {
  /** What the table holds, in words. It stands under the table and is its name. */
  caption: string;
  columns: ReadonlyArray<Column<Row>>;
  rows: readonly Row[];
  /** What tells one row from another. */
  keyOf: (row: Row) => string;
  /** The key of the row that is chosen. */
  chosen?: string;
  /** The key of the row that sums the others up: over a line, its name in Geist 600, its figures medium (the year under the months). */
  total?: string;
  /** Cells padded 6 rather than 8: a table at the inspector's width (the board "Inverter and sizing"). */
  dense?: boolean;
  /** The values of a card on phone in two columns rather than three, where they are long ("54.3 of 65.0 A"). */
  cardColumns?: 2 | 3;
  /** The sort the rows are given in; null for the order given. With `onSort`, a head whose column sorts is a button that asks for the next one. */
  sort?: Sort | null;
  onSort?: (sort: Sort | null) => void;
  className?: string;
};

const HEAD = "h-9 border-b border-line type-section whitespace-nowrap text-text-3 uppercase";
// The head of a column that sorts is a button across the cell: the active one in text with the arrow of its direction.
const SORT_HEAD = "flex h-9 w-full cursor-pointer items-center gap-1 rounded-xs type-section uppercase select-none focus-ring hovered:text-text-2";
const CELL = "h-11 border-b border-line-subtle whitespace-nowrap";
const TOTAL_CELL = "h-11 border-t border-line whitespace-nowrap";
const CAPTION = "type-caption text-text-2";

/** A cell of several lines: a quieter line under the value, or lines each with its label (cellLinesOf). */
function Lines({ lines }: { lines: readonly CellLine[] }) {
  if (lines.length === 1 && !lines[0]!.label && !lines[0]!.words) return lines[0]!.value;
  return (
    <span className="inline-flex flex-col">
      {lines.map((line, index) => (
        <span key={index} className={line.isBelow ? "type-caption font-normal text-text-3" : line.label ? "type-value-xs" : undefined}>
          {line.label ? <span className="type-label-s text-text-3">{line.label} </span> : null}
          {line.value}
          {line.words ? <span className="font-sans text-text-2"> {line.words}</span> : null}
        </span>
      ))}
    </span>
  );
}

/**
 * Rows of values under their heads. On phone each row is a card. The rows are shown as they are given: a table that sorts
 * is given its rows in the sort's order (table-sort.ts, sortedRows) and says the sort in its heads.
 */
export function Table<Row>({ caption, columns, rows, keyOf, chosen, total, dense = false, cardColumns = 3, sort = null, onSort, className }: Props<Row>) {
  const shown = columnsOfTable(columns);
  const padding = dense ? "px-1.5" : "px-2";
  const sorts = (column: Column<Row>) => onSort !== undefined && column.sortBy !== undefined;

  return (
    <div className={className}>
      <table className="hidden w-full border-collapse tablet:table">
        <caption className={classNames(CAPTION, "caption-bottom pt-2.5 text-left")}>{caption}</caption>
        <thead>
          <tr>
            {shown.map((column) => {
              const atTheRight = column.kind === "number";
              if (!sorts(column)) {
                return (
                  <th key={column.key} scope="col" className={classNames(HEAD, padding, atTheRight ? "text-right" : "text-left")}>
                    {column.head}
                  </th>
                );
              }
              const direction = ariaSortOf(sort, column.key);
              const isActive = direction !== "none";
              return (
                <th key={column.key} scope="col" aria-sort={direction} className={classNames(HEAD, "p-0", atTheRight ? "text-right" : "text-left")}>
                  <button type="button" onClick={() => onSort?.(nextSort(sort, column.key))} className={classNames(SORT_HEAD, padding, atTheRight ? "justify-end" : "justify-start", isActive ? "text-text" : "text-text-3")}>
                    {column.head}
                    {isActive ? <Icon name={direction === "ascending" ? "arrow-up" : "arrow-down"} size={14} /> : null}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isChosen = keyOf(row) === chosen;
            const isTotal = keyOf(row) === total;
            const cell = isTotal ? TOTAL_CELL : CELL;
            return (
              <tr key={keyOf(row)} aria-current={isChosen || undefined} data-total={isTotal || undefined} className={isChosen ? "bg-surface-2" : undefined}>
                {shown.map((column) => {
                  const mark = column.mark?.(row);
                  const lines = <Lines lines={cellLinesOf(row, column)} />;
                  const value = mark ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>{lines}</span>
                      <StatusMark kind={mark.kind} label={mark.label} wordsShown={false} size={16} />
                    </span>
                  ) : (
                    lines
                  );
                  if (column.kind === "name") {
                    return (
                      <th key={column.key} scope="row" className={classNames(cell, padding, "text-left", isTotal ? "font-semibold" : "font-medium")}>
                        {value}
                      </th>
                    );
                  }
                  return (
                    <td
                      key={column.key}
                      className={classNames(cell, padding, column.words ? "type-small whitespace-normal text-text" : "type-value-small", isTotal && "font-medium", column.kind === "number" && "text-right")}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex flex-col gap-2.5 tablet:hidden">
        <ul aria-label={caption} className="flex flex-col gap-2.5">
          {rows.map((row) => {
            const card = cardOf(row, columns);
            const isChosen = keyOf(row) === chosen;
            return (
              <li
                key={keyOf(row)}
                aria-current={isChosen || undefined}
                className={classNames(
                  "flex flex-col gap-2.5 rounded-row border bg-surface-2 p-3.5",
                  isChosen ? "border-accent shadow-halo-selected" : "border-transparent",
                )}
              >
                <div className="flex items-center gap-2">
                  <h3 className="grow type-title">{card.title}</h3>
                  {card.mark ? <StatusMark kind={card.mark.kind} label={card.mark.label} wordsShown={false} size={18} /> : null}
                </div>
                <dl className={classNames("grid gap-x-2 gap-y-2.5", cardColumns === 2 ? "grid-cols-2" : "grid-cols-3")}>
                  {card.values.map((one) =>
                    one.words ? (
                      <div key={one.key} className="col-span-full flex min-w-0 flex-col">
                        <dt className="sr-only">{one.label}</dt>
                        <dd className="type-body-touch text-text-2">{one.value}</dd>
                      </div>
                    ) : (
                      <div key={one.key} className="flex min-w-0 flex-col gap-0.5">
                        <dt className={CAPTION}>{one.label}</dt>
                        <dd className="type-value-s">{one.value}</dd>
                      </div>
                    ),
                  )}
                </dl>
              </li>
            );
          })}
        </ul>
        <p className={CAPTION}>{caption}</p>
      </div>
    </div>
  );
}
