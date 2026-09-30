"use client";

import type { FeatureCollection, Geometry } from "geojson";
import { Marker, type Map as MapLibre, type MapMouseEvent, type MapTouchEvent } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { classNames } from "@/components/ui/class-names";
import { shown } from "@/components/ui/number-entry";
import { metresPerPixel } from "@/lib/map/scale-bar";
import { frameAt, toLonLat, toMetres, type Frame, type LonLat } from "@/lib/outline/frame";
import { centroidOf, midpointsOf, type XY } from "@/lib/outline/measure";
import { turnedAbout } from "@/lib/outline/rectangle";
import type { OutlineEvent, OutlineState } from "@/lib/outline/outline-state";

export type Tool = "corners" | "rectangle" | "detect";

export type OutlineProps = {
  state: OutlineState;
  /** The tool in hand; null while there is none, before a roof is found. */
  tool: Tool | null;
  on: (event: OutlineEvent) => void;
};

type Props = OutlineProps & { map: MapLibre };

const SOURCE = "outline";
const FILL = "outline-fill";
const LINE = "outline-line";

// The handle of a corner: 18 (22 on touch) inside a target of 44, white with an accent line.
const TARGET = "flex size-touch cursor-grab items-center justify-center rounded-full focus-ring";
const CORNER = classNames(
  "block size-5.5 rounded-full border-corner-touch border-accent bg-handle-fill shadow-handle",
  "desktop:size-4.5 desktop:border-corner",
);
const CORNER_EDITED = "pulsing-corner";
// The ring of a midpoint is as wide as the line of the outline.
const MIDPOINT = "block size-2.5 rounded-full border-outline border-accent-ink bg-accent";
const LABEL = "block rounded-seg bg-ground px-2.25 py-0.75 type-value-small font-medium text-text shadow-tooltip select-none";
// The handle that turns a box: a round button above its top edge, this many pixels up.
const TURN = classNames(
  "flex size-touch cursor-grab items-center justify-center rounded-full border border-accent bg-surface-1 text-accent shadow-float",
  "focus-ring",
);
const TURN_HANDLE_UP_PX = 44;
const TURN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="18" height="18"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v4.5h-4.5"/></svg>';

const isCoarse = () => window.matchMedia("(pointer: coarse)").matches;

// The loupe of a touch drag: 104 px, twice the imagery, a cross at the corner, above the finger.
const LOUPE = "relative block size-26 overflow-hidden rounded-full border-outline border-accent bg-ground shadow-float";
const LOUPE_CROSS = "absolute bg-accent opacity-updating";
const LOUPE_PX = 104;
const LOUPE_TIMES = 2;
const LOUPE_ABOVE_PX = 92;

/** A token of the container's stylesheet, for what MapLibre paints itself. */
function tokenOf(map: MapLibre, name: string): string {
  return getComputedStyle(map.getContainer()).getPropertyValue(name).trim();
}

function geoJsonOf(frame: Frame | null, corners: readonly XY[], closed: boolean, stem: [XY, XY] | null): FeatureCollection {
  if (!frame || corners.length < 2) return { type: "FeatureCollection", features: [] };
  const ring = corners.map((corner) => {
    const { lon, lat } = toLonLat(frame, corner);
    return [lon, lat];
  });
  const geometry: Geometry =
    closed && corners.length >= 3 ? { type: "Polygon", coordinates: [[...ring, ring[0]]] } : { type: "LineString", coordinates: ring };
  const features: FeatureCollection["features"] = [{ type: "Feature", geometry, properties: {} }];
  if (stem) features.push({ type: "Feature", geometry: { type: "LineString", coordinates: stem.map((point) => lonLatOf(frame, point)) }, properties: {} });
  return { type: "FeatureCollection", features };
}

/** Where the handle that turns a box stands: above the middle of its top edge, turned with it. */
function turnHandleOf(state: OutlineState, metresPerPx: number): { handle: XY; stem: [XY, XY] } | null {
  if (!state.rectangle || !state.closed) return null;
  const { base, turn } = state.rectangle;
  const centre = centroidOf(base);
  const top = Math.max(...base.map((corner) => corner.y));
  const [mid, handle] = turnedAbout([{ x: centre.x, y: top }, { x: centre.x, y: top + TURN_HANDLE_UP_PX * metresPerPx }], centre, turn);
  return { handle, stem: [mid, handle] };
}

