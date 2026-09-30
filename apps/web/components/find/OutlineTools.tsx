"use client";

import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { canRedo, canUndo } from "@/lib/outline/history";
import { isClosedAndSettled, type OutlineEvent, type OutlineState } from "@/lib/outline/outline-state";
import type { Tool } from "./OutlineLayer";

type Props = {
  state: OutlineState;
  tool: Tool;
  onTool: (tool: Tool) => void;
  on: (event: OutlineEvent) => void;
  className?: string;
};

type ToolButton = { id: Tool; name: string; short: string; icon: IconName };

/** The three ways to outline, while the roof is open. */
export const OUTLINE_TOOLS: readonly ToolButton[] = [
  { id: "corners", name: "Corners", short: "Corners", icon: "corners" },
  { id: "rectangle", name: "Rectangle", short: "Rectangle", icon: "rectangle" },
  { id: "detect", name: "Detect building", short: "Detect", icon: "detect" },
];

/** The four obstacles, once the roof is closed (the board "Obstacles on the map and their heights"). */
export const OBSTACLE_TOOLS: readonly ToolButton[] = [
  { id: "box", name: "Box", short: "Box", icon: "box" },
  { id: "tank", name: "Tank", short: "Tank", icon: "tank" },
  { id: "wall", name: "Wall", short: "Wall", icon: "wall" },
  { id: "building", name: "Building", short: "Building", icon: "building" },
];

/** The tool a state begins with: the corners while the roof is open, the box once it is closed. */
export const toolFor = (closed: boolean): Tool => (closed ? "box" : "corners");

/** Whether the tool is one of the roof's open state, or of its closed state. */
export const isObstacleTool = (tool: Tool): boolean => OBSTACLE_TOOLS.some(({ id }) => id === tool);

const BAR = "flex items-center gap-1 rounded-card border border-line bg-surface-1 p-1.5 whitespace-nowrap shadow-float";
const TOOL = "px-3 tablet:px-4";

/**
 * The toolbar follows the state of the roof: open, the three ways to outline; closed, the four obstacles
 * to draw on it. Undo, redo and clear stay (docs/design/components.md, "Map outline tools").
 */
export function OutlineTools({ state, tool, onTool, on, className }: Props) {
  const tools = isClosedAndSettled(state) ? OBSTACLE_TOOLS : OUTLINE_TOOLS;
  return (
    <div role="toolbar" aria-label="Outline tools" className={classNames(BAR, className)}>
      {tools.map(({ id, name, short, icon }) => (
        <Button
          key={id}
          kind={id === tool ? "primary" : "quiet"}
          size="l"
          // The phone shows a shorter word; the name is the same on every size.
          aria-label={name}
          aria-pressed={id === tool}
          onClick={() => onTool(id)}
          className={classNames(TOOL, id !== tool && "text-text")}
        >
          <Icon name={icon} size={18} className="hidden tablet:block" />
          <span className="tablet:hidden">{short}</span>
          <span className="hidden tablet:inline">{name}</span>
        </Button>
      ))}
      <span className="mx-1 hidden h-6 w-px bg-line-strong tablet:block" />
      <IconButton label="Undo" icon="undo" iconSize={18} kind="quiet" size="l" disabled={!canUndo(state.history)} onClick={() => on({ type: "undone" })} />
      {/* The phone has room for Undo alone; the wrapper hides the others, since a button's own display would win over `hidden`. */}
      <span className="hidden tablet:contents">
        <IconButton label="Redo" icon="redo" iconSize={18} kind="quiet" size="l" disabled={!canRedo(state.history)} onClick={() => on({ type: "redone" })} />
        <IconButton
          label="Clear outline"
          icon="bin"
          iconSize={18}
          kind="quiet"
          size="l"
          disabled={state.corners.length === 0 && state.obstacles.length === 0}
          onClick={() => on({ type: "cleared" })}
        />
      </span>
    </div>
  );
}
