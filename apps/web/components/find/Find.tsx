"use client";

import type { Map as MapLibre } from "maplibre-gl";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useProject, useStores } from "@/components/shell/stores";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusMark } from "@/components/ui/StatusMark";
import { Tooltip } from "@/components/ui/Tooltip";
import { iconButtonLook } from "@/components/ui/button-look";
import { classNames } from "@/components/ui/class-names";
import { ROOF_ZOOM } from "@/components/ui/design-numbers";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError, type Project } from "@/lib/api";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/map/esri";
import { FOOTPRINTS_ATTRIBUTION } from "@/lib/map/overture";
import { mapStateOf } from "@/lib/map/map-state";
import { buildRequestOf } from "@/lib/outline/build-request";
import { frameAt, toMetres } from "@/lib/outline/frame";
import { outlineAfter, START } from "@/lib/outline/outline-state";
import { pathOfLens } from "@/lib/routes";
import { latitudeOf, longitudeOf, projectOf } from "@/lib/stores/project-store";
import { MapButtons } from "./MapButtons";
import { DetectedCallout } from "./DetectedCallout";
import { NoMap } from "./NoMap";
import type { Detected, Tool } from "./OutlineLayer";
import { OutlinePanel } from "./OutlinePanel";
import { OutlineTools } from "./OutlineTools";
import { RoofTypeChoice, type RoofType } from "./RoofTypeChoice";
import { WHY_NOT_BY_HAND } from "./NoMap";
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

const WORDS: Record<Step | "rectangle" | "detect", { title: string; lead: string }> = {
  find: { title: "Find the roof", lead: "Search an address or a place, or paste coordinates or a maps link. The map flies to it." },
  outline: { title: "Outline the roof", lead: "Click each corner. Drag a corner to adjust it, or type a length you have measured." },
  rectangle: { title: "Outline the roof", lead: "Drag a box across the roof, then turn it to the building by its handle. Drag a corner to adjust it." },
  detect: { title: "Outline the roof", lead: "Click inside the building. Where its footprint is known, it is proposed as the outline, to accept or adjust." },
  build: { title: "Build the roof", lead: "The roof rises in the Studio; the array fills it at once." },
};

// On phone and tablet the panel is a sheet of 384 at the bottom; the map ends above it.
const STAGE = "absolute inset-x-0 top-0 bottom-96 desktop:bottom-0";
const OVER_THE_STAGE = "pointer-events-none absolute inset-x-0 top-0 bottom-96 desktop:bottom-0 desktop:right-find-stage-inset";
const FLOATING_BUTTON = classNames(iconButtonLook("secondary", "l", "square"), "size-12 rounded-card-s bg-surface-1 shadow-float");

type Building = { kind: "idle" } | { kind: "building" } | { kind: "failed"; message: string };

