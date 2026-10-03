// The single-line diagram laid out in pixels (plan/phase-09-plan.md, step 14, decision 6): the engine's geometry
// (rooftop_core/plots.py, draw_sld: x from −0.5 to 18, a box per inverter 2.6 wide and max(n_mppt, 2) × 1.1 + 1.0 high at
// x 6.2, stacked 1.2 apart; a block per MPPT 2.2 by 0.6 at x 0.2, one every 1.1 from y 1.2; the AC line, the ACDB, the meter
// and the grid to the right) scaled to the frame's width, the words at their own size. Under the phone's width the AC
// side runs down from the inverter instead, so that every word keeps its size: the drawing is laid out again, not
// shrunk (the board "Handover, previews", sld_desktop and sld_phone). Pure; SingleLineDiagram draws what it gives.
import type { Sld, SldMppt } from "./sld";

/** How a word is set: the inverter's label and the ACDB (13, semibold), a caption (12, text-2), a small caption (11, text-2), a value (12, medium), words (13). */
export type Look = "name" | "caption" | "caption-s" | "value" | "words";

export type SldText = { x: number; y: number; words: string; anchor: "start" | "middle" | "end"; baseline: "auto" | "middle" | "hanging"; look: Look };
/** A wire: a DC line from a block to its inverter, or an AC line, heavier. */
export type SldLine = { x1: number; y1: number; x2: number; y2: number; weight: "dc" | "ac" };
export type SldBox = { x: number; y: number; w: number; h: number };
/** A block of an MPPT with strings: its place, the place of its words, and the MPPT it stands for. */
export type SldBlock = SldBox & { inverter: number; text: { x: number; y: number }; mppt: SldMppt };

export type SldLayout = {
  /** Across: the engine's drawing. Down: the AC side under the inverter. */
  shape: "across" | "down";
  width: number;
  height: number;
  boxes: SldBox[];
  blocks: SldBlock[];
  lines: SldLine[];
  texts: SldText[];
};

/** Under this width, in pixels, the AC side runs down: across, the inverter's words would not fit its box. */
export const DOWNWARD_UNDER = 700;

// The engine's constants, in its units.
const UNITS_ACROSS = 18.5;
const UNITS_DOWN = 9.3;
const UNITS_DOWN_WITH_A_BUS = 10;
const TOP = -0.2;
const BOX_X = 6.2;
const BOX_W = 2.6;
const BOX_MIDDLE = 7.5;
const BOX_RIGHT = BOX_X + BOX_W;
const BETWEEN_INVERTERS = 1.2;
const BLOCK_X = 0.2;
const BLOCK_W = 2.2;
const BLOCK_H = 0.6;
const FIRST_MPPT_Y = 1.2;
const BETWEEN_MPPTS = 1.1;
const LINE_WORDS_X = 4.3;
const BUS_X = 9.2;

// Where the words stand off their line, in pixels, as the board sets them.
const OVER_A_LINE = 7;
const OVER_A_LINE_S = 6;
const HALF_A_LINE_OF_WORDS = 9;
const BESIDE_A_LINE = 8;

// The AC chain running down, in pixels.
const DROP_TO_THE_ACDB = 40;
const DROP = 36;
const ACDB_DOWN = { w: 92, h: 36 };
const METER_DOWN = { w: 60, h: 36 };
const UNDER_THE_GRID = 30;
const GRID_UNDER_ITS_LINE = 10;

const heightOfInverter = (nMppt: number) => Math.max(nMppt, 2) * BETWEEN_MPPTS + 1.0;

/** A pixel measure to a hundredth, so that the engine's units scaled leave no noise of floating point behind. */
const px = (value: number) => Math.round(value * 100) / 100;

type Drawing = { boxes: SldBox[]; blocks: SldBlock[]; lines: SldLine[]; texts: SldText[] };

