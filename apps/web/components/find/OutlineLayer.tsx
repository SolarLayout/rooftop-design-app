"use client";

import type { FeatureCollection, Geometry } from "geojson";
import { Marker, type Map as MapLibre, type MapMouseEvent, type MapTouchEvent, type MarkerOptions } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { classNames } from "@/components/ui/class-names";
import { shown } from "@/components/ui/number-entry";
import { footprintOutline, FOOTPRINTS_LAYER, FOOTPRINTS_URL, FOOTPRINTS_ZOOM } from "@/lib/map/overture";
import { metresPerPixel } from "@/lib/map/scale-bar";
import { frameAt, toLonLat, toMetres, type Frame, type LonLat } from "@/lib/outline/frame";
import { areaOf, centroidOf, midpointsOf, type XY } from "@/lib/geometry/measure";
import { foldOf, labelOf, type Obstacle, type ObstacleKind, type Shape } from "@/lib/outline/obstacles";
import { turnedAbout } from "@/lib/outline/rectangle";
import { isInside, liftLabelOf, turnHandleOf as roofTurnHandleOf, type Lift } from "@/lib/outline/roof-move";
import { isClosedAndSettled, type OutlineEvent, type OutlineState } from "@/lib/outline/outline-state";

/** The ways to outline while the roof is open; the obstacles to draw once it is closed. */
export type Tool = "corners" | "rectangle" | "detect" | "box" | "tank" | "wall" | "building";

/** The kind of obstacle a tool draws; null for a tool of the outline. */
export function kindOfTool(tool: Tool | null): ObstacleKind | null {
  switch (tool) {
    case "box":
      return "box";
    case "tank":
      return "cylinder";
    case "wall":
      return "wall";
    case "building":
      return "building";
    default:
      return null;
  }
}

/** What a press with Detect building found, and where on the screen it was. */
export type Detected = { at: { x: number; y: number } } & ({ found: true; corners: number; area: number } | { found: false });

export type OutlineProps = {
  state: OutlineState;
  /** The tool in hand; null while there is none, before a roof is found. */
  tool: Tool | null;
  on: (event: OutlineEvent) => void;
  onDetected?: (detected: Detected) => void;
};

type Props = OutlineProps & { map: MapLibre };

const SOURCE = "outline";
const FILL = "outline-fill";
const LINE = "outline-line";
// The roof picked up glows under its line; where it stood stays dashed while it is moved or turned.
const GLOW = "outline-glow";
const GHOST = "outline-ghost";
const FOOTPRINTS = "footprints";
const FOOTPRINTS_FILL = "footprints-fill";
const FOOTPRINTS_LINE = "footprints-line";
const OBSTACLES = "obstacles";
const OBSTACLES_FILL = "obstacles-fill";
const OBSTACLES_LINE = "obstacles-line";
// A round tank is drawn as a polygon of this many sides.
const TANK_SIDES = 36;
// The dashes of a footprint's line, in widths of the line.
const FOOTPRINT_DASHES = [3, 2];
// The dashes of where the roof stood: 6 px on, 5 off, for a line of 2.
const GHOST_DASHES = [3, 2.5];
// A press that moves less than this many pixels is a click, not a drag (MapLibre's own tolerance is 3).
const DRAG_FROM_PX = 4;

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
// The label of a turn stands this far right of the handle's middle, clear of its target of 44.
const TURN_LABEL_ASIDE_PX = 30;
// The handle that turns the roof picked up: 32 round (44 on touch) inside a target of 44, its ring thicker while held.
const ROOF_TURN_TARGET = "flex size-touch cursor-grab items-center justify-center rounded-full focus-ring";
const ROOF_TURN = "flex size-touch items-center justify-center rounded-full border border-accent bg-surface-1 text-accent shadow-float desktop:size-8";
const ROOF_TURN_HELD = "border-outline";
const TURN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="18" height="18"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v4.5h-4.5"/></svg>';

