import { useId } from "react";
import { classNames } from "@/components/ui/class-names";

type Props = {
  /** The whole picture (desktop), or the roof as a strip with the far ground cut (tablet, under the subtitle). */
  view: "whole" | "strip";
  className?: string;
};

/** The views of the two boards: the whole picture of 940 by 480 from y 50; the strip from y 140, 380 high. */
const VIEW_BOX: Record<Props["view"], string> = { whole: "0 50 940 480", strip: "0 140 940 380" };

const ROOF = "matrix(8.154 -2.187 -3.807 -4.680 180 470)";
const ROWS = "matrix(1 0 -0.888 5.6 -0.375 ";
const MODULES = "matrix(8.154 -2.187 -3.677 -6.429 ";

/** The shadows the modules throw on the roof: one row of shadows under each row of modules, in the roof's own frame. */
const SHADOW_ROWS: Array<[y: number, parts: Array<[x: number, width: number]>]> = [
  [33.75, [[1.23, 27.652], [29.5, 27.652], [57.77, 27.652], [86.04, 2.286]]],
  [27.3, [[1.23, 27.652], [29.5, 27.652], [65.841, 19.581], [86.04, 2.286]]],
  [20.85, [[1.23, 14.969], [29.5, 27.652], [66.994, 18.428], [86.04, 2.286]]],
  [14.4, [[1.23, 16.122], [29.5, 27.652], [57.77, 27.652], [86.04, 2.286]]],
  [7.95, [[1.23, 27.652], [29.5, 27.652], [57.77, 27.652], [86.04, 2.286]]],
  [1.5, [[1.23, 27.652], [29.5, 27.652], [57.77, 11.51], [84.289, 1.133], [86.04, 2.286]]],
];

/** The rows of modules, from the back of the roof to its front, each at its place on the picture. */
const MODULE_ROWS: Array<[at: string, parts: Array<[x: number, width: number]>]> = [
  ["53.42 310.7", [[1.23, 27.652], [29.5, 27.652], [57.77, 27.652], [86.04, 2.286]]],
  ["77.97 340.89", [[1.23, 27.652], [29.5, 27.652], [65.841, 19.581], [86.04, 2.286]]],
  ["102.53 371.08", [[1.23, 14.969], [29.5, 27.652], [66.994, 18.428], [86.04, 2.286]]],
  ["127.08 401.26", [[1.23, 16.122], [29.5, 27.652], [57.77, 27.652], [86.04, 2.286]]],
  ["151.64 431.45", [[1.23, 27.652], [29.5, 27.652], [57.77, 27.652], [86.04, 2.286]]],
  ["176.19 461.63", [[1.23, 27.652], [29.5, 27.652], [57.77, 11.51], [84.289, 1.133], [86.04, 2.286]]],
];

function ModuleRow({ at, parts, pattern }: { at: string; parts: Array<[number, number]>; pattern: string }) {
  return (
    <g transform={`${MODULES}${at})`} fill={`url(#${pattern})`}>
      {parts.map(([x, width]) => (
        <rect key={x} transform={`translate(${x} 0)`} width={width} height="4.574" />
      ))}
    </g>
  );
}

/**
 * The 3D view of the demo roof on the approved board "Home": the slab with its parapet, the module rows, a plant room, a
 * tank and four vents with their shadows, on a grid fading into the ground. It is the board's own drawing; its colours are
 * the tokens of the page that mirror the scene's palette (design-tokens.md, `--color-scene-*`, `--color-module-*`). For
 * the eye only: the words beside it say the rest.
 */