const text = (x: number, y: number, words: string, look: Look, anchor: SldText["anchor"] = "middle", baseline: SldText["baseline"] = "middle"): SldText => ({ x: px(x), y: px(y), words, anchor, baseline, look });
const line = (x1: number, y1: number, x2: number, y2: number, weight: SldLine["weight"]): SldLine => ({ x1: px(x1), y1: px(y1), x2: px(x2), y2: px(y2), weight });
const box = (x: number, y: number, w: number, h: number): SldBox => ({ x: px(x), y: px(y), w: px(w), h: px(h) });

/** The DC side, the same in both shapes: the inverters' boxes with the blocks and lines of their MPPTs. */
function dcSide(sld: Sld, s: number, X: (x: number) => number, Y: (y: number) => number, isDown: boolean): Drawing & { middles: number[]; hInv: number } {
  const drawing: Drawing = { boxes: [], blocks: [], lines: [], texts: [] };
  const nMppt = sld.inverters[0]?.mppts.length ?? 0;
  const hInv = heightOfInverter(nMppt);
  const caption: Look = isDown ? "caption-s" : "caption";
  const over = isDown ? OVER_A_LINE_S : OVER_A_LINE;
  const middles: number[] = [];

  sld.inverters.forEach((inverter, i) => {
    const y0 = i * (hInv + BETWEEN_INVERTERS);
    drawing.boxes.push(box(X(BOX_X), Y(y0), BOX_W * s, hInv * s));
    drawing.texts.push(text(X(BOX_MIDDLE), Y(y0 + 0.5), inverter.label, "name"));
    if (isDown) {
      const [power, mppts] = inverter.words.split(" · ");
      drawing.texts.push(text(X(BOX_MIDDLE), Y(y0 + 0.95), power!, caption), text(X(BOX_MIDDLE), Y(y0 + 1.3), mppts!, caption));
    } else {
      drawing.texts.push(text(X(BOX_MIDDLE), Y(y0 + 0.95), inverter.words, caption));
    }
    inverter.mppts.forEach((mppt, j) => {
      const yj = y0 + FIRST_MPPT_Y + j * BETWEEN_MPPTS;
      if (mppt.block === null) {
        drawing.texts.push(text(X(LINE_WORDS_X), Y(yj), mppt.line, caption));
        return;
      }
      drawing.blocks.push({ inverter: i, ...box(X(BLOCK_X), Y(yj - BLOCK_H / 2), BLOCK_W * s, BLOCK_H * s), text: { x: px(X(BLOCK_X + BLOCK_W / 2)), y: px(Y(yj)) }, mppt });
      drawing.lines.push(line(X(BLOCK_X + BLOCK_W), Y(yj), X(BOX_X), Y(yj), "dc"));
      drawing.texts.push(text(X(LINE_WORDS_X), Y(yj) - over, mppt.line, caption, "middle", "auto"));
    });
    middles.push(y0 + hInv / 2);
  });
  return { ...drawing, middles, hInv };
}

/** The engine's drawing: the AC side to the right of the inverters, the ACDB spanning their AC lines. */
function across(sld: Sld, width: number): SldLayout {
  const s = width / UNITS_ACROSS;
  const X = (x: number) => (x + 0.5) * s;
  const Y = (y: number) => (y - TOP) * s;
  const { middles, hInv, ...drawing } = dcSide(sld, s, X, Y, false);

  middles.forEach((ym) => {
    drawing.lines.push(line(X(BOX_RIGHT), Y(ym), X(10.6), Y(ym), "ac"));
    drawing.texts.push(text(X(9.7), Y(ym) - OVER_A_LINE, sld.ac, "caption", "middle", "auto"));
  });
  const [top, bottom] = [Math.min(...middles) - 0.6, Math.max(...middles) + 0.6];
  drawing.boxes.push(box(X(10.6), Y(top), 1.4 * s, (bottom - top) * s));
  drawing.texts.push(text(X(11.3), Y(top) - OVER_A_LINE, sld.acdb, "name", "middle", "auto"));
  const ym = (top + bottom) / 2;
  drawing.lines.push(line(X(12.0), Y(ym), X(13.4), Y(ym), "ac"));
  drawing.boxes.push(box(X(13.4), Y(ym - 0.45), 1.1 * s, 0.9 * s));
  drawing.texts.push(text(X(13.95), Y(ym), sld.meter.value, "value"), text(X(13.95), Y(ym + 0.75), sld.meter.label, "caption", "middle", "hanging"));
  drawing.lines.push(line(X(14.5), Y(ym), X(16.0), Y(ym), "ac"));
  const [grid, panel] = sld.grid.split(" / ");
  drawing.texts.push(text(X(16.1), Y(ym) - HALF_A_LINE_OF_WORDS, `${grid} /`, "words", "start"), text(X(16.1), Y(ym) + HALF_A_LINE_OF_WORDS, panel!, "words", "start"));

  const inverters = sld.inverters.length;
  return { shape: "across", width, height: px(((inverters - 1) * (hInv + BETWEEN_INVERTERS) + hInv + 0.6 - TOP) * s), ...drawing };
}