const isCoarse = () => window.matchMedia("(pointer: coarse)").matches;

// The loupe of a touch drag: 104 px, twice the imagery, a cross at the corner, above the finger.
const LOUPE = "relative block size-26 overflow-hidden rounded-full border-outline border-accent bg-ground shadow-float";
const LOUPE_CROSS = "absolute bg-accent opacity-updating";
const LOUPE_PX = 104;
const LOUPE_TIMES = 2;
const LOUPE_ABOVE_PX = 92;

/** Whether a press began on the map itself, not on a handle over it: a handle's drag is the handle's. */
function onTheCanvas(map: MapLibre, event: MapMouseEvent | MapTouchEvent): boolean {
  return event.originalEvent.target === map.getCanvas();
}

/** The fingers on the screen in a touch event; a mouse is one. */
function fingersOf(event: MapMouseEvent | MapTouchEvent): number {
  return "touches" in event.originalEvent ? event.originalEvent.touches.length : 1;
}

/** A token of the container's stylesheet, for what MapLibre paints itself. */
function tokenOf(map: MapLibre, name: string): string {
  return getComputedStyle(map.getContainer()).getPropertyValue(name).trim();
}

type Drawing = { corners: readonly XY[]; closed: boolean; picked: boolean; stem: [XY, XY] | null; ghost: readonly XY[] | null };

/** The roof, the stem of a turn handle, and where the roof stood while it is lifted: each a feature with its role. */
function geoJsonOf(frame: Frame | null, { corners, closed, picked, stem, ghost }: Drawing): FeatureCollection {
  if (!frame || corners.length < 2) return { type: "FeatureCollection", features: [] };
  const ring = corners.map((corner) => lonLatOf(frame, corner));
  const geometry: Geometry =
    closed && corners.length >= 3 ? { type: "Polygon", coordinates: [[...ring, ring[0]]] } : { type: "LineString", coordinates: ring };
  const features: FeatureCollection["features"] = [{ type: "Feature", geometry, properties: { role: "roof", picked } }];
  if (stem) features.push({ type: "Feature", geometry: { type: "LineString", coordinates: stem.map((point) => lonLatOf(frame, point)) }, properties: { role: "stem", picked: false } });
  if (ghost) {
    const was = ghost.map((point) => lonLatOf(frame, point));
    features.push({ type: "Feature", geometry: { type: "LineString", coordinates: [...was, was[0]] }, properties: { role: "ghost", picked: false } });
  }
  return { type: "FeatureCollection", features };
}

/** What the outline draws of the state: the picked roof's stem and ghost besides the box's stem. */
function drawingOf(state: OutlineState, metresPerPx: number): Drawing {
  const stem = state.picked ? roofHandleOf(state, metresPerPx)?.stem ?? null : (turnHandleOf(state, metresPerPx)?.stem ?? null);
  return { corners: state.corners, closed: state.closed, picked: state.picked, stem, ghost: state.lift ? state.history.present.corners : null };
}

/** Where the handle that turns the picked roof stands: off the middle of its north edge. */
function roofHandleOf(state: OutlineState, metresPerPx: number): { handle: XY; stem: [XY, XY] } | null {
  if (!state.picked || state.corners.length < 3) return null;
  const { foot, handle } = roofTurnHandleOf(state.history.present.corners, state.corners, metresPerPx);
  return { handle, stem: [foot, handle] };
}

/** Where the handle that turns a box stands: above the middle of its top edge, turned with it. */
function turnHandleOf(state: OutlineState, metresPerPx: number): { handle: XY; stem: [XY, XY] } | null {
  if (!state.rectangle || !state.closed || state.picked) return null;
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

/** The outline of a shape as points: a tank as a polygon of many sides. */
function ringOf(shape: Shape): XY[] {
  if (shape.kind !== "cylinder") return [...shape.points];
  const [centre] = shape.points;
  const radius = (shape.diameter ?? 0) / 2;
  return Array.from({ length: TANK_SIDES }, (_, n) => {
    const angle = (2 * Math.PI * n) / TANK_SIDES;
    return { x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) };
  });
}

