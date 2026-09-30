import { Button } from "@/components/ui/Button";
import { StatusMark } from "@/components/ui/StatusMark";
import { Tooltip } from "@/components/ui/Tooltip";
import type { MapState } from "@/lib/map/map-state";

type Props = { state: Exclude<MapState, { kind: "ready" }> };

export const WHY_NOT_BY_HAND = "Comes with the third pull request of the phase";

/** The place of the map when it cannot be shown: why, in one line, and the way on without it. */
export function NoMap({ state }: Props) {
  return (
    <div role="status" className="flex h-full flex-col items-center justify-center gap-3 bg-ground px-10 text-center">
      <StatusMark kind="note" label="Note" wordsShown={false} size={22} />
      <div className="flex flex-col gap-1">
        <span className="font-medium">{state.title}</span>
        <span className="type-small text-text-2">{state.reason}</span>
      </div>
      <Tooltip words={WHY_NOT_BY_HAND}>
        <Button aria-disabled="true">Enter dimensions by hand instead</Button>
      </Tooltip>
    </div>
  );
}