/** Find the roof on the map and outline it: the flagship (plan/phase-04-find-and-outline.md). */
export function Find() {
  const router = useRouter();
  const isEditing = useSearchParams().get("edit") === "roof";
  const { project: store } = useStores();
  const project = useProject(projectOf);
  const latitude = useProject(latitudeOf);
  const longitude = useProject(longitudeOf);
  const webGL = useWebGL();
  const [tilesFailed, setTilesFailed] = useState(false);
  const [map, setMap] = useState<MapLibre | null>(null);
  const [step, setStep] = useState<Step>("find");
  const [foundAt, setFoundAt] = useState<FoundPlace | null>(null);
  const [outline, on] = useReducer(outlineAfter, START);
  const [tool, setTool] = useState<Tool>("corners");
  const [detected, setDetected] = useState<Detected | null>(null);
  const [roofType, setRoofType] = useState<RoofType>("flat_tilted");
  const [building, setBuilding] = useState<Building>({ kind: "idle" });
  const loaded = useRef(false);
  // The map begins at the roof of the design that is open; without one, from far.
  const [view, setView] = useState<MapView>(() =>
    latitude === null || longitude === null ? FROM_FAR : { lon: longitude, lat: latitude, zoom: ROOF_ZOOM },
  );

  const state = useMemo(
    () => mapStateOf({ hasKey: PROVIDER !== null, hasWebGL: webGL ?? true, tilesFailed }),
    [webGL, tilesFailed],
  );
  const words = WORDS[step === "outline" && tool !== "corners" ? tool : step];
  useOutlineKeys(step === "outline", on);

  // Edit from the Roof lens: the outline of the design that is open is shown on the map, where it is.
  useEffect(() => {
    if (!isEditing || !project || loaded.current) return;
    loaded.current = true;
    const control = new AbortController();
    api.roofOnMap(project.roof, { signal: control.signal }).then(
      (onMap) => {
        const at = { lon: project.roof.lon, lat: project.roof.lat };
        const frame = frameAt(at);
        on({ type: "loaded", at, corners: onMap.outline.map(([lon, lat]) => toMetres(frame, { lon, lat })) });
        setRoofType(project.roof.roof_type);
        setView({ lon: at.lon, lat: at.lat, zoom: ROOF_ZOOM });
        setStep("outline");
      },
      (error: unknown) => {
        if (control.signal.aborted) return;
        setBuilding({ kind: "failed", message: error instanceof ApiError ? error.message : "The outline could not be shown on the map." });
        setStep("outline");
      },
    );
    return () => control.abort();
  }, [isEditing, project]);

  /** Build this roof: the document from the API, opened as the design, or its roof put into the design that is edited. */
  async function build() {
    const request = buildRequestOf(outline, roofType, foundAt);
    if (!request) return;
    setBuilding({ kind: "building" });
    try {
      const answer = await api.roofFromMap(request);
      if (isEditing && project) {
        store.getState().commit((design) => ({ ...design, roof: { ...design.roof, ...roofOf(answer) } }));
      } else {
        store.getState().open(answer);
      }
      setStep("build");
      router.push(pathOfLens("roof"));
    } catch (error) {
      setBuilding({ kind: "failed", message: error instanceof ApiError ? error.message : "The roof could not be built. Try again." });
    }
  }

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
            outline={{ state: outline, tool: step === "outline" ? tool : null, on, onDetected: setDetected }}
            moreAttribution={step === "outline" && tool === "detect" ? FOOTPRINTS_ATTRIBUTION : null}
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
          <OutlineTools
            state={outline}
            tool={tool}
            onTool={(taken) => {
              setTool(taken);
              setDetected(null);
            }}
            on={on}
            className="pointer-events-auto absolute bottom-16 left-1/2 -translate-x-1/2 tablet:bottom-22 desktop:bottom-7"
          />
        ) : null}
        {detected ? (
          <div className="pointer-events-auto">
            <DetectedCallout
              detected={detected}
              onUse={() => setDetected(null)}
              onAdjust={() => {
                setDetected(null);
                setTool("corners");
              }}
              onClose={() => setDetected(null)}
            />
          </div>
        ) : null}
      </div>

      <aside
        aria-label={words.title}
        className="absolute inset-x-0 bottom-0 flex h-96 flex-col gap-3 overflow-y-auto rounded-t-panel border-t border-line bg-chrome px-4 pt-2 pb-5 tablet:px-5 desktop:inset-x-auto desktop:top-5 desktop:right-5 desktop:bottom-5 desktop:h-auto desktop:w-find-panel desktop:gap-5 desktop:rounded-panel desktop:border desktop:p-card desktop:shadow-panel"
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
        {step === "outline" ? (
          <>
            <OutlinePanel state={outline} on={on} />
            <section className="flex flex-col gap-2.5">
              <h2 className="hidden type-section text-text-3 uppercase desktop:block">Roof type</h2>
              <RoofTypeChoice value={roofType} onChange={setRoofType} />
            </section>
            <div className="mt-auto flex flex-col gap-2.5">
              {building.kind === "failed" ? (
                <p role="status" className="flex items-start gap-2 type-small text-text-2">
                  <StatusMark kind="note" label="Note" wordsShown={false} size={16} />
                  {building.message}
                </p>
              ) : null}
              <Button kind="primary" size="xl" icon="arrow-right" disabled={!outline.closed || building.kind === "building"} onClick={build} className="w-full">
                {building.kind === "building" ? (
                  <>
                    <ProgressRing size={16} />
                    Building the roof
                  </>
                ) : (
                  "Build this roof"
                )}
              </Button>
              <Tooltip words={WHY_NOT_BY_HAND}>
                <Button kind="quiet" size="l" aria-disabled="true" className="w-full">
                  Enter dimensions by hand instead
                </Button>
              </Tooltip>
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
}

/** What of a built document goes into a design that is edited: its geometry, its source, its type. */
function roofOf(answer: Project): Pick<Project["roof"], "outline" | "lat" | "lon" | "obstacles" | "source" | "roof_type"> {
  const { outline, lat, lon, obstacles, source, roof_type } = answer.roof;
  return { outline, lat, lon, obstacles, source, roof_type };
}