/** The obstacles, the shape being drawn and the one awaiting its height, as what the map draws. */
function obstaclesGeoJson(frame: Frame | null, obstacles: readonly Obstacle[], live: Shape | null, selected: number | null): FeatureCollection {
  if (!frame) return { type: "FeatureCollection", features: [] };
  const features: FeatureCollection["features"] = [];
  const add = (shape: Shape, properties: { id: number | null; selected: boolean; live: boolean }) => {
    const ring = ringOf(shape).map((point) => lonLatOf(frame, point));
    if (shape.kind === "wall") {
      if (ring.length >= 2) features.push({ type: "Feature", geometry: { type: "LineString", coordinates: ring }, properties });
      return;
    }
    if (ring.length >= 3) features.push({ type: "Feature", geometry: { type: "Polygon", coordinates: [[...ring, ring[0]]] }, properties });
    else if (ring.length === 2) features.push({ type: "Feature", geometry: { type: "LineString", coordinates: ring }, properties });
  };
  obstacles.forEach((obstacle) => add(obstacle, { id: obstacle.id, selected: obstacle.id === selected, live: false }));
  if (live) add(live, { id: null, selected: false, live: true });
  return { type: "FeatureCollection", features };
}

/** The handles of an obstacle: its corners, or the one at the edge of a tank. */
function handlesOf(obstacle: Obstacle): XY[] {
  if (obstacle.kind !== "cylinder") return [...obstacle.points];
  const [centre] = obstacle.points;
  return [{ x: centre.x + (obstacle.diameter ?? 0) / 2, y: centre.y }];
}

/**
 * What the outline draws on the map: the fill and the line (MapLibre layers, painted in the tokens),
 * the handles of the corners and the midpoints, the labels of the edges (markers), and what a press on
 * the map does. Every rule of drawing is in the reducer; this only draws and reports.
 */
