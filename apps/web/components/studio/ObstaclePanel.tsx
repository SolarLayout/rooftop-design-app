"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useStores, useView } from "@/components/shell/stores";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { LIST_GAP } from "@/components/ui/design-numbers";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { indexAfterKey } from "@/components/ui/list-keys";
import { FACT, LIST, ROW as MENU_ROW, ROW_MARKED } from "@/components/ui/list-look";
import { NumberField } from "@/components/ui/NumberField";
import { shown } from "@/components/ui/number-entry";
import { StatusMark } from "@/components/ui/StatusMark";
import { useFloating } from "@/components/ui/use-floating";
import type { Obstacle, Project, Roof } from "@/lib/api";
import { centroidOf } from "@/lib/outline/measure";
import {
  factOfNewKind,
  factsOf,
  FEWEST_POINTS,
  fieldsOfObstacle,
  newObstacleOf,
  OBSTACLE_KINDS,
  withObstacleAdded,
  withObstacleAt,
  withObstacleField,
  withoutObstacleAt,
  withPoint,
  withPointAdded,
  withPointRemoved,
  wordOfKind,
  type DraftObstacle,
  type ObstacleFieldId,
  type ObstacleKind,
} from "@/lib/studio/obstacle-fields";
import { indexToReview, REVIEW_HINT } from "@/lib/studio/review-heights";
import { draftOf, selectionOf, toReviewOf } from "@/lib/stores/view-store";
import { fieldsLayoutOf, SECTION } from "./inspector-look";
import type { Size } from "./use-size";

type Props = { roof: Roof; size: Size };

/** The icon of each kind, as the boards draw the rows. */
export const ICON_OF_KIND: Record<ObstacleKind, IconName> = { box: "box", cylinder: "tank", wall: "wall", tree: "tree", building: "building" };

/** A point of a wall or a building: metres east and north, as the corners of "Enter dimensions by hand". */
const POINT = { min: -5000, max: 5000, decimals: 2 };

const ROW = "flex h-11.5 items-center gap-2.5 rounded-row border border-line bg-surface-1 px-3 text-left cursor-pointer press-motion focus-ring hovered:bg-surface-2";
const CARD = "flex flex-col gap-2.5 rounded-row border border-accent bg-note-surface p-3 shadow-halo-selected";

/** The design with its roof changed; the same design when the roof is the same. */
const withRoof = (design: Project, roof: Roof): Project => (roof === design.roof ? design : { ...design, roof });

/**
 * The name of an obstacle in the head of its card: typed as a draft, committed on Enter or when the focus
 * leaves, given up with Escape, as a field is.
 */
function NameField({ name, onCommit }: { name: string; onCommit: (name: string) => void }) {
  const [typed, setTyped] = useState<string | null>(null);

  function commit() {
    if (typed === null) return;
    setTyped(null);
    const trimmed = typed.trim();
    if (trimmed !== "" && trimmed !== name) onCommit(trimmed);
  }

  return (
    <input
      type="text"
      aria-label="Name"
      autoComplete="off"
      value={typed ?? name}
      onChange={(event) => setTyped(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit();
        if (event.key === "Escape") setTyped(null);
      }}
      className="min-w-0 grow rounded-xs border-0 bg-transparent font-semibold text-text outline-none focus-ring"
    />
  );
}

type PointsProps<Kind extends Obstacle | DraftObstacle> = { obstacle: Kind; onChange: (next: Kind) => void };

