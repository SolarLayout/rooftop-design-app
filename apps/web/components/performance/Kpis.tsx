import { Card } from "@/components/ui/Card";
import { classNames } from "@/components/ui/class-names";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stat, Stats } from "@/components/ui/Stat";
import type { KpisView } from "@/lib/performance/kpis";

type Props = {
  view: KpisView;
  /** The values are of before, and a new run is on its way: they stay, dimmed, with the ring beside the energy. */
  isDimmed: boolean;
};

// Desktop: the lead tile takes 5 of 12 columns, the six tiles the other 7, three to a row. Tablet: the lead across,
// the tiles three to a row. Phone: the lead across, the tiles two to a row.
const ROW = "grid gap-3 tablet:gap-grid desktop:grid-cols-12";
const LEAD = "flex flex-col justify-between gap-3.5 p-5 tablet:gap-4 tablet:p-card desktop:col-span-5";
const P_CELLS = "grid grid-cols-p-values-phone gap-2 tablet:grid-cols-3";
const TILES = "grid grid-cols-2 gap-3 tablet:grid-cols-3 tablet:gap-grid desktop:col-span-7";
const TILE = classNames(
  "rounded-card border border-line bg-surface-1 p-4 shadow-card",
  "tablet:px-5.5 tablet:py-4.5 desktop:min-h-27 desktop:py-0",
);

/** The lead tile of the energy with its exceedance values, and the six tiles (the board "Performance"). */
export function Kpis({ view, isDimmed }: Props) {
  return (
    <div className={ROW}>
      <Card data-testid="kpi-energy" className={LEAD}>
        <Stats className="contents">
          <Stat look="hero" label={view.lead.label} value={view.lead.quantity.number} unit={view.lead.quantity.unit} dimmed={isDimmed} beside={isDimmed ? <ProgressRing size={16} /> : undefined} />
        </Stats>
        <Stats className={P_CELLS}>
          {view.pValues.map((cell) => (
            <Stat key={cell.label} data-testid="p-value" look="tile" label={cell.label} value={cell.value} dimmed={isDimmed} />
          ))}
        </Stats>
      </Card>
      <Stats className={TILES}>
        {view.tiles.map((tile) => (
          <Stat key={tile.id} data-testid={`kpi-${tile.id}`} look="figure" label={tile.label} value={tile.quantity.number} unit={tile.quantity.unit} more={tile.more} dimmed={isDimmed} className={TILE} />
        ))}
      </Stats>
    </div>
  );
}

// The widths of the skeletons, while no value was ever there: a label and a value in each place.
const TILE_BONES = [
  { label: "w-25", value: "w-18" },
  { label: "w-28.5", value: "w-27" },
  { label: "w-32", value: "w-18" },
  { label: "w-25", value: "w-27" },
  { label: "w-28.5", value: "w-18" },
  { label: "w-32", value: "w-27" },
];

/** In the place of the KPIs at the first load: skeletons (components.md, "Skeleton"), never for a value that was there. */
export function KpiSkeletons() {
  return (
    <div className={ROW}>
      <div className={classNames(LEAD, "rounded-card border border-line bg-surface-1 shadow-card")}>
        <div className="flex flex-col gap-3">
          <Skeleton kind="label" className="w-35" />
          <Skeleton kind="lead" className="w-57.5" />
        </div>
        <div className={P_CELLS}>
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex flex-col gap-1.5 rounded-row bg-surface-2 px-3.5 py-2.5">
              <Skeleton kind="label" className="w-7" onTile />
              <Skeleton kind="value" className="w-16" onTile />
            </div>
          ))}
        </div>
      </div>
      <div className={TILES}>
        {TILE_BONES.map((bone, index) => (
          <div key={index} className={classNames(TILE, "flex flex-col justify-center gap-2.5")}>
            <Skeleton kind="label" className={bone.label} />
            <Skeleton kind="value" className={bone.value} />
          </div>
        ))}
      </div>
    </div>
  );
}