export function OutlineLayer({ map, state, tool, on, onDetected }: Props) {
  const corners = useRef<Marker[]>([]);
  const midpoints = useRef<Marker[]>([]);
  const labels = useRef<Marker[]>([]);
  const turn = useRef<Marker | null>(null);
  const roofTurn = useRef<Marker | null>(null);
  const liftLabel = useRef<Marker | null>(null);
  // While the roof's handle is held it follows the pointer; the rest of the outline follows the state.
  const isTurningRoof = useRef(false);
  const obstacleLabels = useRef<Marker[]>([]);
  const obstacleHandles = useRef<Marker[]>([]);
  const liveHandles = useRef<Marker[]>([]);
  const isDragging = useRef(false);
  const latest = useRef({ state, tool, on, onDetected });
  useEffect(() => {
    latest.current = { state, tool, on, onDetected };
  });

  // The layers, once.
  useEffect(() => {
    map.addSource(SOURCE, { type: "geojson", data: geoJsonOf(null, { corners: [], closed: false, picked: false, stem: null, ghost: null }) });
    const isPicked: ["==", ["get", string], boolean] = ["==", ["get", "picked"], true];
    map.addLayer({
      id: FILL,
      type: "fill",
      source: SOURCE,
      filter: ["==", "$type", "Polygon"],
      paint: { "fill-color": ["case", isPicked, tokenOf(map, "--color-outline-fill-picked"), tokenOf(map, "--color-outline-fill")] },
    });
    map.addLayer({
      id: GLOW,
      type: "line",
      source: SOURCE,
      filter: isPicked,
      paint: { "line-color": tokenOf(map, "--color-accent"), "line-width": parseFloat(tokenOf(map, "--border-outline-glow")), "line-opacity": parseFloat(tokenOf(map, "--opacity-outline-glow")) },
    });
    map.addLayer({
      id: GHOST,
      type: "line",
      source: SOURCE,
      filter: ["==", ["get", "role"], "ghost"],
      paint: {
        "line-color": tokenOf(map, "--color-accent"),
        "line-width": parseFloat(tokenOf(map, "--border-outline")),
        "line-opacity": parseFloat(tokenOf(map, "--opacity-ghost")),
        "line-dasharray": GHOST_DASHES,
      },
    });
    map.addLayer({
      id: LINE,
      type: "line",
      source: SOURCE,
      filter: ["!=", ["get", "role"], "ghost"],
      paint: {
        "line-color": tokenOf(map, "--color-accent"),
        "line-width": ["case", isPicked, parseFloat(tokenOf(map, "--border-outline-picked")), parseFloat(tokenOf(map, "--border-outline"))],
      },
    });
    // The obstacles: light over dark, the selected one and the one being drawn in the accent.
    const accent = tokenOf(map, "--color-accent");
    map.addSource(OBSTACLES, { type: "geojson", data: obstaclesGeoJson(null, [], null, null) });
    map.addLayer({
      id: OBSTACLES_FILL,
      type: "fill",
      source: OBSTACLES,
      filter: ["==", "$type", "Polygon"],
      paint: { "fill-color": ["case", ["get", "live"], tokenOf(map, "--color-outline-fill"), tokenOf(map, "--color-obstacle-fill")] },
    });
    map.addLayer({
      id: OBSTACLES_LINE,
      type: "line",
      source: OBSTACLES,
      paint: {
        "line-color": ["case", ["any", ["get", "selected"], ["get", "live"]], accent, tokenOf(map, "--color-obstacle-line")],
        "line-width": parseFloat(tokenOf(map, "--border-outline")),
      },
    });
    return () => {
      [OBSTACLES_LINE, OBSTACLES_FILL, LINE, GHOST, GLOW, FILL].forEach((layer) => map.getLayer(layer) && map.removeLayer(layer));
      [OBSTACLES, SOURCE].forEach((source) => map.getSource(source) && map.removeSource(source));
    };
  }, [map]);

  // The obstacles follow the state; so do the shape being drawn and the one awaiting its height.
  useEffect(() => {
    const source = map.getSource(OBSTACLES);
    if (source && "setData" in source) {
      (source as { setData: (data: FeatureCollection) => void }).setData(obstaclesGeoJson(state.frame, state.obstacles, state.drawing ?? state.pending, state.selectedObstacle));
    }
  }, [map, state]);

  // The fill and the line follow the corners; the stem of the turn handle and where the roof stood too.
  useEffect(() => {
    const source = map.getSource(SOURCE);
    const drawing = drawingOf(state, metresPerPixel(map.getCenter().lat, map.getZoom()));
    if (source && "setData" in source) (source as { setData: (data: FeatureCollection) => void }).setData(geoJsonOf(state.frame, drawing));
  }, [map, state]);

  // While Detect building is the tool, the footprints that are known show faintly.
  useEffect(() => {
    if (tool !== "detect") return;
    map.addSource(FOOTPRINTS, { type: "vector", url: `pmtiles://${FOOTPRINTS_URL}`, minzoom: FOOTPRINTS_ZOOM, maxzoom: FOOTPRINTS_ZOOM });
    const accent = tokenOf(map, "--color-accent");
    const opacity = parseFloat(tokenOf(map, "--opacity-hint"));
    map.addLayer(
      { id: FOOTPRINTS_FILL, type: "fill", source: FOOTPRINTS, "source-layer": FOOTPRINTS_LAYER, paint: { "fill-color": accent, "fill-opacity": opacity / 2 } },
      FILL,
    );
    map.addLayer(
      {
        id: FOOTPRINTS_LINE,
        type: "line",
        source: FOOTPRINTS,
        "source-layer": FOOTPRINTS_LAYER,
        paint: { "line-color": accent, "line-opacity": opacity, "line-width": parseFloat(tokenOf(map, "--border-dot")), "line-dasharray": FOOTPRINT_DASHES },
      },
      FILL,
    );
    return () => {
      if (map.getLayer(FOOTPRINTS_LINE)) map.removeLayer(FOOTPRINTS_LINE);
      if (map.getLayer(FOOTPRINTS_FILL)) map.removeLayer(FOOTPRINTS_FILL);
      if (map.getSource(FOOTPRINTS)) map.removeSource(FOOTPRINTS);
    };
  }, [map, tool]);

  // A press on the map places a corner, or proposes the footprint under it; the first press begins the frame where it is.
  useEffect(() => {
    function onClick(event: MapMouseEvent) {
      const { state: now, tool: inHand, on: tell, onDetected: found } = latest.current;
      const at: LonLat = { lon: event.lngLat.lng, lat: event.lngLat.lat };
      if (inHand === "detect") {
        const [feature] = map.getLayer(FOOTPRINTS_FILL) ? map.queryRenderedFeatures(event.point, { layers: [FOOTPRINTS_FILL] }) : [];
        const footprint = feature ? footprintOutline(feature.geometry) : null;
        if (!footprint) {
          found?.({ found: false, at: { x: event.point.x, y: event.point.y } });
          return;
        }
        // The frame of an outline is one: a footprint joins the frame that is, or begins one at its centre.
        const frame = now.frame ?? footprint.frame;
        if (!now.frame) tell({ type: "began", at: frame.centre });
        const corners = now.frame ? footprint.corners.map((corner) => toMetres(frame, toLonLat(footprint.frame, corner))) : footprint.corners;
        tell({ type: "footprintTaken", corners });
        found?.({ found: true, corners: corners.length, area: areaOf(corners), at: { x: event.point.x, y: event.point.y } });
        return;
      }
      const kind = kindOfTool(inHand);
      if (kind && now.frame) {
        if (now.pending) return;
        const metresPerPx = metresPerPixel(map.getCenter().lat, map.getZoom());
        if (kind === "wall" || kind === "building") {
          tell({ type: "shapePlaced", kind, at: toMetres(now.frame, at), metresPerPx, touch: isCoarse() });
          return;
        }
        // A press with the box or the tank in hand picks the obstacle under it, else the roof when it is
        // inside it (D79), else lets go of what was picked.
        const [under] = map.getLayer(OBSTACLES_FILL) ? map.queryRenderedFeatures(event.point, { layers: [OBSTACLES_FILL] }) : [];
        const id = under?.properties?.id;
        if (typeof id === "number") {
          tell({ type: "obstacleSelected", id });
          return;
        }
        const inside = isClosedAndSettled(now) && isInside(now.corners, toMetres(now.frame, at));
        tell({ type: "obstacleSelected", id: null });
        tell({ type: "roofPicked", picked: inside });
        return;
      }
      if (inHand !== "corners" || now.closed) return;
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
      if (now.corners.length > 0 || !onTheCanvas(map, event)) return;
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

  // A drag with the box or the tank in hand draws it on the closed roof, while none awaits its height.
  useEffect(() => {
    const kind = kindOfTool(tool);
    if (kind !== "box" && kind !== "cylinder") return;
    let from: { at: LonLat; point: { x: number; y: number } } | null = null;
    let drawing = false;
    function lonLatOfEvent(event: MapMouseEvent | MapTouchEvent): LonLat {
      return { lon: event.lngLat.lng, lat: event.lngLat.lat };
    }
    function onDown(event: MapMouseEvent | MapTouchEvent) {
      const { state: now } = latest.current;
      // Two fingers move the map: a box not yet begun is given up to them.
      if (fingersOf(event) > 1) {
        if (!drawing) from = null;
        return;
      }
      // While the roof is picked up a drag inside it moves it and one outside pans the map: nothing is drawn.
      if (!now.frame || !now.closed || now.pending || now.picked || !onTheCanvas(map, event)) return;
      if ("originalEvent" in event && event.originalEvent instanceof MouseEvent && event.originalEvent.button !== 0) return;
      from = { at: lonLatOfEvent(event), point: { x: event.point.x, y: event.point.y } };
      drawing = false;
      event.preventDefault();
    }
    function onMove(event: MapMouseEvent | MapTouchEvent) {
      const { state: now, on: tell } = latest.current;
      if (!from || !now.frame) return;
      event.preventDefault();
      // A press that has not yet moved is a click: it picks, it draws nothing.
      if (!drawing && Math.hypot(event.point.x - from.point.x, event.point.y - from.point.y) < DRAG_FROM_PX) return;
      drawing = true;
      tell({ type: "shapeDragged", kind: kind as "box" | "cylinder", from: toMetres(now.frame, from.at), to: toMetres(now.frame, lonLatOfEvent(event)) });
    }
    function onUp() {
      if (!from) return;
      from = null;
      latest.current.on({ type: "shapeDropped" });
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

  // A drag of the roof picked up, with one finger or the mouse, from inside it: it moves it and its obstacles.
  useEffect(() => {
    if (tool === null) return;
    let from: XY | null = null;
    function onDown(event: MapMouseEvent | MapTouchEvent) {
      const { state: now } = latest.current;
      if (!now.picked || !now.frame || !onTheCanvas(map, event) || fingersOf(event) > 1) return;
      if (event.originalEvent instanceof MouseEvent && event.originalEvent.button !== 0) return;
      const at = toMetres(now.frame, { lon: event.lngLat.lng, lat: event.lngLat.lat });
      if (!isInside(now.corners, at)) return;
      from = at;
      event.preventDefault();
    }
    function onMove(event: MapMouseEvent | MapTouchEvent) {
      const { state: now, on: tell } = latest.current;
      if (!from || !now.frame) return;
      // A second finger is the map's: the move ends where it is.
      if (fingersOf(event) > 1) return onUp();
      event.preventDefault();
      const to = toMetres(now.frame, { lon: event.lngLat.lng, lat: event.lngLat.lat });
      tell({ type: "roofMoved", by: { x: to.x - from.x, y: to.y - from.y } });
    }
    function onUp() {
      if (!from) return;
      from = null;
      latest.current.on({ type: "roofDropped" });
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

  const drawsByDrag = (tool === "rectangle" && state.corners.length === 0) || ((tool === "box" || tool === "tank") && state.closed && !state.pending && !state.picked);
  const drawsByPress = (tool === "corners" && !state.closed) || tool === "detect" || ((tool === "wall" || tool === "building") && state.closed && !state.pending);

  // While a box can be drawn, a drag is the box's, not the map's.
  useEffect(() => {
    if (drawsByDrag) map.dragPan.disable();
    else map.dragPan.enable();
  }, [map, drawsByDrag]);

  // The cursor says what a press does.
  useEffect(() => {
    map.getCanvas().style.cursor = drawsByDrag || drawsByPress ? "crosshair" : "";
  }, [map, drawsByDrag, drawsByPress]);

  // Without a tool in hand (the roof typed by hand) the corners are shown, not dragged.
  useEffect(() => {
    [...corners.current, ...midpoints.current].forEach((marker) => marker.setDraggable(tool !== null));
  }, [tool, state.corners.length]);

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
      roofTurn.current?.remove();
      roofTurn.current = null;
      liftLabel.current?.remove();
      liftLabel.current = null;
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

    const metresPerPx = metresPerPixel(map.getCenter().lat, map.getZoom());
    const turning = turnHandleOf(state, metresPerPx);
    if (!turning) {
      turn.current?.remove();
      turn.current = null;
    } else {
      turn.current ??= turnMarker(map, latest, isDragging);
      turn.current.setLngLat(lonLatOf(frame, turning.handle));
    }

    const roofHandle = roofHandleOf(state, metresPerPx);
    if (!roofHandle) {
      roofTurn.current?.remove();
      roofTurn.current = null;
    } else {
      roofTurn.current ??= roofTurnMarker(map, latest, isTurningRoof);
      if (!isTurningRoof.current) roofTurn.current.setLngLat(lonLatOf(frame, roofHandle.handle));
    }

    // The label of a move stands at the middle of the roof; that of a turn beside the handle.
    const { lift } = state;
    if (!lift) {
      liftLabel.current?.remove();
      liftLabel.current = null;
    } else {
      if (liftLabel.current?.getElement().dataset.kind !== lift.kind) {
        liftLabel.current?.remove();
        liftLabel.current = liftLabelMarker(map, lift.kind);
      }
      const hemisphere = frame.centre.lat >= 0 ? "north" : "south";
      const at = lift.kind === "turn" && roofHandle ? roofHandle.handle : centroidOf(state.corners);
      liftLabel.current.setLngLat(lonLatOf(frame, at));
      liftLabel.current.getElement().textContent = liftLabelOf(lift, state.corners, hemisphere);
    }
  }, [map, state]);

  // The labels of the obstacles, the handles of the selected one, and the points of the shape being drawn.
  useEffect(() => {
    if (isDragging.current) return;
    const { frame } = state;
    const remove = (markers: Marker[]) => markers.splice(0).forEach((marker) => marker.remove());
    if (!frame) {
      remove(obstacleLabels.current);
      remove(obstacleHandles.current);
      remove(liveHandles.current);
      return;
    }
    if (obstacleLabels.current.length !== state.obstacles.length) {
      remove(obstacleLabels.current);
      obstacleLabels.current = state.obstacles.map(() => obstacleLabelMarker(map));
    }
    state.obstacles.forEach((obstacle, index) => {
      const marker = obstacleLabels.current[index];
      marker.setLngLat(lonLatOf(frame, foldOf(obstacle)));
      marker.getElement().textContent = labelOf(obstacle);
    });

    const selected = state.obstacles.find((obstacle) => obstacle.id === state.selectedObstacle) ?? null;
    const handles = selected ? handlesOf(selected) : [];
    if (obstacleHandles.current.length !== handles.length || obstacleHandles.current.some((marker) => marker.getElement().dataset.obstacle !== String(selected?.id))) {
      remove(obstacleHandles.current);
      obstacleHandles.current = selected ? handles.map((_, index) => obstacleHandleMarker(map, selected.id, index, latest, isDragging)) : [];
    }
    handles.forEach((point, index) => obstacleHandles.current[index].setLngLat(lonLatOf(frame, point)));

    const live = state.drawing && state.drawing.kind !== "cylinder" ? state.drawing.points : [];
    if (liveHandles.current.length !== live.length) {
      remove(liveHandles.current);
      liveHandles.current = live.map(() => liveHandleMarker(map));
    }
    live.forEach((point, index) => liveHandles.current[index].setLngLat(lonLatOf(frame, point)));
  }, [map, state]);

  useEffect(
    () => () => {
      [corners, midpoints, labels, obstacleLabels, obstacleHandles, liveHandles].forEach((markers) => markers.current.splice(0).forEach((marker) => marker.remove()));
      turn.current?.remove();
      roofTurn.current?.remove();
      liftLabel.current?.remove();
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
  const marker = new Marker({ element, draggable: latest.current.tool !== null }).setLngLat([0, 0]).addTo(map);
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
  const marker = new Marker({ element, draggable: latest.current.tool !== null }).setLngLat([0, 0]).addTo(map);
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

function obstacleLabelMarker(map: MapLibre): Marker {
  const element = document.createElement("code");
  element.className = LABEL;
  element.dataset.testid = "obstacle-label";
  // The label hangs from the lowest point of the shape, to its right: clear of the roof's edge labels.
  return new Marker({ element, anchor: "top-left", offset: [-6, 10] }).setLngLat([0, 0]).addTo(map);
}

/** A handle of the selected obstacle: a corner, or the edge of a tank; dragged, it reshapes it. */
function obstacleHandleMarker(map: MapLibre, id: number, index: number, latest: Latest, isDragging: React.RefObject<boolean>): Marker {
  const element = document.createElement("button");
  element.type = "button";
  element.className = TARGET;
  element.dataset.testid = "obstacle-corner";
  element.dataset.obstacle = String(id);
  element.setAttribute("aria-label", `Corner ${index + 1} of the obstacle`);
  const dot = document.createElement("span");
  dot.className = CORNER;
  element.appendChild(dot);
  element.addEventListener("click", (event) => event.stopPropagation());
  const marker = new Marker({ element, draggable: true }).setLngLat([0, 0]).addTo(map);
  marker.on("dragstart", () => {
    isDragging.current = true;
  });
  marker.on("drag", () => {
    const { state, on } = latest.current;
    if (state.frame) on({ type: "obstacleCornerMoved", id, index, at: metresOf(marker, state.frame) });
  });
  marker.on("dragend", () => {
    isDragging.current = false;
    latest.current.on({ type: "obstacleCornerDropped" });
  });
  return marker;
}

/** A point of the wall or the building being drawn: seen, not dragged. */
function liveHandleMarker(map: MapLibre): Marker {
  const element = document.createElement("span");
  element.className = TARGET;
  element.dataset.testid = "live-point";
  element.setAttribute("aria-hidden", "true");
  const dot = document.createElement("span");
  dot.className = CORNER;
  element.appendChild(dot);
  return new Marker({ element }).setLngLat([0, 0]).addTo(map);
}

/** The label of the roof while it is moved or turned: how far, or the turn and where it faces. */
function liftLabelMarker(map: MapLibre, kind: Lift["kind"]): Marker {
  const element = document.createElement("code");
  element.className = LABEL;
  element.dataset.testid = "lift-label";
  element.dataset.kind = kind;
  element.setAttribute("role", "status");
  // A move's label at the middle of the roof; a turn's to the right of the handle.
  const placed: MarkerOptions = kind === "turn" ? { anchor: "left", offset: [TURN_LABEL_ASIDE_PX, 0] } : { anchor: "center" };
  return new Marker({ element, ...placed }).setLngLat([0, 0]).addTo(map);
}

/** The handle that turns the roof picked up about its middle, its obstacles with it (D79). */
function roofTurnMarker(map: MapLibre, latest: Latest, isTurning: React.RefObject<boolean>): Marker {
  const element = document.createElement("button");
  element.type = "button";
  element.className = ROOF_TURN_TARGET;
  element.dataset.testid = "roof-turn-handle";
  element.setAttribute("aria-label", "Turn the roof");
  const ring = document.createElement("span");
  ring.className = ROOF_TURN;
  ring.innerHTML = TURN_ICON;
  element.appendChild(ring);
  element.addEventListener("click", (event) => event.stopPropagation());
  const marker = new Marker({ element, draggable: true }).setLngLat([0, 0]).addTo(map);
  // The turn is swept from where the handle stood when it was pressed: a drag begins only once the pointer has moved.
  let pressedAt: XY | null = null;
  let from: XY | null = null;
  element.addEventListener("pointerdown", () => {
    const { state } = latest.current;
    pressedAt = state.frame ? metresOf(marker, state.frame) : null;
  });
  marker.on("dragstart", () => {
    if (!pressedAt) return;
    isTurning.current = true;
    from = pressedAt;
    ring.classList.add(ROOF_TURN_HELD);
  });
  marker.on("drag", () => {
    const { state, on } = latest.current;
    if (state.frame && from) on({ type: "roofTurned", from, to: metresOf(marker, state.frame) });
  });
  marker.on("dragend", () => {
    isTurning.current = false;
    from = null;
    ring.classList.remove(ROOF_TURN_HELD);
    latest.current.on({ type: "roofDropped" });
  });
  return marker;
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