/** The points of a wall or a building, as the corner table of "Enter dimensions by hand": east and north of each, added and removed. */
function PointsTable<Kind extends Obstacle | DraftObstacle>({ obstacle, onChange }: PointsProps<Kind>) {
  const fewest = obstacle.kind === "wall" ? FEWEST_POINTS.wall : FEWEST_POINTS.building;
  const atTheFewest = obstacle.points.length <= fewest;
  return (
    <div className="flex flex-col gap-1.5" data-testid="points-table">
      <div className="flex items-center gap-2 type-caption text-text-3">
        <span className="w-10 shrink-0">Point</span>
        <span className="grow basis-0 pr-6 text-right">East</span>
        <span className="grow basis-0 pr-6 text-right">North</span>
        <span className="w-9 shrink-0" />
      </div>
      {obstacle.points.map(([east, north], index) => (
        <div key={index} data-testid="point-row" className="flex items-center gap-2">
          <span className="w-10 shrink-0 type-small">{index + 1}</span>
          <NumberField label={`East of point ${index + 1}`} labelHidden value={east} unit="m" range={POINT} labelInside onCommit={(value) => onChange(withPoint(obstacle, index, [value, north]))} className="grow basis-0" />
          <NumberField label={`North of point ${index + 1}`} labelHidden value={north} unit="m" range={POINT} labelInside onCommit={(value) => onChange(withPoint(obstacle, index, [east, value]))} className="grow basis-0" />
          <IconButton label={`Remove point ${index + 1}`} icon="bin" iconSize={16} kind="quiet" size="s" disabled={atTheFewest} onClick={() => onChange(withPointRemoved(obstacle, index))} className="shrink-0" />
        </div>
      ))}
      <Button size="s" icon="plus" onClick={() => onChange(withPointAdded(obstacle))} className="self-start">
        Add a point
      </Button>
      <p className="type-caption text-text-3">
        Metres east and north of the middle of the roof, in order. {fewest === FEWEST_POINTS.wall ? "Two" : "Three"} at least.
      </p>
    </div>
  );
}

type CardProps<Kind extends Obstacle | DraftObstacle> = {
  obstacle: Kind;
  size: Size;
  onChange: (next: Kind) => void;
  /** Hears the height alone, where a typed height does more than set a field: a draft joins the design by it. */
  onHeight?: (height: number) => void;
  /** The focus goes into the height when the card opens: the height is what is asked. */
  focusHeight?: boolean;
  onRemove?: () => void;
  /** A line under the fields: the hint of a height to review. */
  hint?: ReactNode;
  /** The actions in the foot of the card. */
  foot?: ReactNode;
};

/**
 * The open card of the selected obstacle (the board "Obstacle edited on the roof"): its name editable in the
 * head, the word of its kind, Remove, and its fields by its kind two to a row; a wall's and a building's
 * points as a table.
 */
export function ObstacleCard<Kind extends Obstacle | DraftObstacle>({ obstacle, size, onChange, onHeight, focusHeight = false, onRemove, hint, foot }: CardProps<Kind>) {
  const card = useRef<HTMLDivElement>(null);
  const hasPoints = obstacle.kind === "wall" || obstacle.kind === "building";

  useEffect(() => {
    if (focusHeight) card.current?.querySelector<HTMLElement>("[data-initial-focus]")?.focus();
  }, [focusHeight]);

  function commitField(id: ObstacleFieldId, value: number) {
    if (id === "height" && onHeight) return onHeight(value);
    onChange(withObstacleField(obstacle, id, value));
  }

  return (
    <div ref={card} data-testid="obstacle-card" className={CARD}>
      <div className="flex items-center gap-2.5">
        <Icon name={ICON_OF_KIND[obstacle.kind]} size={20} stroke="light" className="text-accent" />
        <NameField name={obstacle.name} onCommit={(name) => onChange({ ...obstacle, name })} />
        <span className="type-caption text-text-2">{wordOfKind(obstacle.kind)}</span>
        {onRemove ? <IconButton label={`Remove ${obstacle.name}`} icon="bin" iconSize={16} kind="quiet" size="xs" onClick={onRemove} /> : null}
      </div>
      <div className={fieldsLayoutOf(size)}>
        {fieldsOfObstacle(obstacle).map((field) => (
          <NumberField
            key={field.id}
            label={field.label}
            value={field.id === "height" ? obstacle.height : field.value}
            unit={field.unit}
            range={field.range}
            labelInside={size !== "phone"}
            initialFocus={field.id === "height" && focusHeight}
            onCommit={(value) => commitField(field.id, value)}
            className={field.id === "trunk_height" && size !== "phone" ? "col-span-2" : undefined}
          />
        ))}
      </div>
      {hasPoints ? <PointsTable obstacle={obstacle} onChange={onChange} /> : null}
      {hint}
      {foot}
    </div>
  );
}

