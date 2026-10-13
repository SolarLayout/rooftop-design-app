"use client";

import type { FeatureCollection, Geometry } from "geojson";
import { Marker, type Map as MapLibre, type MapMouseEvent, type MapTouchEvent, type MarkerOptions } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { classNames } from "@/components/ui/class-names";
import { shown } from "@/components/ui/number-entry";
import { footprintOutline, FOOTPRINTS_LAYER, FOOTPRINTS_URL, FOOTPRINTS_ZOOM } from "@/lib/map/overture";
import { metresPerPixel } from "@/lib/map/scale-bar";
import { frameAt, toLonLat, toMetres, type Frame, type LonLat } from "@/lib/outline/frame";
import type { Tool } from "@/lib/outline/how-to";
import { areaOf, centroidOf, midpointsOf, type XY } from "@/lib/geometry/measure";
import { foldOf, isRound, labelOf, type Obstacle, type ObstacleKind, type Shape } from "@/lib/outline/obstacles";
import { turnedAbout } from "@/lib/outline/rectangle";
import { ghostOf, liftLabelPlaceOf, turnHandleOfPicked } from "@/lib/outline/lifted";
import { drawsOf } from "@/lib/outline/draws";
import { handleReachOf, shortestSideOf } from "@/lib/outline/handle-reach";
import { followsOf, type Held } from "@/lib/outline/held";
import { obstacleLabelsOf, type Rect } from "@/lib/outline/label-places";
import { mapCursorOf } from "@/lib/outline/map-cursor";
import { isInside, type Lift } from "@/lib/outline/roof-move";
import { isClosedAndSettled, type Lifted, type OutlineEvent, type OutlineState } from "@/lib/outline/outline-state";

/** The kind of obstacle a tool draws; null for a tool of the outline. */
export function kindOfTool(tool: Tool | null): ObstacleKind | null {
  switch (tool) {
    case "box":
      return "box";
    case "tank":
      return "cylinder";
    case "tree":
      return "tree";
    case "wall":
      return "wall";
    case "building":
      return "building";
    default:
      return null;
  }
}

/** What a press with Detect building found, and where on the screen it was; a footprint found is taken as the outline at once. */
export type Detected = { at: { x: number; y: number } } & ({ found: true; taken: readonly XY[]; area: number } | { found: false });

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
// A press within this many pixels of a wall's line is on the wall.
const WALL_WITHIN_PX = 4;
// A press that moves less than this many pixels is a click, not a drag (MapLibre's own tolerance is 3).
const DRAG_FROM_PX = 4;

// The handle of a corner: 18 (22 on touch) inside a target of 44, white with an accent line.
const TARGET = "flex size-touch cursor-grab items-center justify-center rounded-full focus-ring";
const CORNER = classNames(
  "block size-5.5 rounded-full border-corner-touch border-accent bg-handle-fill shadow-handle",
  "desktop:size-4.5 desktop:border-corner",
);
const CORNER_EDITED = "pulsing-corner";
// An obstacle's handles take a press of 24 on desktop, so that a press inside a small one moves it (D79); 44 on touch.
const OBSTACLE_TARGET = classNames(TARGET, "desktop:size-6");
// The ring of a midpoint is as wide as the line of the outline.
const MIDPOINT = "block size-2.5 rounded-full border-outline border-accent-ink bg-accent";
// An edge's length stands this many pixels below its midpoint, beside the handle, not on it.
const EDGE_LABEL_BELOW_PX = 18;
const LABEL = "block rounded-control bg-ground px-2.25 py-0.75 type-mono-touch desktop:type-mono font-medium text-text shadow-tooltip select-none";
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

type DragListener = (event: MapMouseEvent | MapTouchEvent) => void;

/**
 * A drag on the map: pressed and moved on the map, let go anywhere. A release over the panel or outside the
 * window reaches the map as no event of its own, so it is listened to on the window. Returns the cleanup.
 */
