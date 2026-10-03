import type { DesignOption, DesignResult, Project } from "@/lib/api";
import { earthViewOf } from "@/lib/handover/earth-view";
import { FactRows } from "./FactRows";

type Props = {
  /** The document, the run and the option the file is of. */
  files: { document: Project; design: DesignResult; option: DesignOption };
};

/**
 * The body of the Google Earth model (plan/phase-09-plan.md, step 19, decision 8; the board "Handover, previews"): two
 * columns on desktop, "In the file" in the KML's own names and "Not in the file" in words, one under the other below that.
 */
export function EarthPreview({ files }: Props) {
  const view = earthViewOf(files);

  return (
    <div data-testid="earth-model" className="grid items-start gap-6 desktop:grid-cols-2">
      <FactRows title="In the file" rows={view.inside} mono testId="kml-inside" />
      <FactRows title="Not in the file" rows={view.notInside} nameWidth="l" testId="kml-not-inside" />
    </div>
  );
}
