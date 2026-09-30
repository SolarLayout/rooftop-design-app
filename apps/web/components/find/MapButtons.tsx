import type { Map as MapLibre } from "maplibre-gl";
import { classNames } from "@/components/ui/class-names";
import { IconButton } from "@/components/ui/IconButton";
import { NorthIcon } from "./NorthIcon";

type Props = {
  /** The map the buttons act on; null while there is none. */
  map: MapLibre | null;
  className?: string;
};

const BOX = "flex flex-col rounded-row border border-line bg-surface-1 shadow-float";

/** North up, zoom in, zoom out: as the mockup draws them, over the map. */
export function MapButtons({ map, className }: Props) {
  return (
    <div className={classNames("flex flex-col gap-2", className)}>
      <button
        type="button"
        aria-label="North up"
        onClick={() => map?.resetNorth()}
        className={classNames(BOX, "size-touch cursor-pointer items-center justify-center press-motion focus-ring hovered:bg-control-hover")}
      >
        <NorthIcon />
      </button>
      <div className={BOX}>
        <IconButton label="Zoom in" icon="plus" iconSize={18} kind="quiet" size="l" onClick={() => map?.zoomIn()} />
        <span className="mx-2 h-px bg-line" />
        <IconButton label="Zoom out" icon="minus" iconSize={18} kind="quiet" size="l" onClick={() => map?.zoomOut()} />
      </div>
    </div>
  );
}