function listenToDrag(map: MapLibre, onDown: DragListener, onMove: DragListener, onUp: () => void): () => void {
  map.on("mousedown", onDown);
  map.on("mousemove", onMove);
  map.on("touchstart", onDown);
  map.on("touchmove", onMove);
  const ends = ["mouseup", "touchend", "touchcancel"] as const;
  ends.forEach((end) => window.addEventListener(end, onUp));
  return () => {
    map.off("mousedown", onDown);
    map.off("mousemove", onMove);
    map.off("touchstart", onDown);
    map.off("touchmove", onMove);
    ends.forEach((end) => window.removeEventListener(end, onUp));
  };
}

/** A token of the container's stylesheet, for what MapLibre paints itself. */
function tokenOf(map: MapLibre, name: string): string {
  return getComputedStyle(map.getContainer()).getPropertyValue(name).trim();
}

type Drawing = {
  corners: readonly XY[];
  closed: boolean;
  picked: boolean;
  stems: readonly [XY, XY][];
  ghost: { points: readonly XY[]; closed: boolean } | null;
};

const NOTHING_DRAWN: Drawing = { corners: [], closed: false, picked: false, stems: [], ghost: null };

/** The roof, the stems of the turn handles, and where what is lifted stood: each a feature with its role. */
function geoJsonOf(frame: Frame | null, { corners, closed, picked, stems, ghost }: Drawing): FeatureCollection {
  if (!frame || corners.length < 2) return { type: "FeatureCollection", features: [] };
  const ring = corners.map((corner) => lonLatOf(frame, corner));
  const geometry: Geometry =
    closed && corners.length >= 3 ? { type: "Polygon", coordinates: [[...ring, ring[0]]] } : { type: "LineString", coordinates: ring };
  const features: FeatureCollection["features"] = [{ type: "Feature", geometry, properties: { role: "roof", picked } }];
  stems.forEach((stem) => features.push({ type: "Feature", geometry: { type: "LineString", coordinates: stem.map((point) => lonLatOf(frame, point)) }, properties: { role: "stem", picked: false } }));
  if (ghost) {
    const was = ghost.points.map((point) => lonLatOf(frame, point));
    features.push({ type: "Feature", geometry: { type: "LineString", coordinates: ghost.closed ? [...was, was[0]] : was }, properties: { role: "ghost", picked: false } });
  }
  return { type: "FeatureCollection", features };
}

/** What the outline draws of the state: the stems of the box's handle and of what is picked, and where what is lifted stood. */
function drawingOf(state: OutlineState, metresPerPx: number): Drawing {
  const box = turnHandleOf(state, metresPerPx)?.stem;
  const picked = turnHandleOfPicked(state, metresPerPx);
  const stems = [...(box ? [box] : []), ...(picked ? [[picked.foot, picked.handle] as [XY, XY]] : [])];
  return { corners: state.corners, closed: state.closed, picked: state.picked, stems, ghost: ghostOf(state) };
}

