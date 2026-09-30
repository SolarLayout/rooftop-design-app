"use client";

import { ROOF_TYPES } from "@/components/find/RoofTypeChoice";
import { useProject, useStores } from "@/components/shell/stores";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Roof } from "@/lib/api";
import { roofCardOf } from "@/lib/roof-card";
import { withRoofType } from "@/lib/studio/roof-type";
import { projectOf } from "@/lib/stores/project-store";

/** The way back to the map, with the outline of this design shown there. */
export const EDIT_THE_OUTLINE = "/find?edit=roof";

const SECTION = "type-section text-text-3 uppercase";

/**
 * The inspector of the Roof lens, as far as Phase 4 goes: the location and the outline, with Edit back to
 * the map, and the roof type. The parapet, the setback, the walkways, the clearance, the albedo and the
 * obstacles come with the stage of the roof (Phase 5).
 */
export function RoofInspector() {
  const project = useProject(projectOf);
  const { project: store } = useStores();
  const card = project ? roofCardOf(project.roof) : null;

  function chooseRoofType(roofType: Roof["roof_type"]) {
    store.getState().commit((design) => {
      const roof = withRoofType(design.roof, roofType);
      return roof === design.roof ? design : { ...design, roof };
    });
  }

  return (
    <div className="flex flex-col gap-section">
      <section aria-label="Location and outline" className="flex items-center gap-3.5 rounded-card border border-line bg-surface-1 p-card-compact shadow-card">
        <span aria-hidden="true" className="flex h-14 w-11 shrink-0 items-center justify-center rounded-row bg-surface-2">
          <span className="block h-3.5 w-8 rounded-xs border border-accent bg-outline-fill" />
        </span>
        <span className="flex min-w-0 grow flex-col gap-0.5">
          {card ? (
            <>
              <code data-testid="roof-place" className="type-value-xs whitespace-nowrap text-text">
                {card.place}
              </code>
              <span data-testid="roof-how" className="type-caption text-text-2">
                {card.how}
              </span>
              <span data-testid="roof-size" className="type-caption text-text-2">
                {card.size}
              </span>
            </>
          ) : (
            <Skeleton kind="text" className="w-32" />
          )}
        </span>
        <ButtonLink href={EDIT_THE_OUTLINE} size="s" className="shrink-0">
          Edit
        </ButtonLink>
      </section>

      <section className="flex flex-col gap-2.5">
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
      <p className="type-small text-text-2">The parapet, the setback, the walkways and the obstacles come with the stage of the roof.</p>
    </div>
  );
}
