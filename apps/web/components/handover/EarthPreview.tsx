import type { DesignOption, DesignResult, Project } from "@/lib/api";
import { earthViewOf } from "@/lib/handover/earth-view";
import { FactRows } from "./FactRows";

type Props = {
  /** The document, the run and the option the file is of. */
  files: { document: Project; design: DesignResult; option: DesignOption };
};

/**
 * The body of the Google Earth model (plan/phase-09-plan.md, step 19, decision 8; V2 · 9, audit V2-93): "In the file" in the
 * KML's own names, and one line under them on what Google Earth does not draw.
 */
export function EarthPreview({ files }: Props) {
  const view = earthViewOf(files);

  return (
    <div data-testid="earth-model" className="flex flex-col gap-3">
      <FactRows title="In the file" rows={view.inside} mono testId="kml-inside" />
      <p className="type-body-touch desktop:type-body text-text-2">{view.flat}</p>
    </div>
  );
}