/** The obstacle under a point of the screen, its fill or, for a wall, its line within a few pixels; null for none. */
function obstacleUnder(map: MapLibre, point: { x: number; y: number }): number | null {
  const layers = [OBSTACLES_FILL, OBSTACLES_LINE].filter((layer) => map.getLayer(layer));
  if (layers.length === 0) return null;
  const near: [[number, number], [number, number]] = [
    [point.x - WALL_WITHIN_PX, point.y - WALL_WITHIN_PX],
    [point.x + WALL_WITHIN_PX, point.y + WALL_WITHIN_PX],
  ];
  const [under] = map.queryRenderedFeatures(near, { layers });
  const id = under?.properties?.id;
  return typeof id === "number" ? id : null;
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

/** The outline of a shape as points: a tank or a tree as a polygon of many sides. */
function ringOf(shape: Shape): XY[] {
  if (!isRound(shape.kind)) return [...shape.points];
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

/** The handles of an obstacle: its corners, or the one at the edge of a tank or a tree. */
function handlesOf(obstacle: Obstacle): XY[] {
  if (!isRound(obstacle.kind)) return [...obstacle.points];
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
  const pickedTurn = useRef<Marker | null>(null);
  const liftLabel = useRef<Marker | null>(null);
  // While the handle of what is picked is held it follows the pointer; the rest of the outline follows the state.
  const isTurningPicked = useRef(false);
  const obstacleLabels = useRef<Marker[]>([]);
  const obstacleHandles = useRef<Marker[]>([]);
  const liveHandles = useRef<Marker[]>([]);
  const held = useRef<Held>(null);
  const overlaysOf = (): Overlays => ({
    labels: labels.current,
    obstacleLabels: obstacleLabels.current,
    obstacleHandles: obstacleHandles.current,
    others: [
      ...[...corners.current, ...midpoints.current].map((marker) => marker.getElement().firstElementChild),
      ...[turn.current, pickedTurn.current, liftLabel.current].map((marker) => marker?.getElement()),
    ],
  });
  const latest = useRef({ state, tool, on, onDetected });
  useEffect(() => {
    latest.current = { state, tool, on, onDetected };
  });

  // The layers, once.
  useEffect(() => {
    map.addSource(SOURCE, { type: "geojson", data: geoJsonOf(null, NOTHING_DRAWN) });
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
        found?.({ found: true, taken: corners, area: areaOf(corners), at: { x: event.point.x, y: event.point.y } });
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
        const id = obstacleUnder(map, event.point);
        if (id !== null) {
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
    return listenToDrag(map, onDown, onMove, onUp);
  }, [map, tool]);

  // A drag with the box, the tank or the tree in hand draws it on the closed roof, while none awaits its height.
  useEffect(() => {
    const kind = kindOfTool(tool);
    if (kind !== "box" && kind !== "cylinder" && kind !== "tree") return;
    const drawn = kind;
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
      // A drag that begins on the obstacle picked moves it.
      if (now.selectedObstacle !== null && obstacleUnder(map, event.point) === now.selectedObstacle) return;
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
      tell({ type: "shapeDragged", kind: drawn, from: toMetres(now.frame, from.at), to: toMetres(now.frame, lonLatOfEvent(event)) });
    }
    function onUp() {
      if (!from) return;
      from = null;
      latest.current.on({ type: "shapeDropped" });
    }
    return listenToDrag(map, onDown, onMove, onUp);
  }, [map, tool]);

  // A drag of what is picked, with one finger or the mouse, from inside it: the roof with its obstacles, or
  // the obstacle picked.
  useEffect(() => {
    if (tool === null) return;
    let from: { at: XY; of: "roof" | number } | null = null;
    function onDown(event: MapMouseEvent | MapTouchEvent) {
      const { state: now } = latest.current;
      if (!now.frame || !onTheCanvas(map, event) || fingersOf(event) > 1) return;
      if (event.originalEvent instanceof MouseEvent && event.originalEvent.button !== 0) return;
      const at = toMetres(now.frame, { lon: event.lngLat.lng, lat: event.lngLat.lat });
      if (now.selectedObstacle !== null && obstacleUnder(map, event.point) === now.selectedObstacle) from = { at, of: now.selectedObstacle };
      else if (now.picked && isInside(now.corners, at)) from = { at, of: "roof" };
      else return;
      event.preventDefault();
    }
    function onMove(event: MapMouseEvent | MapTouchEvent) {
      const { state: now, on: tell } = latest.current;
      if (!from || !now.frame) return;
      // A second finger is the map's: the move ends where it is.
      if (fingersOf(event) > 1) return onUp();
      event.preventDefault();
      const to = toMetres(now.frame, { lon: event.lngLat.lng, lat: event.lngLat.lat });
      const by = { x: to.x - from.at.x, y: to.y - from.at.y };
      tell(from.of === "roof" ? { type: "roofMoved", by } : { type: "obstacleMoved", id: from.of, by });
    }
    function onUp() {
      if (!from) return;
      from = null;
      latest.current.on({ type: "liftDropped" });
    }
    return listenToDrag(map, onDown, onMove, onUp);
  }, [map, tool]);

  const draws = drawsOf(tool, state);
  const drawsByDrag = draws === "drag";

  // While a box can be drawn, a drag is the box's, not the map's.
  useEffect(() => {
    if (drawsByDrag) map.dragPan.disable();
    else map.dragPan.enable();
  }, [map, drawsByDrag]);

  // The cursor says what a drag does (D79): over what is picked, while the map pans, while a tool draws.
  const [overPicked, setOverPicked] = useState(false);
  const [panning, setPanning] = useState(false);
  useEffect(() => {
    function onMove(event: MapMouseEvent) {
      const { state: now } = latest.current;
      if (!now.frame || now.lift) return;
      const onObstacle = now.selectedObstacle !== null && obstacleUnder(map, event.point) === now.selectedObstacle;
      const inRoof = now.picked && isInside(now.corners, toMetres(now.frame, { lon: event.lngLat.lng, lat: event.lngLat.lat }));
      setOverPicked(onObstacle || inRoof);
    }
    const panned = (isPanning: boolean) => () => setPanning(isPanning);
    const out = () => setOverPicked(false);
    const started = panned(true);
    const ended = panned(false);
    map.on("mousemove", onMove);
    map.on("mouseout", out);
    map.on("dragstart", started);
    map.on("dragend", ended);
    return () => {
      map.off("mousemove", onMove);
      map.off("mouseout", out);
      map.off("dragstart", started);
      map.off("dragend", ended);
    };
  }, [map]);
  const isPicking = state.picked || state.selectedObstacle !== null;
  const cursor = mapCursorOf({ draws: draws !== null, overPicked: isPicking && overPicked, dragged: panning || state.lift !== null });
  useEffect(() => {
    map.getCanvas().style.cursor = cursor;
  }, [map, cursor]);

  // Without a tool in hand (the roof typed by hand) the corners are shown, not dragged.
  useEffect(() => {
    [...corners.current, ...midpoints.current].forEach((marker) => marker.setDraggable(tool !== null));
  }, [tool, state.corners.length]);

  // The handles and the labels: made anew when their number changes, moved otherwise; left alone
  // while a corner is dragged, because the drag is theirs. While the rectangle is turned they follow the turn, its handle the hand.
  useEffect(() => {
    const follows = followsOf(held.current);
    if (!follows.handles) return;
    const { frame } = state;
    const remove = (markers: Marker[]) => markers.splice(0).forEach((marker) => marker.remove());
    if (!frame) {
      remove(corners.current);
      remove(midpoints.current);
      remove(labels.current);
      turn.current?.remove();
      turn.current = null;
      pickedTurn.current?.remove();
      pickedTurn.current = null;
      liftLabel.current?.remove();
      liftLabel.current = null;
      return;
    }
    const drawnEdges = state.closed ? state.corners.length : Math.max(0, state.corners.length - 1);

    if (corners.current.length !== state.corners.length) {
      remove(corners.current);
      corners.current = state.corners.map((_, index) => cornerMarker(map, index, latest, held));
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
      midpoints.current = Array.from({ length: drawnEdges }, (_, edge) => midpointMarker(map, edge, latest, held));
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
      turn.current ??= turnMarker(map, latest, held);
      if (follows.turnHandle) turn.current.setLngLat(lonLatOf(frame, turning.handle));
    }

    const picked = turnHandleOfPicked(state, metresPerPx);
    if (!picked) {
      pickedTurn.current?.remove();
      pickedTurn.current = null;
    } else {
      pickedTurn.current ??= pickedTurnMarker(map, latest, isTurningPicked);
      pickedTurn.current.getElement().setAttribute("aria-label", picked.of === "roof" ? "Turn the roof" : "Turn the obstacle");
      if (!isTurningPicked.current) pickedTurn.current.setLngLat(lonLatOf(frame, picked.handle));
    }

    // The label of a move stands at the middle of what moves; that of a turn beside the handle.
    const label = liftLabelPlaceOf(state, metresPerPx);
    if (!label) {
      liftLabel.current?.remove();
      liftLabel.current = null;
    } else {
      if (liftLabel.current?.getElement().dataset.kind !== label.kind) {
        liftLabel.current?.remove();
        liftLabel.current = liftLabelMarker(map, label.kind);
      }
      liftLabel.current.setLngLat(lonLatOf(frame, label.at));
      liftLabel.current.getElement().textContent = label.text;
    }
  }, [map, state]);

  // The labels of the obstacles, the handles of the selected one, and the points of the shape being drawn.
  useEffect(() => {
    if (!followsOf(held.current).handles) return;
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
      obstacleHandles.current = selected ? handles.map((_, index) => obstacleHandleMarker(map, selected.id, index, latest, held)) : [];
    }
    handles.forEach((point, index) => obstacleHandles.current[index].setLngLat(lonLatOf(frame, point)));

    const live = state.drawing && !isRound(state.drawing.kind) ? state.drawing.points : [];
    if (liveHandles.current.length !== live.length) {
      remove(liveHandles.current);
      liveHandles.current = live.map(() => liveHandleMarker(map));
    }
    live.forEach((point, index) => liveHandles.current[index].setLngLat(lonLatOf(frame, point)));
    fitOnScreen(map, state, overlaysOf());
  }, [map, state]);

  // A zoom or a turn of the map changes what fits on the screen: the obstacles' labels and handles are fitted again.
  useEffect(() => {
    const fit = () => {
      if (followsOf(held.current).handles) fitOnScreen(map, latest.current.state, overlaysOf());
    };
    map.on("zoom", fit);
    map.on("rotate", fit);
    return () => {
      map.off("zoom", fit);
      map.off("rotate", fit);
    };
  }, [map]);

  useEffect(
    () => () => {
      [corners, midpoints, labels, obstacleLabels, obstacleHandles, liveHandles].forEach((markers) => markers.current.splice(0).forEach((marker) => marker.remove()));
      turn.current?.remove();
      pickedTurn.current?.remove();
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

function cornerMarker(map: MapLibre, index: number, latest: Latest, held: React.RefObject<Held>): Marker {
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
    held.current = "corner";
    latest.current.on({ type: "selected", index });
    if (isCoarse()) loupe = loupeMarker(map);
  });
  marker.on("drag", () => {
    const { state, on } = latest.current;
    if (state.frame) on({ type: "cornerMoved", index, at: metresOf(marker, state.frame), metresPerPx: metresPerPixel(map.getCenter().lat, map.getZoom()) });
    if (loupe) {
      loupe.setLngLat(marker.getLngLat());
      drawLoupe(map, loupe, marker.getLngLat());
    }
  });
  marker.on("dragend", () => {
    held.current = null;
    loupe?.remove();
    loupe = null;
    latest.current.on({ type: "cornerDropped" });
  });
  return marker;
}

function midpointMarker(map: MapLibre, edge: number, latest: Latest, held: React.RefObject<Held>): Marker {
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
    held.current = "corner";
    const { state, on } = latest.current;
    if (state.frame) on({ type: "midpointTaken", edge, at: metresOf(marker, state.frame) });
  });
  marker.on("drag", () => {
    const { state, on } = latest.current;
    if (state.frame) on({ type: "cornerMoved", index: edge + 1, at: metresOf(marker, state.frame), metresPerPx: metresPerPixel(map.getCenter().lat, map.getZoom()) });
  });
  marker.on("dragend", () => {
    held.current = null;
    latest.current.on({ type: "cornerDropped" });
  });
  return marker;
}