/** A row of the list: the icon of the kind, the name, the size and the height, a mark where the height is to be reviewed; a press selects. */
function ObstacleRow({ obstacle, isToReview, onSelect }: { obstacle: Obstacle; isToReview: boolean; onSelect: () => void }) {
  return (
    <button type="button" data-testid="obstacle-row" onClick={onSelect} className={ROW}>
      <Icon name={ICON_OF_KIND[obstacle.kind]} size={20} stroke="light" className="text-text-2" />
      <span className="grow truncate font-medium">{obstacle.name}</span>
      <code className="type-caption whitespace-nowrap text-text-2">{factsOf(obstacle)}</code>
      {isToReview ? <StatusMark kind="note" label={HEIGHT_TO_REVIEW} wordsShown={false} size={14} /> : null}
    </button>
  );
}

/** The words of the mark on a row whose height is to be reviewed. */
const HEIGHT_TO_REVIEW = "Height to review";

/** The hint in the open card of an obstacle whose height came from the import, not from the file. */
function ReviewHint() {
  return (
    <p data-testid="review-hint" className="flex items-start gap-2 type-caption text-text-3">
      <Icon name="note" size={14} className="mt-0.75 shrink-0 text-accent" />
      {REVIEW_HINT}
    </p>
  );
}

/** Add opens the kinds, each with the size a new one gets; the chosen kind becomes a draft at the centre of the roof (decision 15). */
function AddMenu({ onAdd }: { onAdd: (kind: ObstacleKind) => void }) {
  const [floating, trigger] = useFloating({ side: "below", align: "start", gap: LIST_GAP });
  const rows = useRef<HTMLUListElement>(null);
  const [marked, setMarked] = useState<number | null>(null);

  function open() {
    floating.open();
    setMarked(0);
    rows.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')[0]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const items = [...(rows.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const current = items.findIndex((item) => item === document.activeElement);
    const to = indexAfterKey(items.length, current === -1 ? null : current, event.key, new Set());
    if (to !== null || ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) event.preventDefault();
    if (to !== null) {
      setMarked(to);
      items[to]?.focus();
    }
  }

  return (
    <>
      <Button
        ref={trigger}
        size="s"
        icon="plus"
        aria-haspopup="menu"
        aria-expanded={floating.isOpen}
        onClick={() => (floating.isOpen ? floating.close() : open())}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          open();
        }}
        className="ml-auto"
      >
        Add
      </Button>
      <FloatingPanel floating={floating} width="list">
        <ul ref={rows} role="menu" aria-label="Add an obstacle" onKeyDown={onKeyDown} className={LIST}>
          {OBSTACLE_KINDS.map(({ id, word }, index) => (
            <li key={id} role="none">
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                onPointerEnter={() => setMarked(index)}
                onClick={() => {
                  floating.closeAndGoBack();
                  onAdd(id);
                }}
                className={classNames(MENU_ROW, "w-full text-left focus-ring", marked === index && ROW_MARKED)}
              >
                <Icon name={ICON_OF_KIND[id]} size={18} stroke="light" className="text-text-2" />
                <span className="grow">{word}</span>
                <span className={FACT}>{factOfNewKind(id)}</span>
              </button>
            </li>
          ))}
        </ul>
      </FloatingPanel>
    </>
  );
}

/**
 * The obstacles of the Roof lens (plan/phase-05-plan.md, step 12; the board "Obstacle edited on the roof"):
 * "Obstacles · n" with Add, a row per obstacle, the selected one open as a card, a draft before it has its
 * height, and the parapet as a read-only row at the end. The selection is the view store's: the row and the
 * obstacle on the roof open the same card.
 */
