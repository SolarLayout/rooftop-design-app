"use client";

import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import type { IconName } from "@/components/ui/Icon";
import { canClearOf, cornersWordsOf } from "@/lib/outline/find-head";
import { canUndo } from "@/lib/outline/history";
import type { Tool } from "@/lib/outline/how-to";
import type { OutlineEvent, OutlineState } from "@/lib/outline/outline-state";

type ToolButton = { id: Tool; name: string; icon: IconName };

/** The three ways to outline, while the roof is open. */
export const OUTLINE_TOOLS: readonly ToolButton[] = [
  { id: "corners", name: "Corners", icon: "corners" },
  { id: "rectangle", name: "Rectangle", icon: "rectangle" },
  { id: "detect", name: "Detect building", icon: "detect" },
];

/** The obstacles, once the roof is closed (the board "Find"; the building beside the roof kept, V2 · 4). */
export const OBSTACLE_TOOLS: readonly ToolButton[] = [
  { id: "box", name: "Box", icon: "box" },
  { id: "tank", name: "Tank", icon: "tank" },
  { id: "wall", name: "Wall", icon: "wall" },
  { id: "tree", name: "Tree", icon: "tree" },
  { id: "building", name: "Building", icon: "building" },
];

/** The tool a state begins with: the corners while the roof is open, the box once it is closed. */
export const toolFor = (closed: boolean): Tool => (closed ? "box" : "corners");

/** Whether the tool is one of the roof's closed state: an obstacle. */
export const isObstacleTool = (tool: Tool): boolean => OBSTACLE_TOOLS.some(({ id }) => id === tool);

type ToolRowProps = { tools: readonly ToolButton[]; tool: Tool; onTool: (tool: Tool) => void; label: string };

/** A row of tools with their words; the one in hand pressed. */
export function ToolRow({ tools, tool, onTool, label }: ToolRowProps) {
  return (
    <div role="toolbar" aria-label={label} className="flex flex-wrap gap-1.5">
      {tools.map(({ id, name, icon }) => (
        <Button key={id} size="s" icon={icon} aria-pressed={id === tool} onClick={() => onTool(id)} className={classNames(id === tool && "border-line-strong bg-control-active")}>
          {name}
        </Button>
      ))}
    </div>
  );
}

type Props = { state: OutlineState; tool: Tool; onTool: (tool: Tool) => void; on: (event: OutlineEvent) => void };

/**
 * The tools of the outline in Find's column (V2 · 4, D98): Corners, Rectangle and Detect building with their words; the
 * corners placed, Undo and Clear with theirs. The instruction above follows the step, not the tool.
 */
export function OutlineTools({ state, tool, onTool, on }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <ToolRow tools={OUTLINE_TOOLS} tool={tool} onTool={onTool} label="Outline tools" />
      <div className="flex items-center gap-1">
        <span role="status" className="grow text-text-2">
          {cornersWordsOf(state.corners.length)}
        </span>
        <UndoAndClear state={state} on={on} />
      </div>
    </div>
  );
}

/**
 * Undo and Clear, wherever the map draws (issue 238, item 2): beside the count of corners while the outline is open,
 * under the obstacle kinds once it is closed. On touch they are the only way back.
 */
export function UndoAndClear({ state, on }: { state: OutlineState; on: (event: OutlineEvent) => void }) {
  return (
    <>
      <Button kind="quiet" size="s" icon="undo" disabled={!canUndo(state.history)} onClick={() => on({ type: "undone" })}>
        Undo
      </Button>
      <Button kind="quiet" size="s" icon="close" disabled={!canClearOf(state)} onClick={() => on({ type: "cleared" })}>
        Clear
      </Button>
    </>
  );
}
