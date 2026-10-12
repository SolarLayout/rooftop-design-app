"use client";

import Link from "next/link";
import { ROOF_TYPES } from "@/lib/geometry/roof-types";
import { useProject, useStores, useView } from "@/components/shell/stores";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { NumberField } from "@/components/ui/NumberField";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusMark } from "@/components/ui/StatusMark";
import type { Project, Roof } from "@/lib/api";
import { roofCardOf, type RoofCard } from "@/lib/geometry/roof-card";
import { edgesFactsOf, obstaclesFactsOf, placeFactsOf, roofFieldsOf, roofTypeFactsOf, withRoofField, type RoofFieldId } from "@/lib/studio/roof-fields";
import { sectionSetByOf, wordOf, type SetBy } from "@/lib/studio/set-by";
import { HEIGHTS_SET, indexToReview, namesToReview, toReviewWordsOf } from "@/lib/studio/review-heights";
import { withRoofType } from "@/lib/geometry/roof-type-rule";
import { projectOf } from "@/lib/stores/project-store";
import { selectionOf, toReviewOf } from "@/lib/stores/view-store";
import { ObstaclePanel } from "./ObstaclePanel";
import { SetByHint } from "./SetByHint";
import { SummaryRow } from "./SummaryRow";
import type { Size } from "./use-size";

type Props = {
  /** The size of the screen: the inspector is mounted once, in the container of the size (decision 9). */
  size: Size;
};

const YOURS: SetBy = { kind: "yours", byDefault: null };

/** The way back to the map, with the outline of this design shown there. */
export const EDIT_THE_OUTLINE = "/find?edit=roof";

/** The design with its roof changed; the same design when the roof is the same. */
function withRoof(design: Project, roof: Roof): Project {
  return roof === design.roof ? design : { ...design, roof };
}

/** The glyph of the card: the roof as the map showed it, outlined in the accent. */
function RoofGlyph({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={classNames("flex size-14 shrink-0 items-center justify-center rounded-control bg-surface-2", className)}>
      <span className="block h-3.5 w-8 rounded-control border border-accent bg-outline-fill" />
    </span>
  );
}

/** The four lines of the card: where, how it was entered, what it has, its size; then the file it came from. */
function CardLines({ card }: { card: RoofCard }) {
  return (
    <span className="flex min-w-0 grow flex-col gap-0.5">
      <code data-testid="roof-place" className="type-body-touch desktop:type-body whitespace-nowrap text-text">
        {card.place}
      </code>
      <span data-testid="roof-how" className="type-body-touch desktop:type-body text-text-2">
        {card.how}
      </span>
      <span data-testid="roof-count" className="type-body-touch desktop:type-body text-text-2">
        {card.count}
      </span>
      <span data-testid="roof-size" className="type-body-touch desktop:type-body text-text-2">
        {card.size}
      </span>
      {card.file === null ? null : (
        <code data-testid="roof-file" className="type-body-touch desktop:type-body truncate text-text-2">
          {card.file}
        </code>
      )}
    </span>
  );
}

/**
 * The card of the roof (the boards "Studio, Roof lens" on three sizes): on tablet and desktop a card with
 * Edit at its right; on phone a row of the sheet that leads to the map as a whole.
 */
function LocationCard({ card, size }: { card: RoofCard | null; size: Size }) {
  if (size === "phone") {
    return (
      <Link href={EDIT_THE_OUTLINE} aria-label="Edit the outline" className="flex min-h-21 items-center gap-3 border-b border-line-subtle text-text focus-ring">
        <RoofGlyph className="size-11" />
        {card ? <CardLines card={card} /> : <Skeleton kind="text" className="w-32" />}
        <Icon name="chevron-right" size={18} className="shrink-0 text-text-3" />
      </Link>
    );
  }
  return (
    <section aria-label="Location and outline" className="flex items-center gap-3.5 rounded-row border border-line bg-surface-1 p-card-compact shadow-card">
      <RoofGlyph />
      {card ? <CardLines card={card} /> : <Skeleton kind="text" className="w-32" />}
      <ButtonLink href={EDIT_THE_OUTLINE} size="s" className="shrink-0">
        Edit
      </ButtonLink>
    </section>
  );
}

