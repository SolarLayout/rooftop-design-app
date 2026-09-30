"use client";

import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { canRedo, canUndo } from "@/lib/outline/history";
import type { OutlineEvent, OutlineState } from "@/lib/outline/outline-state";
import type { Tool } from "./OutlineLayer";

type Props = {
  state: OutlineState;
  tool: Tool;
  onTool: (tool: Tool) => void;
  on: (event: OutlineEvent) => void;
  className?: string;
};

const TOOLS: { id: Tool; name: string; short: string; icon: IconName; comesWith: string | null }[] = [
  { id: "corners", name: "Corners", short: "Corners", icon: "corners", comesWith: null },
  { id: "rectangle", name: "Rectangle", short: "Rectangle", icon: "rectangle", comesWith: null },
  { id: "detect", name: "Detect building", short: "Detect", icon: "detect", comesWith: "Comes with step 10 of the phase" },
];

const BAR = "flex items-center gap-1 rounded-card border border-line bg-surface-1 p-1.5 whitespace-nowrap shadow-float";
const TOOL = "px-3 tablet:px-4";

/** The three ways to outline, and undo, redo and clear (docs/design/components.md, "Map outline tools"). */
export function OutlineTools({ state, tool, onTool, on, className }: Props) {
  return (
    <div role="toolbar" aria-label="Outline tools" className={classNames(BAR, className)}>
      {TOOLS.map(({ id, name, short, icon, comesWith }) => {
        const button = (
          <Button
            key={id}
            kind={id === tool ? "primary" : "quiet"}
            size="l"
            aria-pressed={id === tool}
            aria-disabled={comesWith ? "true" : undefined}
            onClick={() => (comesWith ? undefined : onTool(id))}
            className={classNames(TOOL, id !== tool && "text-text")}
          >
            <Icon name={icon} size={18} className="hidden tablet:block" />
            <span className="tablet:hidden">{short}</span>
            <span className="hidden tablet:inline">{name}</span>
          </Button>
        );
        return comesWith ? (
          <Tooltip key={id} words={comesWith}>
            {button}
          </Tooltip>
        ) : (
          button
        );
      })}
      <span className="mx-1 hidden h-6 w-px bg-line-strong tablet:block" />
      <IconButton label="Undo" icon="undo" iconSize={18} kind="quiet" size="l" disabled={!canUndo(state.history)} onClick={() => on({ type: "undone" })} />
      {/* The phone has room for Undo alone; the wrapper hides the others, since a button's own display would win over `hidden`. */}
      <span className="hidden tablet:contents">
        <IconButton label="Redo" icon="redo" iconSize={18} kind="quiet" size="l" disabled={!canRedo(state.history)} onClick={() => on({ type: "redone" })} />
        <IconButton label="Clear outline" icon="bin" iconSize={18} kind="quiet" size="l" disabled={state.corners.length === 0} onClick={() => on({ type: "cleared" })} />
      </span>
    </div>
  );
}