export function ObstaclePanel({ roof, size }: Props) {
  const { project: store, view } = useStores();
  const selection = useView(selectionOf);
  const draft = useView(draftOf);
  const toReview = useView(toReviewOf);
  const own = roof.obstacles.map((obstacle, index) => ({ obstacle, index })).filter(({ obstacle }) => !obstacle.auto);
  const selected = selection?.kind === "obstacle" ? selection.index : null;

  const commitRoof = (change: (roof: Roof) => Roof) => store.getState().commit((design) => withRoof(design, change(design.roof)));

  function add(kind: ObstacleKind) {
    const centre = centroidOf(roof.outline.map(([x, y]) => ({ x, y })));
    view.getState().setDraft(newObstacleOf(kind, [centre.x, centre.y], roof.obstacles));
  }

  /** The draft joins the design with the height that was typed, and is the selected one. */
  function addWithHeight(height: number) {
    if (!draft) return;
    const index = roof.obstacles.length;
    commitRoof((before) => withObstacleAdded(before, draft, height));
    view.getState().select({ kind: "obstacle", index });
  }

  function remove(index: number) {
    commitRoof((before) => withoutObstacleAt(before, index));
    view.getState().clearSelection();
  }

  /** An obstacle changed in its card; a height typed into one to review takes it off the list (decision 13). */
  function change(index: number, next: Obstacle) {
    const before = roof.obstacles[index];
    commitRoof((roofBefore) => withObstacleAt(roofBefore, index, next));
    if (before && next.height !== before.height) view.getState().reviewed(before.name);
  }

  /** Review and Next select the next obstacle to review; null when there is none. */
  const nextToReview = (after?: string) => indexToReview(roof.obstacles, toReview, after);
  const selectToReview = (after?: string) => {
    const index = nextToReview(after);
    if (index !== null) view.getState().select({ kind: "obstacle", index });
  };

  return (
    <section aria-label="Obstacles" className="flex flex-col gap-2.5">
      <div className="flex items-center">
        <h2 className={SECTION}>Obstacles · {own.length}</h2>
        <AddMenu onAdd={add} />
      </div>
      {draft ? (
        <ObstacleCard
          obstacle={draft}
          size={size}
          onChange={(next) => view.getState().setDraft(next)}
          onHeight={addWithHeight}
          focusHeight
          foot={
            <div className="flex justify-end gap-2">
              <Button kind="quiet" size="s" onClick={() => view.getState().setDraft(null)}>
                Remove
              </Button>
              <Button kind="primary" size="s" aria-disabled={draft.height === null || undefined}>
                Add the {wordOfKind(draft.kind).toLowerCase()}
              </Button>
            </div>
          }
        />
      ) : null}
      {own.length === 0 && !draft ? <p className="type-small text-text-2">None yet. Add a box, a tank, a wall, a tree or a building.</p> : null}
      <ul className="flex flex-col gap-2.5">
        {own.map(({ obstacle, index }) => {
          const isToReview = toReview.includes(obstacle.name);
          return (
            <li key={index}>
              {selected === index ? (
                <ObstacleCard
                  obstacle={obstacle}
                  size={size}
                  onChange={(next) => change(index, next)}
                  onRemove={() => remove(index)}
                  focusHeight={isToReview}
                  hint={isToReview ? <ReviewHint /> : undefined}
                  foot={
                    isToReview && nextToReview(obstacle.name) !== null ? (
                      <div className="flex justify-end">
                        <Button kind="quiet" size="s" onClick={() => selectToReview(obstacle.name)}>
                          Next
                        </Button>
                      </div>
                    ) : undefined
                  }
                />
              ) : (
                <ObstacleRow obstacle={obstacle} isToReview={isToReview} onSelect={() => view.getState().select({ kind: "obstacle", index })} />
              )}
            </li>
          );
        })}
      </ul>
      {roof.parapet_h > 0 ? (
        <div data-testid="parapet-row" className="flex h-10 items-center gap-2.5 px-3 type-small text-text-3">
          <Icon name="parapet" size={20} stroke="light" />
          <span className="grow">Parapet, all edges</span>
          <code className="type-caption">h {shown(roof.parapet_h, 1)} m</code>
        </div>
      ) : null}
    </section>
  );
}
