"use client";

import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { classNames } from "@/components/ui/class-names";
import { isStill, type Box } from "@/components/ui/place-floating";
import { useSize } from "@/components/ui/use-size";
import { ValueTooltip } from "@/components/ui/ValueTooltip";
import type { DesignOption } from "@/lib/api";
import { sldOf, type Ink, type SldEquipment } from "@/lib/handover/sld";
import { sldLayoutOf, type Look, type SldBlock } from "@/lib/handover/sld-layout";

type Props = {
  option: DesignOption;
  equipment: SldEquipment;
  /** The run is of before, and a new one is on its way: the drawing stays, dimmed. */
  isDimmed?: boolean;
};

const CAPTION = "The PNG is the engine's drawing on A4";

// The panel of the board "Handover, previews": the title, the drawing at the width of the panel, the line under it.
const CARD = "flex flex-col gap-4 rounded-card border border-line bg-surface-1 p-4 shadow-card tablet:p-6";
const BOX = "fill-surface-2 stroke-line-strong stroke-hair rx-control";
const LINE: Record<"dc" | "ac", string> = { dc: "stroke-text-2 stroke-wire", ac: "stroke-text stroke-chart" };
/** The words of the drawing, each in its type style, in the text colours: never in a series colour (guidelines.md, "Charts"). */
const TEXT: Record<Look, string> = {
  name: "type-body-touch desktop:type-body font-semibold fill-text",
  caption: "type-body-touch desktop:type-body fill-text-2",
  "caption-s": "type-unit fill-text-2",
  value: "type-body-touch desktop:type-body font-medium fill-text",
  words: "type-body-touch desktop:type-body fill-text",
};
/** The series colours by their number, as the Strings lens's legend has them: the tokens the palette equals. */
const SERIES: Record<number, string> = { 1: "fill-series-1", 2: "fill-series-2", 3: "fill-series-3", 4: "fill-series-4", 5: "fill-series-5", 6: "fill-series-6" };
const INK: Record<Ink, string> = { dark: "fill-series-ink", light: "fill-series-ink-light" };
/** A block is a target: its words in the middle, lifted under the pointer or with the focus, the ring of every control. */
const BLOCK = "cursor-default outline-none focus-ring rounded-control";

const keyOf = (block: SldBlock) => `${block.inverter}-${block.mppt.number}`;

/**
 * The single-line diagram of the chosen option (the board "Handover, previews"; plan/phase-09-plan.md, step 14, decision
 * 6): an SVG of the engine's drawing (sld-layout.ts) in the Dusk palette, the blocks in the series colours of their MPPTs,
 * scaled to the width of the panel; under the phone's width the AC side runs down. A block under the pointer, the finger
 * or the keyboard focus lifts and shows its strings and its load in a tooltip at its right; a list for screen readers says
 * every block. The PNG is the engine's own drawing, held equal to this by the counts and the words.
 */
