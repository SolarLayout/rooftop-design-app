"use client";

import { addProtocol, Map as MapLibre, setWorkerUrl, type ErrorEvent } from "maplibre-gl";
import { Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { classNames } from "@/components/ui/class-names";
import { measures } from "@/components/ui/measures";
import { SCALE_BAR_MAX } from "@/components/ui/design-numbers";
import type { Imagery } from "@/lib/places/provider";
import { metresPerPixel, scaleBarOf, type ScaleBar } from "@/lib/map/scale-bar";
import { OutlineLayer, type OutlineProps } from "./OutlineLayer";

/** Where the map looks. */
export type MapView = { lon: number; lat: number; zoom: number };

type Props = {
  imagery: Imagery;
  /** Where the map looks. When another view is given, the map flies to it. */
  view: MapView;
  /** The map is there, or the tiles do not come. */
  onState: (state: "ready" | "failed") => void;
  /** The map behind this component, once it is there: for what draws on it. */
  onMap?: (map: MapLibre) => void;
  /** The outline drawn on the map, and the tool in hand. */
  outline?: OutlineProps;
  /** A second line of attribution, for what else is shown on the map. */
  moreAttribution?: string | null;
  className?: string;
};

const IMAGERY = "imagery";
const MAX_ZOOM = 21.5;

// The worker of MapLibre is served by the app (tools/vendor-maplibre.ts): under Next's bundler it cannot
// find its own file. Set once, before the first map.
setWorkerUrl("/maplibre-gl/maplibre-gl-worker.mjs");
// The footprints come as one archive read by ranges (lib/map/overture.ts): the protocol that reads it.
addProtocol("pmtiles", new Protocol().tile);
// The phone board has no scale bar; the toolbar takes its room there.
const SCALE_BAR = "hidden flex-col gap-0.75 tablet:flex";

/**
 * The satellite map (MapLibre), with the scale bar and the attribution of the imagery on it. Its zoom
 * and north buttons are placed by the screen (`MapButtons`). The colours of what it draws come from
 * the tokens of its container.
 */
export function RoofMap({ imagery, view, onState, onMap, outline, moreAttribution, className }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibre | null>(null);
  const [scale, setScale] = useState<ScaleBar | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [loaded, setLoaded] = useState<MapLibre | null>(null);
  const [isMoving, setMoving] = useState(false);
  const tell = useRef(onState);
  const hand = useRef(onMap);
  useEffect(() => {
    tell.current = onState;
    hand.current = onMap;
  });

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const made = new MapLibre({
      container: element,
      center: [view.lon, view.lat],
      zoom: view.zoom,
      maxZoom: MAX_ZOOM,
      attributionControl: false,
      // The loupe of a touch drag copies what the map drew: the buffer must be kept.
      canvasContextAttributes: { preserveDrawingBuffer: true },
      style: {
        version: 8,
        sources: {
          [IMAGERY]: {
            type: "raster",
            tiles: [...imagery.tiles],
            tileSize: imagery.tileSize,
            maxzoom: imagery.maxNativeZoom,
            attribution: imagery.attribution,
          },
        },
        layers: [{ id: IMAGERY, type: "raster", source: IMAGERY }],
      },
    });
    map.current = made;
    let hasShownTiles = false;

    function onScale() {
      setScale(scaleBarOf(metresPerPixel(made.getCenter().lat, made.getZoom()), SCALE_BAR_MAX));
    }
    function onIdle() {
      if (hasShownTiles || !made.areTilesLoaded()) return;
      hasShownTiles = true;
      setState("ready");
      tell.current("ready");
    }
    function onError({ error }: ErrorEvent) {
      // A tile that does not come before any has: the imagery does not load.
      if (hasShownTiles || !isTileFault(error)) return;
      setState("failed");
      tell.current("failed");
    }
    made.on("move", onScale);
    made.on("movestart", () => setMoving(true));
    made.on("moveend", () => setMoving(false));
    made.on("idle", onIdle);
    made.on("error", onError);
    made.once("load", () => {
      setLoaded(made);
      hand.current?.(made);
    });
    onScale();

    return () => {
      map.current = null;
      setLoaded(null);
      made.remove();
    };
    // The map is made once; a view that changes later is flown to below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagery]);

  useEffect(() => {
    const made = map.current;
    if (!made) return;
    const at = made.getCenter();
    if (at.lng === view.lon && at.lat === view.lat && made.getZoom() === view.zoom) return;
    made.flyTo({ center: [view.lon, view.lat], zoom: view.zoom });
  }, [view]);

  return (
    <div className={classNames("relative bg-ground", className)}>
      <div
        ref={container}
        data-testid="roof-map"
        data-state={state}
        aria-busy={isMoving}
        role="img"
        aria-label="Satellite map"
        // MapLibre's stylesheet makes its container `relative`, and wins over `absolute`: it is sized, not placed.
        className="size-full"
      />
      {loaded && outline ? <OutlineLayer map={loaded} {...outline} /> : null}
      <div className="pointer-events-none absolute bottom-7 left-5 flex flex-col gap-2 text-text desktop:bottom-safe-7">
        {scale ? (
          <div data-testid="scale-bar" className={SCALE_BAR}>
            <code className="type-body-touch desktop:type-body on-imagery">{scale.label}</code>
            <div className="w-31">
              <div className="h-1.25 w-span border-x border-b border-text" style={measures({ span: scale.widthPx / SCALE_BAR_MAX })} />
            </div>
          </div>
        ) : null}
        {/* On desktop the toolbar stands beside it: the words wrap into a narrow column. */}
        <p className="type-unit text-text-on-imagery on-imagery desktop:max-w-44">
          {imagery.attribution}
          {moreAttribution ? <span className="block">{moreAttribution}</span> : null}
        </p>
      </div>
    </div>
  );
}

function isTileFault(error: unknown): boolean {
  return error instanceof Error && (error.name === "AJAXError" || /fetch|network|tile/i.test(error.message));
}