function labelMarker(map: MapLibre): Marker {
  const element = document.createElement("code");
  element.className = LABEL;
  element.dataset.testid = "edge-label";
  // The label stands beside the midpoint handle, not on it.
  return new Marker({ element, offset: [0, EDGE_LABEL_BELOW_PX] }).setLngLat([0, 0]).addTo(map);
}

/** Where a marker's element stands on the map's screen, from its middle at its point and its offset. */
function rectOfCentred(map: MapLibre, marker: Marker, below: number): Rect {
  const at = map.project(marker.getLngLat());
  const { offsetWidth: width, offsetHeight: height } = marker.getElement();
  return { left: at.x - width / 2, top: at.y + below - height / 2, right: at.x + width / 2, bottom: at.y + below + height / 2 };
}

/** Where an element over the map stands on the map's screen, as it is drawn now. */
function rectOfElement(map: MapLibre, element: HTMLElement): Rect {
  const room = map.getContainer().getBoundingClientRect();
  const { left, top, right, bottom } = element.getBoundingClientRect();
  return { left: left - room.left, top: top - room.top, right: right - room.left, bottom: bottom - room.top };
}

type Overlays = {
  labels: readonly Marker[];
  obstacleLabels: readonly Marker[];
  obstacleHandles: readonly Marker[];
  /** The dots of the roof's corners and midpoints, its turn handles, the label of a move or a turn: kept clear of too. */
  others: readonly (Element | null | undefined)[];
};