export function HomeIllustration({ view, className }: Props) {
  const id = useId();
  const modules = `${id}-modules`;
  const grid = `${id}-grid`;
  const fade = `${id}-fade`;
  // The rows at the back of the picture are drawn before the plant room and the tank, those in front after them.
  const [back, middle, front] = [MODULE_ROWS.slice(0, 2), MODULE_ROWS.slice(2, 3), MODULE_ROWS.slice(3)];

  return (
    <svg viewBox={VIEW_BOX[view]} aria-hidden="true" className={classNames("block h-auto w-full text-ground", className)}>
      <defs>
        <pattern id={modules} patternUnits="userSpaceOnUse" width="1.153" height="2.297">
          <rect width="1.133" height="2.277" className="fill-module-glass" />
          <rect y="1.118" width="1.133" height="0.04" className="fill-module-cell-line" />
          <rect width="1.133" height="0.06" className="fill-module-frame" />
        </pattern>
        <pattern id={grid} patternUnits="userSpaceOnUse" width="10" height="10">
          <path d="M 10 0 L 0 0 L 0 10" fill="none" strokeWidth="0.12" className="stroke-scene-grid" />
        </pattern>
        <radialGradient id={fade} cx="50%" cy="52%" r="62%">
          <stop offset="55%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
        </radialGradient>
      </defs>
      {/* The ground: the grid, and the building's shadow on it. */}
      <g transform="matrix(8.154 -2.187 -3.807 -4.680 180 514.23)">
        <rect x="-60" y="-40" width="220" height="140" fill={`url(#${grid})`} />
        <polygon points="90,0 90,40 84.82,46.9 -5.18,46.9 -5.18,6.9 0,0" className="fill-dim" />
      </g>
      <rect y="50" width="940" height="480" fill={`url(#${fade})`} />
      {/* The slab, its edges, the parapet's cap. */}
      <g transform={ROOF}>
        <rect width="90" height="40" className="fill-scene-roof" />
        <rect x="1" y="1" width="88" height="38" fill="none" strokeWidth="0.08" className="stroke-scene-parapet-shade" strokeDasharray="0.5 0.4" />
      </g>
      <g transform="matrix(8.154 -2.187 0 -7.371 27.72 282.8)">
        <rect width="90" height="0.9" className="fill-scene-parapet-lit" />
      </g>
      <g transform="matrix(-3.807 -4.680 0 -7.371 913.86 273.17)">
        <rect width="40" height="0.9" className="fill-scene-parapet-shade" />
      </g>
      <g transform="matrix(8.154 -2.187 -3.807 -4.680 180 463.37)" className="fill-scene-roof-edge">
        <rect y="39.8" width="90" height="0.2" />
        <rect x="89.8" width="0.2" height="40" />
      </g>
      {/* The shadows on the roof: the parapet's, the plant room's, the tank's, the vents', the module rows'. */}
      <g transform={ROOF}>
        <g opacity="0.36" className="fill-ground">
          <polygon points="0,0 90,0 89.325,0.9 0,0.9" />
          <polygon points="90,0 90,40 89.325,40 89.325,0.9" />
          <polygon points="25,16 25,20 22.75,23 17.75,23 17.75,19 20,16" />
          <polygon points="63,24.75 61.5,26.75 59.5,25.25 61,23.25" />
          <circle cx="60.5" cy="26" r="1.25" />
          <polygon points="71.5,3 71.5,4 70.6,5.2 69.1,5.2 69.1,4.2 70,3" />
          <polygon points="74.5,3 74.5,4 73.6,5.2 72.1,5.2 72.1,4.2 73,3" />
          <polygon points="77.5,3 77.5,4 76.6,5.2 75.1,5.2 75.1,4.2 76,3" />
          <polygon points="80.5,3 80.5,4 79.6,5.2 78.1,5.2 78.1,4.2 79,3" />
          {SHADOW_ROWS.map(([y, parts]) => (
            <g key={y} transform={`${ROWS}${y})`}>
              {parts.map(([x, width]) => (
                <rect key={x} x={x} width={width} height="1" />
              ))}
            </g>
          ))}
        </g>
      </g>
      {back.map(([at, parts]) => (
        <ModuleRow key={at} at={at} parts={parts} pattern={modules} />
      ))}
      {/* The tank: its foot, its side, its top. */}
      <g transform={ROOF}>
        <circle cx="62" cy="24" r="1.25" className="fill-scene-obstacle-shade" />
      </g>
      <rect x="582.93" y="207.35" width="22.5" height="14.74" className="fill-scene-obstacle-lit" />
      <rect x="582.93" y="207.35" width="7" height="14.74" className="fill-scene-obstacle-shade" />
      <g transform="matrix(8.154 -2.187 -3.807 -4.680 180 455.26)">
        <circle cx="62" cy="24" r="1.25" className="fill-scene-roof-edge" />
      </g>
      {middle.map(([at, parts]) => (
        <ModuleRow key={at} at={at} parts={parts} pattern={modules} />
      ))}
      {/* The plant room: its lit face with the door, its shaded face, its top. */}
      <g transform="matrix(8.154 -2.187 0 -7.371 119.09 395.12)">
        <rect x="20" width="5" height="3" className="fill-scene-obstacle-lit" />
        <rect x="21.9" width="1.1" height="2.1" className="fill-scene-parapet-shade" />
      </g>
      <g transform="matrix(-3.807 -4.680 0 -7.371 343.08 426.26)">
        <rect x="16" width="4" height="3" className="fill-scene-obstacle-shade" />
      </g>
      <g transform="matrix(8.154 -2.187 -3.807 -4.680 180 447.89)">
        <rect x="20" y="16" width="5" height="4" className="fill-scene-obstacle-top" />
      </g>
      {front.map(([at, parts]) => (
        <ModuleRow key={at} at={at} parts={parts} pattern={modules} />
      ))}
      {/* The four vents: their lit faces, their shaded faces, their tops. */}
      <g transform="matrix(8.154 -2.187 0 -7.371 168.58 455.96)" className="fill-scene-obstacle-lit">
        <rect x="70" width="1.5" height="1.2" />
        <rect x="73" width="1.5" height="1.2" />
        <rect x="76" width="1.5" height="1.2" />
        <rect x="79" width="1.5" height="1.2" />
      </g>
      <g className="fill-scene-obstacle-shade">
        <g transform="matrix(-3.807 -4.680 0 -7.371 750.78 316.91)">
          <rect x="3" width="1" height="1.2" />
        </g>
        <g transform="matrix(-3.807 -4.680 0 -7.371 775.24 310.35)">
          <rect x="3" width="1" height="1.2" />
        </g>
        <g transform="matrix(-3.807 -4.680 0 -7.371 799.7 303.79)">
          <rect x="3" width="1" height="1.2" />
        </g>
        <g transform="matrix(-3.807 -4.680 0 -7.371 824.17 297.23)">
          <rect x="3" width="1" height="1.2" />
        </g>
      </g>
      <g transform="matrix(8.154 -2.187 -3.807 -4.680 180 461.15)" className="fill-scene-obstacle-top">
        <rect x="70" y="3" width="1.5" height="1" />
        <rect x="73" y="3" width="1.5" height="1" />
        <rect x="76" y="3" width="1.5" height="1" />
        <rect x="79" y="3" width="1.5" height="1" />
      </g>
      {/* The walls of the building under the roof, lit and in shade, with the parapet's outer edge over them. */}
      <g transform="matrix(8.154 -2.187 0 -7.371 180 470)">
        <rect y="-6" width="90" height="6.9" className="fill-scene-wall-lit" />
        <rect y="-6" width="90" height="0.4" className="fill-scene-wall-shade" />
      </g>
      <g transform="matrix(-3.807 -4.680 0 -7.371 180 470)">
        <rect y="-6" width="40" height="6.9" className="fill-scene-wall-shade" />
        <rect y="-6" width="40" height="0.4" className="fill-scene-ground-dark" />
      </g>
      <g transform="matrix(8.154 -2.187 -3.807 -4.680 180 463.37)" className="fill-scene-roof-edge">
        <rect width="90" height="0.2" />
        <rect width="0.2" height="40" />
      </g>
    </svg>
  );
}
