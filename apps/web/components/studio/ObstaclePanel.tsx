"use client";

import { SectionHeading } from "@/components/shell/help/SectionHeading";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStores, useView } from "@/components/shell/stores";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { NumberField } from "@/components/ui/NumberField";
import { shown } from "@/components/ui/number-entry";
import { StatusMark } from "@/components/ui/StatusMark";
import type { Obstacle, Project, Roof } from "@/lib/api";
import { centroidOf } from "@/lib/geometry/measure";
import {
  FEWEST_POINTS,
  fieldsOfObstacle,
  heightToAdd,
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
} from "@/lib/geometry/obstacle-fields";
import { indexToReview, REVIEW_HINT } from "@/lib/studio/review-heights";
import { obstacleLinesOf, type ObstacleLine } from "@/lib/studio/obstacle-lines";
import { draftOf, draggingOf, selectionOf, toReviewOf } from "@/lib/stores/view-store";
import { fieldsLayoutOf } from "./inspector-look";
import type { Size } from "@/components/shell/use-screen-size";

type Props = {
  roof: Roof;
  size: Size;
  /** Inside the Roof step's summary row (V2 · 3) the row is the heading: Add stands alone at the right. */
  isHeaded?: boolean;
};

/** The icon of each kind, as the boards draw the rows. */
export const ICON_OF_KIND: Record<ObstacleKind, IconName> = { box: "box", cylinder: "tank", wall: "wall", tree: "tree", building: "building" };

/** A point of a wall or a building: metres east and north, as the corners of "Enter dimensions by hand". */
const POINT = { min: -5000, max: 5000, decimals: 2 };

const ROW = "flex min-h-14 w-full items-center py-1.5 gap-2.5 rounded-row border border-line bg-surface-1 px-3 text-left cursor-pointer press-motion focus-ring hovered:bg-surface-2";
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
      className="min-w-0 grow rounded-control border-0 bg-transparent font-semibold text-text outline-none focus-ring"
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
      <div className="flex items-center gap-2 type-body-touch desktop:type-body text-text-3">
        <span className="w-10 shrink-0">Point</span>
        <span className="grow basis-0 pr-6 text-right">East</span>
        <span className="grow basis-0 pr-6 text-right">North</span>
        <span className="w-9 shrink-0" />
      </div>
      {obstacle.points.map(([east, north], index) => (
        <div key={index} data-testid="point-row" className="flex items-center gap-2">
          <span className="w-10 shrink-0 type-body-touch desktop:type-body">{index + 1}</span>
          <NumberField label={`East of point ${index + 1}`} labelHidden value={east} unit="m" range={POINT} labelInside onCommit={(value) => onChange(withPoint(obstacle, index, [value, north]))} className="grow basis-0" />
          <NumberField label={`North of point ${index + 1}`} labelHidden value={north} unit="m" range={POINT} labelInside onCommit={(value) => onChange(withPoint(obstacle, index, [east, value]))} className="grow basis-0" />
          <IconButton label={`Remove point ${index + 1}`} icon="bin" iconSize={16} kind="quiet" size="s" disabled={atTheFewest} onClick={() => onChange(withPointRemoved(obstacle, index))} className="shrink-0" />
        </div>
      ))}
      <Button size="s" icon="plus" onClick={() => onChange(withPointAdded(obstacle))} className="self-start">
        Add a point
      </Button>
      <p className="type-body-touch desktop:type-body text-text-3">
        Metres east and north of the middle of the roof, in order. {fewest === FEWEST_POINTS.wall ? "Two" : "Three"} at least.
      </p>
    </div>
  );
}