/**
 * What of the obstacles fits on the screen at this zoom: their labels placed clear of the edges' lengths and of each other
 * (issue 238, item 29), and the handles of the one selected taking a press over their target, on their dot alone, or not
 * shown, by its size on the screen, so that a drag from inside a small one moves it (item 27).
 */
function fitOnScreen(map: MapLibre, state: OutlineState, { labels, obstacleLabels, obstacleHandles, others }: Overlays): void {
  const { frame } = state;
  if (!frame || obstacleLabels.length !== state.obstacles.length) return;
  const onScreen = (point: XY) => map.project(toLonLat(frame, point));
  const taken = [
    ...labels.map((label) => rectOfCentred(map, label, EDGE_LABEL_BELOW_PX)),
    ...others.flatMap((other) => (other instanceof HTMLElement ? [rectOfElement(map, other)] : [])),
  ];
  // Each label measured with its own words; a label shared by obstacles close together (item 32) is measured with its words
  // in a label's element, then shown on the first of them.
  const sizeOfElement = (element: HTMLElement) => ({ width: element.offsetWidth, height: element.offsetHeight });
  const asked = state.obstacles.map((obstacle, index) => {
    const element = obstacleLabels[index].getElement();
    const words = labelOf(obstacle);
    element.textContent = words;
    return { points: ringOf(obstacle).map(onScreen), size: sizeOfElement(element), selected: obstacle.id === state.selectedObstacle, name: obstacle.name, height: obstacle.height, words };
  });
  const [measuring] = obstacleLabels;
  const sizeOf = (words: string) => {
    const element = measuring.getElement();
    const was = element.textContent;
    element.textContent = words;
    const size = sizeOfElement(element);
    element.textContent = was;
    return size;
  };
  const container = map.getContainer();
  const shown = obstacleLabelsOf({ taken, labels: asked, sizeOf, bounds: { left: 0, top: 0, right: container.clientWidth, bottom: container.clientHeight } });
  shown.forEach((label, index) => {
    const marker = obstacleLabels[index];
    const element = marker.getElement();
    element.classList.toggle("invisible", label === null);
    if (!label) return;
    element.textContent = label.words;
    const at = map.project(marker.getLngLat());
    marker.setOffset([label.left - at.x, label.top - at.y]);
  });

  const selected = state.obstacles.find(({ id }) => id === state.selectedObstacle);
  const [first] = obstacleHandles;
  const dot = first?.getElement().firstElementChild;
  if (!selected || !first || !(dot instanceof HTMLElement)) return;
  const metresPerPx = metresPerPixel(map.getCenter().lat, map.getZoom());
  const reach = handleReachOf({ sidePx: shortestSideOf(selected) / metresPerPx, targetPx: first.getElement().offsetWidth, dotPx: dot.offsetWidth });
  obstacleHandles.forEach((handle) => {
    const element = handle.getElement();
    element.classList.toggle("pointer-events-none", reach !== "target");
    element.classList.toggle("invisible", reach === "none");
    element.firstElementChild?.classList.toggle("pointer-events-auto", reach === "dot");
  });
}

