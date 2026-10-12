// The obstacles of the Roof step in words, one line each (V2 · 7, D103; audit V2-53): the name, then its kind, its size and
// its height without abbreviations. Those of one kind, size and height ("AC unit 1" to "AC unit 4") are counted in one line
// until one of them is selected. Pure; the panel draws what it gives.
import { shown } from "../../components/ui/number-entry";
import type { Obstacle } from "../api";
import { lengthOf, wordOfKind } from "../geometry/obstacle-fields";
import { areaOf } from "../geometry/measure";

export type ObstacleLine = {
  /** The obstacles of the design it stands for, by their index in the roof's list. */
  indexes: number[];
  title: string;
  detail: string;
};

const sizeOf = (obstacle: Obstacle): string => {
  switch (obstacle.kind) {
    case "box":
      return `${shown(obstacle.length, 1)} × ${shown(obstacle.width, 1)} m`;
    case "cylinder":
      return `${shown(obstacle.diameter, 1)} m across`;
    case "tree":
      return `crown ${shown(obstacle.diameter, 1)} m across`;
    case "wall":
      return `${shown(lengthOf(obstacle.points), 1)} m long`;
    case "building":
      return `${shown(Math.round(areaOf(obstacle.points.map(([x, y]) => ({ x, y })))), 0)} m²`;
  }
};

const heightOf = (obstacle: Obstacle): string => (obstacle.height === null || obstacle.height === undefined ? "height to review" : `${shown(obstacle.height, 1)} m high`);

/** What it is, how big, how high: "Box · 5.0 × 4.0 m · 3.0 m high". */
const detailOf = (obstacle: Obstacle): string => `${wordOfKind(obstacle.kind)} · ${sizeOf(obstacle)} · ${heightOf(obstacle)}`;

const PLURAL: Record<Obstacle["kind"], string> = { box: "boxes", cylinder: "tanks", tree: "trees", wall: "walls", building: "buildings" };

/** The shared name of those counted together: "AC unit 1", "AC unit 2" are "AC units"; null when they do not share one. */
function sharedNameOf(names: readonly string[]): string | null {
  const stems = new Set(names.map((name) => name.replace(/\s+\d+$/, "")));
  const [stem] = [...stems];
  if (stems.size !== 1 || stem === undefined || names.some((name) => name === stem)) return null;
  return /s$/.test(stem) ? stem : `${stem}s`;
}

export function obstacleLinesOf(obstacles: readonly Obstacle[], { selected }: { selected: number | null }): ObstacleLine[] {
  const lines: ObstacleLine[] = [];
  const counted = new Map<string, ObstacleLine>();
  obstacles.forEach((obstacle, index) => {
    if (obstacle.auto) return;
    const detail = detailOf(obstacle);
    const alone: ObstacleLine = { indexes: [index], title: obstacle.name, detail };
    const same = obstacles.map((one, at) => ({ one, at })).filter(({ one }) => !one.auto && detailOf(one) === detail);
    const name = sharedNameOf(same.map(({ one }) => one.name));
    const isCounted = same.length > 1 && name !== null && (selected === null || !same.some(({ at }) => at === selected));
    if (!isCounted) {
      lines.push(alone);
      return;
    }
    const key = `${name}|${detail}`;
    const line = counted.get(key);
    if (line) {
      line.indexes.push(index);
      return;
    }
    const group: ObstacleLine = { indexes: [index], title: name, detail: `${same.length} ${PLURAL[obstacle.kind]}${detail.slice(wordOfKind(obstacle.kind).length)}` };
    counted.set(key, group);
    lines.push(group);
  });
  return lines;
}
