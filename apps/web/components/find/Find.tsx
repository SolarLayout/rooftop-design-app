"use client";

import type { Map as MapLibre } from "maplibre-gl";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useReducer, useState } from "react";
import { useProject } from "@/components/shell/stores";
import { iconButtonLook } from "@/components/ui/button-look";
import { classNames } from "@/components/ui/class-names";
import { ROOF_ZOOM } from "@/components/ui/design-numbers";
import { Icon } from "@/components/ui/Icon";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/map/esri";
import { mapStateOf } from "@/lib/map/map-state";
import { outlineAfter, START } from "@/lib/outline/outline-state";
import { latitudeOf, longitudeOf } from "@/lib/stores/project-store";
import { MapButtons } from "./MapButtons";
import { NoMap } from "./NoMap";
import type { Tool } from "./OutlineLayer";
import { OutlinePanel } from "./OutlinePanel";
import { OutlineTools } from "./OutlineTools";
import type { MapView } from "./RoofMap";
import { Search, type FoundPlace } from "./Search";
import { Steps, type Step } from "./Steps";
import { useOutlineKeys } from "./use-outline-keys";
import { useWebGL } from "./use-web-gl";

// The map draws with WebGL in the browser alone: it is loaded there, never on the server.
const RoofMap = dynamic(() => import("./RoofMap").then((module) => module.RoofMap), { ssr: false });

const PROVIDER = esriProvider(KEY_OF_THE_APP);

/** Before a roof is found the map shows India, where the first users are, from far. */
const FROM_FAR: MapView = { lon: 78.5, lat: 21.5, zoom: 4 };

const WORDS: Record<Step | "rectangle", { title: string; lead: string }> = {
  find: { title: "Find the roof", lead: "Search an address or a place, or paste coordinates or a maps link. The map flies to it." },
  outline: { title: "Outline the roof", lead: "Click each corner. Drag a corner to adjust it, or type a length you have measured." },
  rectangle: { title: "Outline the roof", lead: "Drag a box across the roof, then turn it to the building by its handle. Drag a corner to adjust it." },
  build: { title: "Build the roof", lead: "The roof rises in the Studio." },
};

// On phone and tablet the panel is a sheet of 384 at the bottom; the map ends above it.
const STAGE = "absolute inset-x-0 top-0 bottom-96 desktop:bottom-0";
const OVER_THE_STAGE = "pointer-events-none absolute inset-x-0 top-0 bottom-96 desktop:bottom-0 desktop:right-find-stage-inset";
const FLOATING_BUTTON = classNames(iconButtonLook("secondary", "l", "square"), "size-12 rounded-card-s bg-surface-1 shadow-float");

/** Find the roof on the map and outline it: the flagship (plan/phase-04-find-and-outline.md). */
export function Find() {
  const latitude = useProject(latitudeOf);
  const longitude = useProject(longitudeOf);
  const webGL = useWebGL();
  const [tilesFailed, setTilesFailed] = useState(false);
  const [map, setMap] = useState<MapLibre | null>(null);
  const [step, setStep] = useState<Step>("find");
  const [foundAt, setFoundAt] = useState<FoundPlace | null>(null);
  const [outline, on] = useReducer(outlineAfter, START);
  const [tool, setTool] = useState<Tool>("corners");
  // The map begins at the roof of the design that is open; without one, from far.
  const [view, setView] = useState<MapView>(() =>
    latitude === null || longitude === null ? FROM_FAR : { lon: longitude, lat: latitude, zoom: ROOF_ZOOM },
  );

  const state = useMemo(
    () => mapStateOf({ hasKey: PROVIDER !== null, hasWebGL: webGL ?? true, tilesFailed }),
    [webGL, tilesFailed],
  );
  const words = WORDS[step === "outline" && tool === "rectangle" ? "rectangle" : step];
  useOutlineKeys(step === "outline", on);

  /** A place was found: the map flies to it at roof zoom, and the outline can begin. */
  function onPlace(place: FoundPlace) {
    setFoundAt(place);
    setView({ lon: place.lon, lat: place.lat, zoom: ROOF_ZOOM });
    setStep("outline");
  }

  function near() {
    if (!map) return undefined;
    const centre = map.getCenter();
    return { lon: centre.lng, lat: centre.lat };
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-ground text-text type-body-touch desktop:type-body">
      <div className={STAGE}>
        {state.kind === "ready" && PROVIDER && webGL ? (
          <RoofMap
            imagery={PROVIDER.imagery}
            view={view}
            onState={(at) => setTilesFailed(at === "failed")}
            onMap={setMap}
            outline={{ state: outline, tool: step === "outline" ? tool : null, on }}
            className="h-full"
          />
        ) : state.kind !== "ready" ? (
          <NoMap state={state} />
        ) : null}
      </div>

      <div className={OVER_THE_STAGE}>
        <div className="pointer-events-auto absolute top-3 right-3 left-3 flex items-center gap-2 tablet:top-5 tablet:right-5 tablet:left-5 tablet:gap-2.5 desktop:right-auto">
          <Link href="/" aria-label="Back to home" className={FLOATING_BUTTON}>
            <Icon name="arrow-left" size={18} />
          </Link>
          <Search provider={PROVIDER} near={near} onPlace={onPlace} found={foundAt?.label ?? null} className="min-w-0 grow desktop:w-100 desktop:grow-0" />
          <Steps current={step} className="hidden tablet:flex" />
        </div>
        {/* The phone has no buttons: the map is pinched and turned by hand. */}
        <MapButtons map={map} className="pointer-events-auto absolute right-5 bottom-7 hidden tablet:flex desktop:right-0" />
        {step === "outline" ? (
          <OutlineTools state={outline} tool={tool} onTool={setTool} on={on} className="pointer-events-auto absolute bottom-16 left-1/2 -translate-x-1/2 tablet:bottom-22 desktop:bottom-7" />
        ) : null}
      </div>

      <aside
        aria-label={words.title}
        className="absolute inset-x-0 bottom-0 flex h-96 flex-col gap-3 rounded-t-panel border-t border-line bg-chrome px-4 pt-2 pb-5 tablet:px-5 desktop:inset-x-auto desktop:top-5 desktop:right-5 desktop:bottom-5 desktop:h-auto desktop:w-find-panel desktop:gap-5 desktop:rounded-panel desktop:border desktop:p-card desktop:shadow-panel"
      >
        <span className="flex justify-center desktop:hidden">
          <span className="h-1 w-10 rounded-full bg-line-strong" />
        </span>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-3">
            <h1 className="type-lens-touch desktop:type-lens">{words.title}</h1>
            <span className="ml-auto type-small text-text-2 desktop:hidden">Step {["find", "outline", "build"].indexOf(step) + 1} of 3</span>
          </div>
          <p className="text-text-2">{words.lead}</p>
        </div>
        {step === "outline" ? <OutlinePanel state={outline} on={on} /> : null}
      </aside>
    </div>
  );
}