function obstacleLabelMarker(map: MapLibre): Marker {
  const element = document.createElement("code");
  element.className = LABEL;
  element.dataset.testid = "obstacle-label";
  // The label hangs from the lowest point of the shape, to its right: clear of the roof's edge labels.
  return new Marker({ element, anchor: "top-left", offset: [-6, 10] }).setLngLat([0, 0]).addTo(map);
}

/** A handle of the selected obstacle: a corner, or the edge of a tank; dragged, it reshapes it. */
function obstacleHandleMarker(map: MapLibre, id: number, index: number, latest: Latest, held: React.RefObject<Held>): Marker {
  const element = document.createElement("button");
  element.type = "button";
  element.className = OBSTACLE_TARGET;
  element.dataset.testid = "obstacle-corner";
  element.dataset.obstacle = String(id);
  element.setAttribute("aria-label", `Corner ${index + 1} of the obstacle`);
  const dot = document.createElement("span");
  dot.className = CORNER;
  element.appendChild(dot);
  element.addEventListener("click", (event) => event.stopPropagation());
  const marker = new Marker({ element, draggable: true }).setLngLat([0, 0]).addTo(map);
  marker.on("dragstart", () => {
    held.current = "corner";
  });
  marker.on("drag", () => {
    const { state, on } = latest.current;
    if (state.frame) on({ type: "obstacleCornerMoved", id, index, at: metresOf(marker, state.frame) });
  });
  marker.on("dragend", () => {
    held.current = null;
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

/** The label of what is lifted while it is moved or turned: how far, or the turn. */
function liftLabelMarker(map: MapLibre, kind: Lift["kind"]): Marker {
  const element = document.createElement("code");
  element.className = LABEL;
  element.dataset.testid = "lift-label";
  element.dataset.kind = kind;
  element.setAttribute("role", "status");
  // A move's label at the middle of what moves; a turn's to the right of the handle.
  const placed: MarkerOptions = kind === "turn" ? { anchor: "left", offset: [TURN_LABEL_ASIDE_PX, 0] } : { anchor: "center" };
  return new Marker({ element, ...placed }).setLngLat([0, 0]).addTo(map);
}

/** The handle that turns what is picked about its middle (D79): the roof with its obstacles, or a box or a building. */
function pickedTurnMarker(map: MapLibre, latest: Latest, isTurning: React.RefObject<boolean>): Marker {
  const element = document.createElement("button");
  element.type = "button";
  element.className = ROOF_TURN_TARGET;
  element.dataset.testid = "picked-turn-handle";
  const ring = document.createElement("span");
  ring.className = ROOF_TURN;
  ring.innerHTML = TURN_ICON;
  element.appendChild(ring);
  element.addEventListener("click", (event) => event.stopPropagation());
  const marker = new Marker({ element, draggable: true }).setLngLat([0, 0]).addTo(map);
  // The turn is swept from where the handle stood when it was pressed: a drag begins only once the pointer has moved.
  let pressedAt: { at: XY; of: Lifted } | null = null;
  let from: { at: XY; of: Lifted } | null = null;
  element.addEventListener("pointerdown", () => {
    const { state } = latest.current;
    const turning = turnHandleOfPicked(state, metresPerPixel(map.getCenter().lat, map.getZoom()));
    pressedAt = state.frame && turning ? { at: metresOf(marker, state.frame), of: turning.of } : null;
  });
  marker.on("dragstart", () => {
    if (!pressedAt) return;
    isTurning.current = true;
    from = pressedAt;
    ring.classList.add(ROOF_TURN_HELD);
  });
  marker.on("drag", () => {
    const { state, on } = latest.current;
    if (!state.frame || !from) return;
    const to = metresOf(marker, state.frame);
    on(from.of === "roof" ? { type: "roofTurned", from: from.at, to } : { type: "obstacleTurned", id: from.of, from: from.at, to });
  });
  marker.on("dragend", () => {
    isTurning.current = false;
    from = null;
    ring.classList.remove(ROOF_TURN_HELD);
    latest.current.on({ type: "liftDropped" });
  });
  return marker;
}

function turnMarker(map: MapLibre, latest: Latest, held: React.RefObject<Held>): Marker {
  const element = document.createElement("button");
  element.type = "button";
  element.className = TURN;
  element.dataset.testid = "turn-handle";
  element.setAttribute("aria-label", "Turn the rectangle");
  element.innerHTML = TURN_ICON;
  element.addEventListener("click", (event) => event.stopPropagation());
  const marker = new Marker({ element, draggable: true }).setLngLat([0, 0]).addTo(map);
  marker.on("dragstart", () => {
    held.current = "turn";
  });
  marker.on("drag", () => {
    const { state, on } = latest.current;
    if (state.frame) on({ type: "boxTurned", handle: metresOf(marker, state.frame) });
  });
  marker.on("dragend", () => {
    held.current = null;
    latest.current.on({ type: "turnDropped" });
  });
  return marker;
}
