"use client";

import { SectionHeading } from "@/components/shell/help/SectionHeading";
import { classNames } from "@/components/ui/class-names";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { obstacleLineOf } from "@/lib/outline/find-head";
import type { Tool } from "@/lib/outline/how-to";
import type { Obstacle, ObstacleKind } from "@/lib/outline/obstacles";
import type { OutlineEvent, OutlineState } from "@/lib/outline/outline-state";
import { OBSTACLE_TOOLS, ToolRow } from "./OutlineTools";

type Props = {
  state: OutlineState;
  tool: Tool;
  onTool: (tool: Tool) => void;
  on: (event: OutlineEvent) => void;
};

const ICON_OF_KIND: Record<ObstacleKind, IconName> = { box: "box", cylinder: "tank", wall: "wall", tree: "tree", building: "building" };

const ROW = "flex min-h-14 items-center gap-2.5 rounded-row border pr-1 pl-3";
const ROW_SELECTED = "border-accent bg-note-surface shadow-halo-selected";
const ROW_NOT_SELECTED = "border-line bg-surface-1";

/**
 * The obstacles of Find's column once the outline is closed (V2 · 4, D98): the kinds with their words, then what was
 * drawn in words ("Stair room · Box · 5.0 × 4.0 m · 3.0 m high"); the one selected is the one selected on the map.
 */
export function ObstacleList({ state, tool, onTool, on }: Props) {
  const { obstacles, selectedObstacle } = state;
  return (
    <section aria-label="Obstacles" className="flex flex-col gap-row">
      <SectionHeading help="app.section.obstacles">Obstacles · {obstacles.length}</SectionHeading>
      <p className="text-text-2">Choose a kind, then draw it on the map.</p>
      <ToolRow tools={OBSTACLE_TOOLS} tool={tool} onTool={onTool} label="Obstacle kinds" />
      {obstacles.length === 0 ? null : (
        <ul className="flex flex-col gap-1.5 pt-1">
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
        className="flex min-w-0 grow cursor-pointer items-center gap-2.5 rounded-control py-2 text-left focus-ring"
      >
        <Icon name={ICON_OF_KIND[obstacle.kind]} size={18} className={classNames("shrink-0", selected ? "text-accent" : "text-text-2")} />
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className="truncate font-medium">{obstacle.name}</span>
          <span className="truncate type-body-touch text-text-2 desktop:type-body">{obstacleLineOf(obstacle)}</span>
        </span>
      </button>
      <IconButton label={`Remove ${obstacle.name}`} icon="bin" iconSize={16} kind="quiet" size="s" onClick={() => on({ type: "obstacleRemoved", id: obstacle.id })} />
    </li>
  );
}
