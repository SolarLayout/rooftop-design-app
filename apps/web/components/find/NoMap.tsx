import { Button } from "@/components/ui/Button";
import { StatusMark } from "@/components/ui/StatusMark";
import type { MapState } from "@/lib/map/map-state";

type Props = { state: Exclude<MapState, { kind: "ready" }>; onByHand: () => void };

/** The place of the map when it cannot be shown: why, in one line, and the way on without it. */
export function NoMap({ state, onByHand }: Props) {
  return (
    <div role="status" className="flex h-full flex-col items-center justify-center gap-3 bg-ground px-10 text-center">
      <StatusMark kind="note" label="Note" wordsShown={false} size={22} />
      <div className="flex flex-col gap-1">
        <span className="font-medium">{state.title}</span>
        <span className="type-small text-text-2">{state.reason}</span>
      </div>
      <Button onClick={onByHand}>Enter dimensions by hand instead</Button>
    </div>
  );
}
