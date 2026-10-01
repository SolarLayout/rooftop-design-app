"use client";

import Link from "next/link";
import { ROOF_TYPES } from "@/components/find/RoofTypeChoice";
import { useProject, useStores } from "@/components/shell/stores";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { NumberField } from "@/components/ui/NumberField";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Project, Roof } from "@/lib/api";
import { roofCardOf, type RoofCard } from "@/lib/roof-card";
import { roofFieldsOf, withRoofField, type RoofFieldId } from "@/lib/studio/roof-fields";
import { withRoofType } from "@/lib/studio/roof-type";
import { projectOf } from "@/lib/stores/project-store";
import type { Size } from "./use-size";

type Props = {
  /** The size of the screen: the inspector is mounted once, in the container of the size (decision 9). */
  size: Size;
};

/** The way back to the map, with the outline of this design shown there. */
export const EDIT_THE_OUTLINE = "/find?edit=roof";

export const SECTION = "type-section text-text-3 uppercase";

/**
 * How the fields of a section stand: two to a row with the label inside on tablet and desktop; on phone
 * one to a row, the label before the field, as the boards draw the edges and the fields of an obstacle.
 */
export const fieldsLayoutOf = (size: Size) => (size === "phone" ? "flex flex-col gap-field" : "grid grid-cols-2 gap-field");

/** The design with its roof changed; the same design when the roof is the same. */
function withRoof(design: Project, roof: Roof): Project {
  return roof === design.roof ? design : { ...design, roof };
}

/** The glyph of the card: the roof as the map showed it, outlined in the accent. */
function RoofGlyph({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={classNames("flex size-14 shrink-0 items-center justify-center rounded-control bg-surface-2", className)}>
      <span className="block h-3.5 w-8 rounded-xs border border-accent bg-outline-fill" />
    </span>
  );
}

/** The four lines of the card: where, how it was entered, what it has, its size; then the file it came from. */
function CardLines({ card }: { card: RoofCard }) {
  return (
    <span className="flex min-w-0 grow flex-col gap-0.5">
      <code data-testid="roof-place" className="type-value-xs whitespace-nowrap text-text">
        {card.place}
      </code>
      <span data-testid="roof-how" className="type-caption text-text-2">
        {card.how}
      </span>
      <span data-testid="roof-count" className="type-caption text-text-2">
        {card.count}
      </span>
      <span data-testid="roof-size" className="type-caption text-text-2">
        {card.size}
      </span>
      {card.file === null ? null : (
        <code data-testid="roof-file" className="type-value-xs truncate text-text-2">
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
    <section aria-label="Location and outline" className="flex items-center gap-3.5 rounded-card-s border border-line bg-surface-1 p-card-compact shadow-card">
      <RoofGlyph />
      {card ? <CardLines card={card} /> : <Skeleton kind="text" className="w-32" />}
      <ButtonLink href={EDIT_THE_OUTLINE} size="s" className="shrink-0">
        Edit
      </ButtonLink>
    </section>
  );
}

/**
 * The inspector of the Roof lens (plan/phase-05-plan.md, steps 11 to 13): the card of the roof with Edit,
 * the roof type, the edges and access as fields that commit as fields do (decision 16). On tablet it
 * stands in two columns under the vitals; on phone in the sheet.
 */
export function RoofInspector({ size }: Props) {
  const project = useProject(projectOf);
  const { project: store } = useStores();
  const card = project ? roofCardOf(project.roof, project.roof_input.file) : null;

  function chooseRoofType(roofType: Roof["roof_type"]) {
    store.getState().commit((design) => withRoof(design, withRoofType(design.roof, roofType)));
  }

  function commitField(id: RoofFieldId, value: number) {
    store.getState().commit((design) => withRoof(design, withRoofField(design.roof, id, value)));
  }

  return (
    <div data-size={size} className="flex flex-col gap-4 tablet:grid tablet:grid-cols-2 tablet:gap-8 desktop:flex desktop:gap-4">
      <div className="flex flex-col gap-4 tablet:gap-5 desktop:contents">
        <LocationCard card={card} size={size} />

        <section aria-label="Roof type" className="flex flex-col gap-2.5">
          <h2 className={SECTION}>Roof type</h2>
          {project ? (
            <Segmented
              label="Roof type"
              options={ROOF_TYPES.map(({ id, short }) => ({ value: id, label: short }))}
              value={project.roof.roof_type}
              onChange={chooseRoofType}
              fill
            />
          ) : (
            <Skeleton kind="text" className="w-full" />
          )}
        </section>

        <section aria-label="Edges and access" className="flex flex-col gap-2.5">
          <h2 className={SECTION}>Edges and access</h2>
          {project ? (
            <div className={fieldsLayoutOf(size)}>
              {roofFieldsOf(project.roof).map((field) => (
                <NumberField key={field.id} label={field.label} value={field.value} unit={field.unit} range={field.range} labelInside={size !== "phone"} onCommit={(value) => commitField(field.id, value)} />
              ))}
            </div>
          ) : (
            <Skeleton kind="text" className="w-full" />
          )}
        </section>
      </div>
    </div>
  );
}