type CardProps<Kind extends Obstacle | DraftObstacle> = {
  obstacle: Kind;
  size: Size;
  onChange: (next: Kind) => void;
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
export function ObstacleCard<Kind extends Obstacle | DraftObstacle>({ obstacle, size, onChange, focusHeight = false, onRemove, hint, foot }: CardProps<Kind>) {
  const card = useRef<HTMLDivElement>(null);
  const hasPoints = obstacle.kind === "wall" || obstacle.kind === "building";

  useEffect(() => {
    if (focusHeight) card.current?.querySelector<HTMLElement>("[data-initial-focus]")?.focus();
  }, [focusHeight]);

  function commitField(id: ObstacleFieldId, value: number) {
    onChange(withObstacleField(obstacle, id, value));
  }

  return (
    <div ref={card} data-testid="obstacle-card" className={CARD}>
      <div className="flex items-center gap-2.5">
        <Icon name={ICON_OF_KIND[obstacle.kind]} size={20} stroke="light" className="text-accent" />
        <NameField name={obstacle.name} onCommit={(name) => onChange({ ...obstacle, name })} />
        <span className="type-body-touch desktop:type-body text-text-2">{wordOfKind(obstacle.kind)}</span>
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

/** A row of the list (V2 · 7): the icon of the kind, the name and under it what it is, how big and how high in words, a mark where the height is to be reviewed; a press selects. */
function ObstacleRow({ obstacle, line, isToReview, isSelected, onSelect }: { obstacle: Obstacle; line: ObstacleLine; isToReview: boolean; isSelected: boolean; onSelect: () => void }) {
  return (
    <button type="button" data-testid="obstacle-row" aria-current={isSelected || undefined} onClick={onSelect} className={classNames(ROW, isSelected && "border-accent")}>
      <Icon name={ICON_OF_KIND[obstacle.kind]} size={20} stroke="light" className="text-text-2" />
      <span className="flex min-w-0 grow flex-col">
        <span className="truncate font-medium">{line.title}</span>
        <span className="truncate type-body-touch desktop:type-body text-text-2">{line.detail}</span>
      </span>
      {isToReview ? <StatusMark kind="note" label={HEIGHT_TO_REVIEW} wordsShown={false} size={14} /> : null}
    </button>
  );
}

/** The words of the mark on a row whose height is to be reviewed. */
const HEIGHT_TO_REVIEW = "Height to review";

/** The hint in the open card of an obstacle whose height came from the import, not from the file. */
function ReviewHint() {
  return (
    <p data-testid="review-hint" className="flex items-start gap-2 type-body-touch desktop:type-body text-text-3">
      <Icon name="note" size={14} className="mt-0.75 shrink-0 text-accent" />
      {REVIEW_HINT}
    </p>
  );
}

/**
 * Add one (V2 · 7): the kinds stand in view as buttons, under a line that says what to do; the chosen kind becomes a draft
 * at the centre of the roof, to be placed there and given its height (decision 15).
 */
function AddKinds({ onAdd }: { onAdd: (kind: ObstacleKind) => void }) {
  return (
    <div data-testid="add-obstacle" className="flex flex-col gap-2">
      <p className="type-body-touch desktop:type-body text-text-2">Add one: choose its kind, then place it on the roof.</p>
      <div role="group" aria-label="Add an obstacle" className="flex flex-wrap gap-2">
        {OBSTACLE_KINDS.map(({ id, word }) => (
          <Button key={id} size="m" icon="plus" onClick={() => onAdd(id)}>
            {word}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * The obstacles of the Roof lens (plan/phase-05-plan.md, step 12; the board "Obstacle edited on the roof"):
 * "Obstacles · n" with Add, a row per obstacle, the selected one open as a card, a draft before it has its
 * height, and the parapet as a read-only row at the end. The selection is the view store's: the row and the
 * obstacle on the roof open the same card.
 */
export function ObstaclePanel({ roof, size, isHeaded = true }: Props) {
  const { project: store, view } = useStores();
  const selection = useView(selectionOf);
  const draft = useView(draftOf);
  const toReview = useView(toReviewOf);
  const dragging = useView(draggingOf);
  const selected = selection?.kind === "obstacle" ? selection.index : null;
  const lines = obstacleLinesOf(roof.obstacles, { selected });
  const own = lines.flatMap((line) => line.indexes);

  const commitRoof = (change: (roof: Roof) => Roof) => store.getState().commit((design) => withRoof(design, change(design.roof)));

  function add(kind: ObstacleKind) {
    const centre = centroidOf(roof.outline.map(([x, y]) => ({ x, y })));
    view.getState().setDraft(newObstacleOf(kind, [centre.x, centre.y], roof.obstacles));
  }

  /** Add, or Enter in the draft's card: the draft joins the design with the height its field holds, and is the selected
   * one. Leaving the field only fills the draft (issue 179, item 30). The store is read, not the render's draft: Enter has just
   * committed the height into it. */
  function addTheDraft() {
    const current = view.getState().draft;
    const height = heightToAdd(current);
    if (!current || height === null) return;
    const index = roof.obstacles.length;
    commitRoof((before) => withObstacleAdded(before, current, height));
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
      {isHeaded ? (
        <div className="flex items-center">
          <SectionHeading help="app.section.obstacles">Obstacles · {own.length}</SectionHeading>
        </div>
      ) : null}
      {draft ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            addTheDraft();
          }}
        >
          <ObstacleCard
            obstacle={draft}
            size={size}
            onChange={(next) => view.getState().setDraft(next)}
            focusHeight
            foot={
              <div className="flex justify-end gap-2">
                <Button kind="quiet" size="s" onClick={() => view.getState().setDraft(null)}>
                  Remove
                </Button>
                <Button kind="primary" size="s" type="submit" aria-disabled={heightToAdd(draft) === null || undefined}>
                  Add the {wordOfKind(draft.kind).toLowerCase()}
                </Button>
              </div>
            }
          />
        </form>
      ) : null}
      {own.length === 0 && !draft ? <p className="type-body-touch desktop:type-body text-text-2">None on the roof yet.</p> : null}
      <ul className="flex flex-col gap-2.5">
        {lines.map((line) => {
          const index = line.indexes[0] ?? 0;
          const obstacle = roof.obstacles[index];
          if (!obstacle) return null;
          const isToReview = line.indexes.some((at) => toReview.includes(roof.obstacles[at]?.name ?? ""));
          return (
            <li key={line.indexes.join("-")}>
              {line.indexes.length === 1 && selected === index ? (
                // While a drag lasts the card says the live values, as the board asks.
                <ObstacleCard
                  obstacle={dragging?.index === index ? dragging.obstacle : obstacle}
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
                <ObstacleRow obstacle={obstacle} line={line} isToReview={isToReview} isSelected={line.indexes.includes(selected ?? -1)} onSelect={() => view.getState().select({ kind: "obstacle", index })} />
              )}
            </li>
          );
        })}
      </ul>
      <AddKinds onAdd={add} />
      {roof.parapet_h > 0 ? (
        <div data-testid="parapet-row" className="flex h-10 items-center gap-2.5 px-3 type-body-touch desktop:type-body text-text-3">
          <Icon name="parapet" size={20} stroke="light" />
          <span className="grow">Parapet, all edges</span>
          <code className="type-body-touch desktop:type-body">h {shown(roof.parapet_h, 1)} m</code>
        </div>
      ) : null}
    </section>
  );
}