/**
 * The note under the card after an import (the board "Import with missing heights"): the engine's sentence,
 * how many obstacles are to review, and Review, which selects the first of them (decision 13).
 */
function ReviewNote({ count, onReview }: { count: number; onReview: () => void }) {
  return (
    <div data-testid="review-note" className="flex gap-3 rounded-row border border-accent bg-note-surface px-3.5 py-3 shadow-halo-selected">
      <StatusMark kind="note" label="Note" wordsShown={false} size={20} className="mt-px shrink-0" />
      <div className="flex grow flex-col gap-2">
        <span className="font-medium text-text">{HEIGHTS_SET}</span>
        <div className="flex items-center gap-3">
          <span className="grow type-body-touch desktop:type-body text-text-2">{toReviewWordsOf(count)}</span>
          <Button kind="primary" size="s" onClick={onReview}>
            Review
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * The Roof step's sections (V2 · 3, D97; the board "The Studio's first open"): each one line of facts with who set it, that
 * opens in place: the roof type, the edges and access as fields that commit as fields do (decision 16), each saying who
 * set it with Reset for the user's value, the obstacles, and where the roof is with Edit. The obstacles open while one is
 * selected on the roof. The note of heights to review stands over them.
 */
export function RoofInspector({ size }: Props) {
  const project = useProject(projectOf);
  const { project: store, view } = useStores();
  const toReview = useView(toReviewOf);
  const selection = useView(selectionOf);
  if (!project) return <Skeleton kind="text" className="w-full" />;
  const { roof } = project;
  const card = roofCardOf(roof, project.roof_input.file);
  const reviewing = namesToReview(roof.obstacles, toReview);
  const fields = roofFieldsOf(roof);

  function review() {
    const index = indexToReview(roof.obstacles, toReview);
    if (index !== null) view.getState().select({ kind: "obstacle", index });
  }

  function chooseRoofType(roofType: Roof["roof_type"]) {
    store.getState().commit((design) => withRoof(design, withRoofType(design.roof, roofType)));
  }

  function commitField(id: RoofFieldId, value: number) {
    store.getState().commit((design) => withRoof(design, withRoofField(design.roof, id, value)));
  }

  const edgesBy = sectionSetByOf(fields.map((field) => field.setBy));

  return (
    <div data-size={size} className="flex flex-col">
      {reviewing.length > 0 ? <ReviewNote count={reviewing.length} onReview={review} /> : null}
      {/* The roof type is the user's: Find asks for it before the roof is built. */}
      <SummaryRow id="roof.type" title="Roof type" help="app.section.roof-type" facts={roofTypeFactsOf(roof)} setBy={wordOf(YOURS)}>
        <Segmented label="Roof type" options={ROOF_TYPES.map(({ id, short }) => ({ value: id, label: short }))} value={roof.roof_type} onChange={chooseRoofType} fill />
      </SummaryRow>
      <SummaryRow id="roof.edges" title="Edges and access" help="studio.section.edges-and-access" facts={edgesFactsOf(roof)} setBy={edgesBy && wordOf(edgesBy)}>
        {fields.map((field) => (
          <NumberField
            key={field.id}
            label={field.label}
            value={field.value}
            unit={field.unit}
            range={field.range}
            detail={<SetByHint setBy={field.setBy} onReset={() => commitField(field.id, field.byDefault)} />}
            onCommit={(value) => commitField(field.id, value)}
          />
        ))}
      </SummaryRow>
      <SummaryRow
        id="roof.obstacles"
        title={`Obstacles · ${roof.obstacles.length}`}
        help="app.section.obstacles"
        facts={obstaclesFactsOf(roof.obstacles)}
        setBy={roof.obstacles.length > 0 ? wordOf(YOURS) : null}
        isHeldOpen={selection?.kind === "obstacle" || reviewing.length > 0}
      >
        <ObstaclePanel roof={roof} size={size} isHeaded={false} />
      </SummaryRow>
      <SummaryRow id="roof.location" title="Location" help="studio.section.location" facts={placeFactsOf(roof)} setBy={null}>
        <LocationCard card={card} size={size} />
      </SummaryRow>
    </div>
  );
}
