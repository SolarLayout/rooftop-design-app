"use client";

import type { FeatureCollection, Geometry } from "geojson";
import { Marker, type Map as MapLibre, type MapMouseEvent } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { classNames } from "@/components/ui/class-names";
import { shown } from "@/components/ui/number-entry";
import { metresPerPixel } from "@/lib/map/scale-bar";
import { frameAt, toLonLat, toMetres, type Frame, type LonLat } from "@/lib/outline/frame";
import { midpointsOf, type XY } from "@/lib/outline/measure";
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

const isCoarse = () => window.matchMedia("(pointer: coarse)").matches;

/** A token of the container's stylesheet, for what MapLibre paints itself. */
function tokenOf(map: MapLibre, name: string): string {
  return getComputedStyle(map.getContainer()).getPropertyValue(name).trim();
}

function geoJsonOf(frame: Frame | null, corners: readonly XY[], closed: boolean): FeatureCollection {
  if (!frame || corners.length < 2) return { type: "FeatureCollection", features: [] };
  const ring = corners.map((corner) => {
    const { lon, lat } = toLonLat(frame, corner);
    return [lon, lat];
  });
  const geometry: Geometry =
    closed && corners.length >= 3 ? { type: "Polygon", coordinates: [[...ring, ring[0]]] } : { type: "LineString", coordinates: ring };
  return { type: "FeatureCollection", features: [{ type: "Feature", geometry, properties: {} }] };
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
  const isDragging = useRef(false);
  const latest = useRef({ state, tool, on });
  useEffect(() => {
    latest.current = { state, tool, on };
  });

  // The layers, once.
  useEffect(() => {
    map.addSource(SOURCE, { type: "geojson", data: geoJsonOf(null, [], false) });
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

  // The fill and the line follow the corners.
  useEffect(() => {
    const source = map.getSource(SOURCE);
    if (source && "setData" in source) (source as { setData: (data: FeatureCollection) => void }).setData(geoJsonOf(state.frame, state.corners, state.closed));
  }, [map, state.frame, state.corners, state.closed]);

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

  // The cursor says what a press does.
  useEffect(() => {
    map.getCanvas().style.cursor = tool === "corners" && !state.closed ? "crosshair" : "";
  }, [map, tool, state.closed]);

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
  }, [map, state]);

  useEffect(
    () => () => {
      [corners, midpoints, labels].forEach((markers) => markers.current.splice(0).forEach((marker) => marker.remove()));
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
  marker.on("dragstart", () => {
    isDragging.current = true;
    latest.current.on({ type: "selected", index });
  });
  marker.on("drag", () => {
    const { state, on } = latest.current;
    if (state.frame) on({ type: "cornerMoved", index, at: metresOf(marker, state.frame) });
  });
  marker.on("dragend", () => {
    isDragging.current = false;
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