/** The AC side under the inverters: one inverter hangs its chain from its bottom; several feed a bus at their right, which comes back to the chain. */
function down(sld: Sld, width: number): SldLayout {
  const inverters = sld.inverters.length;
  const s = width / (inverters > 1 ? UNITS_DOWN_WITH_A_BUS : UNITS_DOWN);
  const X = (x: number) => (x + 0.5) * s;
  const Y = (y: number) => (y - TOP) * s;
  const { middles, hInv, ...drawing } = dcSide(sld, s, X, Y, true);
  const xm = px(X(BOX_MIDDLE));
  const bottomOfTheLast = px(Y((inverters - 1) * (hInv + BETWEEN_INVERTERS) + hInv));
  let y = bottomOfTheLast;

  if (inverters === 1) {
    drawing.lines.push(line(xm, y, xm, y + DROP_TO_THE_ACDB, "ac"));
    drawing.texts.push(text(xm + BESIDE_A_LINE, y + DROP_TO_THE_ACDB / 2, sld.ac, "caption-s", "start"));
    y += DROP_TO_THE_ACDB;
  } else {
    const bus = X(BUS_X);
    middles.forEach((ym) => {
      drawing.lines.push(line(X(BOX_RIGHT), Y(ym), bus, Y(ym), "ac"));
      drawing.texts.push(text((X(BOX_RIGHT) + bus) / 2, Y(ym) - OVER_A_LINE_S, sld.ac, "caption-s", "middle", "auto"));
    });
    y += DROP_TO_THE_ACDB;
    drawing.lines.push(line(bus, Y(middles[0]!), bus, y, "ac"), line(bus, y, xm, y, "ac"));
  }

  drawing.boxes.push(box(xm - ACDB_DOWN.w / 2, y, ACDB_DOWN.w, ACDB_DOWN.h));
  drawing.texts.push(text(xm, y + ACDB_DOWN.h / 2, sld.acdb, "name"));
  y += ACDB_DOWN.h;
  drawing.lines.push(line(xm, y, xm, y + DROP, "ac"));
  y += DROP;
  drawing.boxes.push(box(xm - METER_DOWN.w / 2, y, METER_DOWN.w, METER_DOWN.h));
  drawing.texts.push(text(xm, y + METER_DOWN.h / 2, sld.meter.value, "value"), text(xm - METER_DOWN.w / 2 - BESIDE_A_LINE, y + METER_DOWN.h / 2, sld.meter.label, "caption-s", "end"));
  y += METER_DOWN.h;
  drawing.lines.push(line(xm, y, xm, y + DROP, "ac"));
  y += DROP;
  drawing.texts.push(text(xm, y + GRID_UNDER_ITS_LINE, sld.grid, "words", "middle", "hanging"));

  return { shape: "down", width, height: px(y + UNDER_THE_GRID), ...drawing };
}

/** The diagram laid out for a frame *width* pixels wide. */
export function sldLayoutOf(sld: Sld, width: number): SldLayout {
  return width < DOWNWARD_UNDER ? down(sld, width) : across(sld, width);
}