function lonLatOf(frame: Frame, point: XY): [number, number] {
  const { lon, lat } = toLonLat(frame, point);
  return [lon, lat];
}

/**
 * What the outline draws on the map: the fill and the line (MapLibre layers, painted in the tokens),
 * the handles of the corners and the midpoints, the labels of the edges (markers), and what a press on
 * the map does. Every rule of drawing is in the reducer; this only draws and reports.
 */
export function OutlineLayer({ map, state, tool, on }: Props) {
  const corners = useRef<Marker[]>([]);
  const midpoints = useRef<Marker[]>([]);
  const labels = useRef<Marker[]>([]);
  const turn = useRef<Marker | null>(null);
  const isDragging = useRef(false);
  const latest = useRef({ state, tool, on });
  useEffect(() => {
    latest.current = { state, tool, on };
  });

  // The layers, once.
  useEffect(() => {
    map.addSource(SOURCE, { type: "geojson", data: geoJsonOf(null, [], false, null) });
    map.addLayer({ id: FILL, type: "fill", source: SOURCE, filter: ["==", "$type", "Polygon"], paint: { "fill-color": tokenOf(map, "--color-outline-fill") } });
    map.addLayer({
      id: LINE,
      type: "line",
      source: SOURCE,
      paint: { "line-color": tokenOf(map, "--color-accent"), "line-width": parseFloat(tokenOf(map, "--border-outline")) },
    });
    return () => {
      if (map.getLayer(LINE)) map.removeLayer(LINE);
      if (map.getLayer(FILL)) map.removeLayer(FILL);
      if (map.getSource(SOURCE)) map.removeSource(SOURCE);
    };
  }, [map]);

  // The fill and the line follow the corners; the stem of the turn handle too.
  useEffect(() => {
    const source = map.getSource(SOURCE);
    const stem = turnHandleOf(state, metresPerPixel(map.getCenter().lat, map.getZoom()))?.stem ?? null;
    if (source && "setData" in source) (source as { setData: (data: FeatureCollection) => void }).setData(geoJsonOf(state.frame, state.corners, state.closed, stem));
  }, [map, state]);

  // A press on the map places a corner; the first press begins the frame where it is.
  useEffect(() => {
    function onClick(event: MapMouseEvent) {
      const { state: now, tool: inHand, on: tell } = latest.current;
      if (inHand !== "corners" || now.closed) return;
      const at: LonLat = { lon: event.lngLat.lng, lat: event.lngLat.lat };
      const frame = now.frame ?? frameAt(at);
      if (!now.frame) tell({ type: "began", at });
      tell({ type: "placed", at: toMetres(frame, at), metresPerPx: metresPerPixel(map.getCenter().lat, map.getZoom()), touch: isCoarse() });
    }
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [map]);

  // A drag with the rectangle tool draws a box, while there is none; once there is one the map pans again.
  useEffect(() => {
    if (tool !== "rectangle") return;
    let from: { at: LonLat; frame: Frame } | null = null;
    function lonLatOfEvent(event: MapMouseEvent | MapTouchEvent): LonLat {
      return { lon: event.lngLat.lng, lat: event.lngLat.lat };
    }
    function onDown(event: MapMouseEvent | MapTouchEvent) {
      const { state: now, on: tell } = latest.current;
      if (now.corners.length > 0) return;
      if ("originalEvent" in event && event.originalEvent instanceof MouseEvent && event.originalEvent.button !== 0) return;
      const at = lonLatOfEvent(event);
      const frame = now.frame ?? frameAt(at);
      if (!now.frame) tell({ type: "began", at });
      from = { at, frame };
      event.preventDefault();
    }
    function onMove(event: MapMouseEvent | MapTouchEvent) {
      if (!from) return;
      event.preventDefault();
      latest.current.on({ type: "boxDragged", from: toMetres(from.frame, from.at), to: toMetres(from.frame, lonLatOfEvent(event)) });
    }
    function onUp() {
      if (!from) return;
      from = null;
      latest.current.on({ type: "boxDropped" });
    }
    map.on("mousedown", onDown);
    map.on("mousemove", onMove);
    map.on("mouseup", onUp);
    map.on("touchstart", onDown);
    map.on("touchmove", onMove);
    map.on("touchend", onUp);
    return () => {
      map.off("mousedown", onDown);
      map.off("mousemove", onMove);
      map.off("mouseup", onUp);
      map.off("touchstart", onDown);
      map.off("touchmove", onMove);
      map.off("touchend", onUp);
    };
  }, [map, tool]);

  // While a box can be drawn, a drag is the box's, not the map's.
  useEffect(() => {
    const draws = tool === "rectangle" && state.corners.length === 0;
    if (draws) map.dragPan.disable();
    else map.dragPan.enable();
  }, [map, tool, state.corners.length]);

  // The cursor says what a press does.
  useEffect(() => {
    const draws = (tool === "corners" && !state.closed) || (tool === "rectangle" && state.corners.length === 0);
    map.getCanvas().style.cursor = draws ? "crosshair" : "";
  }, [map, tool, state.closed, state.corners.length]);

  // The handles and the labels: made anew when their number changes, moved otherwise; left alone
  // while one is dragged, because the drag is theirs.
  useEffect(() => {
    if (isDragging.current) return;
    const { frame } = state;
    const remove = (markers: Marker[]) => markers.splice(0).forEach((marker) => marker.remove());
    if (!frame) {
      remove(corners.current);
      remove(midpoints.current);
      remove(labels.current);
      turn.current?.remove();
      turn.current = null;
      return;
    }
    const drawnEdges = state.closed ? state.corners.length : Math.max(0, state.corners.length - 1);

    if (corners.current.length !== state.corners.length) {
      remove(corners.current);
      corners.current = state.corners.map((_, index) => cornerMarker(map, index, latest, isDragging));
    }
    state.corners.forEach((corner, index) => {
      const marker = corners.current[index];
      marker.setLngLat(lonLatOf(frame, corner));
      const dot = marker.getElement().firstElementChild;
      dot?.classList.toggle(CORNER_EDITED, state.selected === index);
      marker.getElement().setAttribute("aria-label", `Corner ${index + 1}${state.selected === index ? ", selected" : ""}`);
    });

    if (midpoints.current.length !== drawnEdges) {
      remove(midpoints.current);
      midpoints.current = Array.from({ length: drawnEdges }, (_, edge) => midpointMarker(map, edge, latest, isDragging));
      remove(labels.current);
      labels.current = Array.from({ length: drawnEdges }, () => labelMarker(map));
    }
    const middles = midpointsOf(state.corners).slice(0, drawnEdges);
    const lengths = state.corners.map((corner, index) => {
      const next = state.corners[(index + 1) % state.corners.length];
      return Math.hypot(next.x - corner.x, next.y - corner.y);
    });
    middles.forEach((middle, edge) => {
      midpoints.current[edge].setLngLat(lonLatOf(frame, middle));
      labels.current[edge].setLngLat(lonLatOf(frame, middle));
      labels.current[edge].getElement().textContent = `${shown(lengths[edge], 1)} m`;
    });

    const turning = turnHandleOf(state, metresPerPixel(map.getCenter().lat, map.getZoom()));
    if (!turning) {
      turn.current?.remove();
      turn.current = null;
    } else {
      turn.current ??= turnMarker(map, latest, isDragging);
      turn.current.setLngLat(lonLatOf(frame, turning.handle));
    }
  }, [map, state]);

  useEffect(
    () => () => {
      [corners, midpoints, labels].forEach((markers) => markers.current.splice(0).forEach((marker) => marker.remove()));
      turn.current?.remove();
    },
    [],
  );

  return null;
}

type Latest = React.RefObject<OutlineProps>;

function metresOf(marker: Marker, frame: Frame): XY {
  const { lng, lat } = marker.getLngLat();
  return toMetres(frame, { lon: lng, lat });
}

/** The loupe over a corner dragged by a finger: a canvas that shows the map around the corner, twice as large. */
function loupeMarker(map: MapLibre): Marker {
  const element = document.createElement("span");
  element.className = LOUPE;
  element.dataset.testid = "loupe";
  element.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  canvas.width = LOUPE_PX * window.devicePixelRatio;
  canvas.height = LOUPE_PX * window.devicePixelRatio;
  canvas.className = "block size-full";
  element.appendChild(canvas);
  const across = document.createElement("span");
  across.className = classNames(LOUPE_CROSS, "top-1/2 left-0 h-px w-full");
  const down = document.createElement("span");
  down.className = classNames(LOUPE_CROSS, "top-0 left-1/2 h-full w-px");
  element.append(across, down);
  return new Marker({ element, offset: [0, -LOUPE_ABOVE_PX] }).setLngLat([0, 0]).addTo(map);
}

function drawLoupe(map: MapLibre, loupe: Marker, at: { lng: number; lat: number }): void {
  const canvas = loupe.getElement().querySelector("canvas");
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;
  const ratio = map.getPixelRatio();
  const point = map.project(at);
  const side = (LOUPE_PX / LOUPE_TIMES) * ratio;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(map.getCanvas(), point.x * ratio - side / 2, point.y * ratio - side / 2, side, side, 0, 0, canvas.width, canvas.height);
}

function cornerMarker(map: MapLibre, index: number, latest: Latest, isDragging: React.RefObject<boolean>): Marker {
  const element = document.createElement("button");
  element.type = "button";
  element.className = TARGET;
  element.dataset.testid = "corner";
  element.setAttribute("aria-label", `Corner ${index + 1}`);
  const dot = document.createElement("span");
  dot.className = CORNER;
  element.appendChild(dot);
  element.addEventListener("click", (event) => {
    event.stopPropagation();
    const { state, on } = latest.current;
    if (index === 0 && !state.closed && state.corners.length >= 3) on({ type: "close" });
    else on({ type: "selected", index });
  });
  const marker = new Marker({ element, draggable: true }).setLngLat([0, 0]).addTo(map);
  let loupe: Marker | null = null;
  marker.on("dragstart", () => {
    isDragging.current = true;
    latest.current.on({ type: "selected", index });
    if (isCoarse()) loupe = loupeMarker(map);
  });
  marker.on("drag", () => {
    const { state, on } = latest.current;
    if (state.frame) on({ type: "cornerMoved", index, at: metresOf(marker, state.frame) });
    if (loupe) {
      loupe.setLngLat(marker.getLngLat());
      drawLoupe(map, loupe, marker.getLngLat());
    }
  });
  marker.on("dragend", () => {
    isDragging.current = false;
    loupe?.remove();
    loupe = null;
    latest.current.on({ type: "cornerDropped" });
  });
  return marker;
}

function midpointMarker(map: MapLibre, edge: number, latest: Latest, isDragging: React.RefObject<boolean>): Marker {
  const element = document.createElement("button");
  element.type = "button";
  element.className = TARGET;
  element.dataset.testid = "midpoint";
  element.setAttribute("aria-label", `Add a corner on edge ${edge + 1}`);
  const dot = document.createElement("span");
  dot.className = MIDPOINT;
  element.appendChild(dot);
  element.addEventListener("click", (event) => {
    event.stopPropagation();
    const { state, on } = latest.current;
    if (state.frame) on({ type: "midpointTaken", edge, at: metresOf(marker, state.frame) });
  });
  const marker = new Marker({ element, draggable: true }).setLngLat([0, 0]).addTo(map);
  // A drag of a midpoint makes a corner there and drags it.
  marker.on("dragstart", () => {
    isDragging.current = true;
    const { state, on } = latest.current;
    if (state.frame) on({ type: "midpointTaken", edge, at: metresOf(marker, state.frame) });
  });
  marker.on("drag", () => {
    const { state, on } = latest.current;
    if (state.frame) on({ type: "cornerMoved", index: edge + 1, at: metresOf(marker, state.frame) });
  });
  marker.on("dragend", () => {
    isDragging.current = false;
    latest.current.on({ type: "cornerDropped" });
  });
  return marker;
}

function labelMarker(map: MapLibre): Marker {
  const element = document.createElement("code");
  element.className = LABEL;
  element.dataset.testid = "edge-label";
  // The label stands beside the midpoint handle, not on it.
  return new Marker({ element, offset: [0, 18] }).setLngLat([0, 0]).addTo(map);
}

function turnMarker(map: MapLibre, latest: Latest, isDragging: React.RefObject<boolean>): Marker {
  const element = document.createElement("button");
  element.type = "button";
  element.className = TURN;
  element.dataset.testid = "turn-handle";
  element.setAttribute("aria-label", "Turn the rectangle");
  element.innerHTML = TURN_ICON;
  element.addEventListener("click", (event) => event.stopPropagation());
  const marker = new Marker({ element, draggable: true }).setLngLat([0, 0]).addTo(map);
  marker.on("dragstart", () => {
    isDragging.current = true;
  });
  marker.on("drag", () => {
    const { state, on } = latest.current;
    if (state.frame) on({ type: "boxTurned", handle: metresOf(marker, state.frame) });
  });
  marker.on("dragend", () => {
    isDragging.current = false;
    latest.current.on({ type: "turnDropped" });
  });
  return marker;
}
