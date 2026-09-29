import { classNames } from "./class-names";
import { StatusMark } from "./StatusMark";
import { cardOf, columnsOfTable, type Column } from "./table-cells";

type Props<Row> = {
  /** What the table holds, in words. It stands under the table and is its name. */
  caption: string;
  columns: ReadonlyArray<Column<Row>>;
  rows: readonly Row[];
  /** What tells one row from another. */
  keyOf: (row: Row) => string;
  /** The key of the row that is chosen. */
  chosen?: string;
  className?: string;
};

const HEAD = "h-9 border-b border-line px-2 type-section whitespace-nowrap text-text-3 uppercase";
const CELL = "h-11 border-b border-line-subtle px-2 whitespace-nowrap";
const CAPTION = "type-caption text-text-2";

/** Rows of values under their heads. On phone each row is a card. */
export function Table<Row>({ caption, columns, rows, keyOf, chosen, className }: Props<Row>) {
  const shown = columnsOfTable(columns);

  return (
    <div className={className}>
      <table className="hidden w-full border-collapse tablet:table">
        <caption className={classNames(CAPTION, "caption-bottom pt-2.5 text-left")}>{caption}</caption>
        <thead>
          <tr>
            {shown.map((column) => (
              <th key={column.key} scope="col" className={classNames(HEAD, column.kind === "number" ? "text-right" : "text-left")}>
                {column.head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isChosen = keyOf(row) === chosen;
            return (
              <tr key={keyOf(row)} aria-current={isChosen || undefined} className={isChosen ? "bg-surface-2" : undefined}>
                {shown.map((column) => {
                  const mark = column.mark?.(row);
                  const value = mark ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>{column.value(row)}</span>
                      <StatusMark kind={mark.kind} label={mark.label} wordsShown={false} size={16} />
                    </span>
                  ) : (
                    column.value(row)
                  );
                  if (column.kind === "name") {
                    return (
                      <th key={column.key} scope="row" className={classNames(CELL, "text-left font-medium")}>
                        {value}
                      </th>
                    );
                  }
                  return (
                    <td key={column.key} className={classNames(CELL, "type-value-small", column.kind === "number" && "text-right")}>
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
                <dl className="grid grid-cols-3 gap-x-2 gap-y-2.5">
                  {card.values.map((one) => (
                    <div key={one.key} className="flex min-w-0 flex-col gap-0.5">
                      <dt className={CAPTION}>{one.label}</dt>
                      <dd className="type-value-s">{one.value}</dd>
                    </div>
                  ))}
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
