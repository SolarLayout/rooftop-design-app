"use client";

import { classNames } from "@/components/ui/class-names";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { factsOf, type Obstacle, type ObstacleKind } from "@/lib/outline/obstacles";
import type { OutlineEvent, OutlineState } from "@/lib/outline/outline-state";
import { SECTION } from "@/components/ui/section-look";

type Props = {
  state: OutlineState;
  on: (event: OutlineEvent) => void;
  className?: string;
};

const ICON_OF_KIND: Record<ObstacleKind, IconName> = { box: "box", cylinder: "tank", wall: "wall", building: "building" };

const ROW = "flex h-11.5 items-center gap-2.5 rounded-row border pr-1 pl-3";
const ROW_SELECTED = "border-accent bg-note-surface shadow-halo-selected";
const ROW_NOT_SELECTED = "border-line bg-surface-1";

/** The obstacles drawn on the roof, with their size and their height; the selected one is the selected one on the map. */
export function ObstacleList({ state, on, className }: Props) {
  const { obstacles, selectedObstacle } = state;
  return (
    <section aria-label="Obstacles" className={classNames("flex flex-col gap-2.5", className)}>
      <h2 className={SECTION}>Obstacles · {obstacles.length}</h2>
      {obstacles.length === 0 ? (
        <p className="type-small text-text-2">None yet. Draw a box, a tank, a wall or a building with the tools on the map. Each asks its height.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {obstacles.map((obstacle) => (
            <ObstacleRow key={obstacle.id} obstacle={obstacle} selected={obstacle.id === selectedObstacle} on={on} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ObstacleRow({ obstacle, selected, on }: { obstacle: Obstacle; selected: boolean; on: (event: OutlineEvent) => void }) {
  return (
    <li data-testid="obstacle-row" data-selected={selected || undefined} className={classNames(ROW, selected ? ROW_SELECTED : ROW_NOT_SELECTED)}>
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => on({ type: "obstacleSelected", id: selected ? null : obstacle.id })}
        className="flex min-w-0 grow items-center gap-2.5 rounded-control text-left focus-ring"
      >
        <Icon name={ICON_OF_KIND[obstacle.kind]} size={18} className={selected ? "text-accent" : "text-text-2"} />
        <span className="grow truncate font-medium">{obstacle.name}</span>
        <code className="type-caption whitespace-nowrap text-text-2">{factsOf(obstacle)}</code>
      </button>
      <IconButton label={`Remove ${obstacle.name}`} icon="bin" iconSize={16} kind="quiet" size="s" onClick={() => on({ type: "obstacleRemoved", id: obstacle.id })} />
    </li>
  );
}