export function SingleLineDiagram({ option, equipment, isDimmed = false }: Props) {
  const sld = useMemo(() => sldOf(option, equipment), [option, equipment]);
  const frame = useRef<HTMLDivElement>(null);
  const size = useSize(frame);
  const layout = useMemo(() => (size === null ? null : sldLayoutOf(sld, size.width)), [sld, size]);
  const rects = useRef(new Map<string, SVGRectElement>());
  const [active, setActive] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<Box | null>(null);
  // What the pointer was, and whether its block was shown already, at the press: a tap on a shown block takes it away.
  const press = useRef<{ pointerType: string; wasShown: boolean }>({ pointerType: "", wasShown: false });

  const leave = useCallback(() => {
    setActive(null);
    setAnchor(null);
  }, []);

  /** The page moved somewhere: the tooltip goes only if its block is no longer where it was measured. */
  const leaveIfMoved = useCallback(() => {
    const rect = active === null ? null : rects.current.get(active);
    if (rect && anchor && isStill(anchor, rect.getBoundingClientRect())) return;
    leave();
  }, [active, anchor, leave]);

  function show(key: string) {
    const rect = rects.current.get(key);
    if (!rect) return;
    const { left, top, width, height } = rect.getBoundingClientRect();
    setActive(key);
    setAnchor({ left, top, width, height });
  }

  // The pointer that can hover shows a block as it passes; a finger shows it with a tap, and takes it away with another.
  function onPointerEnter(event: PointerEvent<SVGGElement>, key: string) {
    if (event.pointerType === "mouse") show(key);
  }
  function onPointerLeave(event: PointerEvent<SVGGElement>) {
    if (event.pointerType === "mouse") leave();
  }
  function onClick(key: string) {
    if (press.current.pointerType !== "touch") return;
    if (press.current.wasShown) leave();
    else show(key);
  }
  function onKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Escape") leave();
  }

  const shown = active === null ? null : (layout?.blocks.find((block) => keyOf(block) === active)?.mppt.tooltip ?? null);

  return (
    <section data-testid="sld" aria-label={sld.title} className={classNames(CARD, isDimmed && "opacity-updating")}>
      <h3 className="type-section">{sld.title}</h3>
      <div ref={frame} className="w-full">
        {layout ? (
          <svg
            data-testid="sld-drawing"
            data-shape={layout.shape}
            role="group"
            aria-label="The diagram"
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="block overflow-visible"
          >
            <g aria-hidden="true">
              {layout.boxes.map((box) => (
                <rect key={`${box.x}-${box.y}`} x={box.x} y={box.y} width={box.w} height={box.h} className={BOX} />
              ))}
              {layout.lines.map((line) => (
                <line key={`${line.x1}-${line.y1}-${line.x2}-${line.y2}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} strokeLinecap="round" className={LINE[line.weight]} />
              ))}
              {layout.texts.map((text) => (
                <text key={`${text.x}-${text.y}-${text.words}`} x={text.x} y={text.y} textAnchor={text.anchor} dominantBaseline={text.baseline} className={TEXT[text.look]}>
                  {text.words}
                </text>
              ))}
            </g>
            {layout.blocks.map((block) => {
              const key = keyOf(block);
              return (
                <g
                  key={key}
                  role="button"
                  tabIndex={0}
                  aria-label={block.mppt.name}
                  data-testid="mppt-block"
                  data-mppt={block.mppt.number}
                  className={BLOCK}
                  onPointerDown={(event) => {
                    press.current = { pointerType: event.pointerType, wasShown: active === key };
                  }}
                  onPointerEnter={(event) => onPointerEnter(event, key)}
                  onPointerLeave={onPointerLeave}
                  onFocus={() => show(key)}
                  onBlur={leave}
                  onClick={() => onClick(key)}
                  onKeyDown={onKeyDown}
                >
                  <rect
                    ref={(element) => {
                      if (element) rects.current.set(key, element);
                      else rects.current.delete(key);
                    }}
                    x={block.x}
                    y={block.y}
                    width={block.w}
                    height={block.h}
                    className={classNames("rx-control", SERIES[block.mppt.series], active === key && "lifted")}
                  />
                  <text x={block.text.x} y={block.text.y} textAnchor="middle" dominantBaseline="middle" className={classNames("type-body-touch desktop:type-body font-medium pointer-events-none", INK[block.mppt.ink])}>
                    {block.mppt.block}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : null}
      </div>
      <p className="type-body-touch desktop:type-body text-text-2">{CAPTION}</p>
      {/* The drawing as words: every inverter with every MPPT, for those who do not see it. */}
      <ul data-testid="sld-list" aria-label="The diagram as a list" className="sr-only">
        {sld.inverters.map((inverter) => (
          <li key={inverter.label}>
            {inverter.label} · {inverter.words}
            <ul>
              {inverter.mppts.map((mppt) => (
                <li key={mppt.number}>{mppt.said}</li>
              ))}
            </ul>
          </li>
        ))}
        <li>
          {sld.ac} · {sld.acdb} · {sld.meter.label} ({sld.meter.value}) · {sld.grid}
        </li>
      </ul>
      <ValueTooltip anchor={anchor} value={shown?.value ?? ""} label={shown?.label ?? ""} onLeave={leaveIfMoved} side="right" />
    </section>
  );
}
