"use client";

import Link from "next/link";
import { ROOF_TYPES } from "@/lib/geometry/roof-types";
import { useProject, useResults, useStores, useView } from "@/components/shell/stores";
import { readoutsOf } from "@/lib/stores/results-store";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { NumberField } from "@/components/ui/NumberField";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusMark } from "@/components/ui/StatusMark";
import type { Project, Roof } from "@/lib/api";
import { roofCardOf, type RoofCard } from "@/lib/geometry/roof-card";
import { albedoLineOf, edgesFactsOf, obstaclesFactsOf, outlineFactsOf, roofFieldsOf, roofGroupsOf, roofTypeFactsOf, withRoofField, type RoofFieldId } from "@/lib/studio/roof-fields";
import { sectionSetByOf, wordOf, type SetBy } from "@/lib/studio/set-by";
import { HEIGHTS_SET, indexToReview, namesToReview, toReviewWordsOf } from "@/lib/studio/review-heights";
import { withRoofType } from "@/lib/geometry/roof-type-rule";
import { projectOf } from "@/lib/stores/project-store";
import { selectionOf, toReviewOf } from "@/lib/stores/view-store";
import { ObstaclePanel } from "./ObstaclePanel";
import { SetByHint } from "./SetByHint";
import { SummaryRow } from "@/components/shell/SummaryRow";
import type { Size } from "@/components/shell/use-screen-size";

type Props = {
  /** The size of the screen: the inspector is mounted once, in the container of the size (decision 9). */
  size: Size;
};

const YOURS: SetBy = { kind: "yours", byDefault: null };

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
 * The outline's card (V2 · 7, D103): where the roof is and how it was made, and Edit it in Plan, which turns the stage to the
 * plan with the outline's corners as handles. Find is for a new roof alone.
 */
function OutlineCard({ card, onEdit }: { card: RoofCard | null; onEdit: () => void }) {
  return (
    <section aria-label="Outline" className="flex items-center gap-3.5 rounded-row border border-line bg-surface-1 p-card-compact shadow-card">
      <RoofGlyph />
      {card ? <CardLines card={card} /> : <Skeleton kind="text" className="w-32" />}
      <Button size="s" className="shrink-0" onClick={onEdit}>
        Edit it in Plan
      </Button>
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
  const readouts = useResults(readoutsOf);
  if (!project) return <Skeleton kind="text" className="w-full" />;
  const { roof } = project;
  const card = roofCardOf(roof, project.roof_input.file);
  const reviewing = namesToReview(roof.obstacles, toReview);
  const fields = roofFieldsOf(roof);

  /** The outline edited where it is seen (V2 · 7): the plan, the roof selected, its corners as handles. */
  function editTheOutline() {
    view.getState().setCamera("plan");
    view.getState().select({ kind: "roof" });
  }

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
        {/* Fields stand in groups of what belongs together: 8 apart inside a group, 24 between groups (V2 · 7). */}
        <div className="flex flex-col gap-group">
          {roofGroupsOf(roof).map((group) => (
            <section key={group.title} aria-label={group.title} className="flex flex-col gap-2">
              <h3 className="type-body-touch desktop:type-body text-text-2">{group.title}</h3>
              {group.fields.map((field) => (
                <NumberField
                  key={field.id}
                  label={field.label}
                  value={field.value}
                  unit={field.unit}
                  range={field.range}
                  detail={<SetByHint setBy={field.setBy} words={field.hint} onReset={() => commitField(field.id, field.byDefault)} />}
                  onCommit={(value) => commitField(field.id, value)}
                />
              ))}
            </section>
          ))}
          {/* The roof's albedo has one home, Performance's assumptions. */}
          <Link href="/performance" data-testid="albedo-line" className="flex items-center justify-between gap-2 type-body-touch desktop:type-body text-text-2 focus-ring hovered:text-text">
            {albedoLineOf(roof)}
            <Icon name="arrow-right" size={14} className="shrink-0" />
          </Link>
        </div>
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
      <SummaryRow id="roof.location" title="Outline" help="studio.section.location" facts={outlineFactsOf(roof, readouts?.roof_area_m2 ?? null)} setBy={null}>
        <OutlineCard card={card} onEdit={editTheOutline} />
      </SummaryRow>
    </div>
  );
}
