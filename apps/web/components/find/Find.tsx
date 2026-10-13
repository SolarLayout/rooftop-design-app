"use client";

import { HelpDisc } from "@/components/shell/help/HelpDisc";
import { HelpProvider } from "@/components/shell/help/HelpProvider";
import type { Map as MapLibre } from "maplibre-gl";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { useProject, useStores } from "@/components/shell/stores";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { measures } from "@/components/ui/measures";
import { classNames } from "@/components/ui/class-names";
import { Sheet } from "@/components/ui/Sheet";
import type { Stop } from "@/components/ui/sheet-stops";
import { StatusMark } from "@/components/ui/StatusMark";
import { ROOF_ZOOM } from "@/components/ui/design-numbers";
import type { Box } from "@/components/ui/place-floating";
import { api, ApiError } from "@/lib/api";
import { roofAfterBuild } from "@/lib/geometry/roof-type-rule";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/places/esri";
import { FOOTPRINTS_ATTRIBUTION } from "@/lib/map/overture";
import { mapStateOf } from "@/lib/map/map-state";
import { buildRequestOf } from "@/lib/outline/build-request";
import { isEntered, NOTHING_ENTERED, type ByHand } from "@/lib/outline/by-hand";
import { buildLabelOf, edgesFactsOf, findHeadOf, MAP_LINE, type FindStage } from "@/lib/outline/find-head";
import { frameAt, toLonLat, toMetres, type Frame } from "@/lib/outline/frame";
import { isRound, obstaclesOfMap, type Shape } from "@/lib/outline/obstacles";
import { firstKnownOf } from "@/lib/help/keys";
import { HELP_KEYS } from "@/lib/help/manifest.gen";
import { entryAfterPlace, EXAMPLES, type Entry } from "@/lib/outline/first-step";
import { footprintNoteStays } from "@/lib/outline/footprint-note";
import { howTosOf, type Tool } from "@/lib/outline/how-to";
import { isClosedAndSettled, measurementsOf, outlineAfter, START } from "@/lib/outline/outline-state";
import { showsMapLineOf, tipDoneBy, type TipId } from "@/lib/outline/tips";
import { rememberTipsGone, tipsGoneOf } from "@/lib/device/tips-seen";
import { isByHandAsked, pathOfLens, placeOfFindAddress } from "@/lib/routes";
import { latitudeOf, longitudeOf, projectOf } from "@/lib/stores/project-store";
import { stepStatesOf } from "@/lib/flow/steps";
import { StepTabBar } from "@/components/shell/StepNav";
import { SummaryRow } from "@/components/shell/SummaryRow";
import { useSize } from "@/components/shell/use-screen-size";
import { useShareUnder } from "@/components/shell/use-share-under";
import { usePhoneSheet } from "@/components/shell/use-phone-sheet";
import { Search, type FoundPlace, type SearchHandle } from "@/components/shell/Search";
import type { RoofType } from "@/lib/geometry/roof-types";
import { ByHandPanel } from "./ByHandPanel";
import { DetectedCallout } from "./DetectedCallout";
import { FindBar } from "./FindBar";
import { FirstStep } from "./FirstStep";
import { HeightDialog } from "./HeightDialog";
import { MapButtons } from "./MapButtons";
import { ObstacleList } from "./ObstacleList";
import type { Detected } from "./OutlineLayer";
import { OutlinePanel } from "./OutlinePanel";
import { isObstacleTool, OutlineTools, toolFor } from "./OutlineTools";
import { PlanView } from "./PlanView";
import { RoofTypeChoice } from "./RoofTypeChoice";
import type { MapView } from "./RoofMap";
import { useOutlineKeys } from "./use-outline-keys";
import { useWebGL } from "./use-web-gl";

// On Find there is no design yet: Roof is in hand, the steps after it cannot be gone to (D95).
const ON_FIND = stepStatesOf({ current: "roof", seen: [], waiting: [], hasDesign: false });

// The map draws with WebGL in the browser alone: it is loaded there, never on the server.
const RoofMap = dynamic(() => import("./RoofMap").then((module) => module.RoofMap), { ssr: false });

const PROVIDER = esriProvider(KEY_OF_THE_APP);

/** Before a roof is found the map shows India, where the first users are, from far. */
const FROM_FAR: MapView = { lon: 78.5, lat: 21.5, zoom: 4 };

/** What Build does, under it. */
const BUILD_LINE = "Opens the roof in 3D with the array on it.";

type Building = { kind: "idle" } | { kind: "building" } | { kind: "failed"; message: string };

/** The device's storage, or null where reaching it is refused (a private window, blocked site data). */
function deviceStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Where a shape stands on the screen: the box about its points, or about a round one's edge. */
function anchorOf(map: MapLibre, frame: Frame, shape: Shape): Box {
  const radius = isRound(shape.kind) ? (shape.diameter ?? 0) / 2 : 0;
  const around = shape.points.flatMap(({ x, y }) => (radius > 0 ? [{ x: x - radius, y: y - radius }, { x: x + radius, y: y + radius }] : [{ x, y }]));
  const room = map.getContainer().getBoundingClientRect();
  const onScreen = around.map((point) => map.project(toLonLat(frame, point)));
  const xs = onScreen.map(({ x }) => x);
  const ys = onScreen.map(({ y }) => y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  return { left: room.left + left, top: room.top + top, width: Math.max(...xs) - left, height: Math.max(...ys) - top };
}

/**
 * Find the roof on the map and outline it, then Build (V2 · 4, D98; the board "Find"). Find takes the Studio's work column:
 * its head follows the step (Find the roof, Outline the roof, Add what stands on the roof, Enter the roof by hand); the
 * search is the first thing in it; the tools carry their words; the roof type is a question once the outline is closed;
 * Build this roof stands pinned at the column's foot, the sheet's on touch, from the closed outline on. The column comes
 * first for the keyboard, its primary last in it, then the map's controls.
 */
export function Find() {
  const router = useRouter();
  const params = useSearchParams();
  const isEditing = params.get("edit") === "roof";
  // From Home's search (plan/phase-10-plan.md, step 11): the screen begins as if the place had just been found here.
  const [placeAsked] = useState(() => placeOfFindAddress(params));
  const { project: store } = useStores();
  const project = useProject(projectOf);
  const latitude = useProject(latitudeOf);
  const longitude = useProject(longitudeOf);
  const webGL = useWebGL();
  const size = useSize();
  const [tilesFailed, setTilesFailed] = useState(false);
  const [map, setMap] = useState<MapLibre | null>(null);
  const [step, setStep] = useState<"find" | "outline" | "build">(placeAsked ? "outline" : "find");
  const [foundAt, setFoundAt] = useState<FoundPlace | null>(placeAsked);
  const [outline, on] = useReducer(outlineAfter, START);
  const [toolTaken, setTool] = useState<Tool>("corners");
  // The tools follow the roof: closed (and no drag going on), an obstacle is drawn; opened again, the outline is.
  const roofClosed = isClosedAndSettled(outline);
  const tool: Tool = roofClosed === isObstacleTool(toolTaken) ? toolTaken : toolFor(roofClosed);
  const [detected, setDetected] = useState<Detected | null>(null);
  const [roofType, setRoofType] = useState<RoofType>("flat_tilted");
  const [building, setBuilding] = useState<Building>({ kind: "idle" });
  const [entry, setEntry] = useState<Entry>("map");
  const [hand, setHand] = useState<ByHand>(placeAsked ? { ...NOTHING_ENTERED, lat: placeAsked.lat, lon: placeAsked.lon } : NOTHING_ENTERED);
  const loaded = useRef(false);
  // The line on the map for the first outline: gone for good on this device once the roof is moved or turned.
  const [linesGone, setLinesGone] = useState<ReadonlySet<TipId>>(() => {
    const storage = deviceStorage();
    return storage ? tipsGoneOf(storage) : new Set();
  });
  const [touch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const outlineBefore = useRef(outline);
  const search = useRef<SearchHandle>(null);
  const room = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [stop, setStop] = useState<Stop>("half");
  // On tablet the sheet at half meets the foot of the map; on phone it holds the step at every stop (V2 · 10).
  const half = useShareUnder(room, stage, size === "tablet");
  const shares = usePhoneSheet(room, size === "phone");
  // The map begins at the place asked for in the address, else at the roof of the design that is open; without either, from far.
  const [view, setView] = useState<MapView>(() => {
    if (placeAsked) return { lon: placeAsked.lon, lat: placeAsked.lat, zoom: ROOF_ZOOM };
    return latitude === null || longitude === null ? FROM_FAR : { lon: longitude, lat: latitude, zoom: ROOF_ZOOM };
  });

  const state = useMemo(() => mapStateOf({ hasKey: PROVIDER !== null, hasWebGL: webGL ?? true, tilesFailed }), [webGL, tilesFailed]);
  const hasMap = state.kind === "ready" && PROVIDER !== null && Boolean(webGL);
  // Without a map the roof is entered by hand: the column opens on it, with why.
  const byHand = entry === "hand" || state.kind !== "ready";
  const onTheMap = step === "outline" && !byHand;
  const area = measurementsOf(outline).area;
  const stageNow: FindStage = step === "find" && !byHand ? "find" : byHand ? "hand" : outline.closed ? "closed" : "outline";
  const head = findHeadOf({ stage: stageNow, touch, area, corners: outline.corners.length });
  useOutlineKeys(onTheMap && outline.pending === null, on);

  // The line goes for good once its move is done.
  useEffect(() => {
    const done = tipDoneBy(outlineBefore.current, outline);
    outlineBefore.current = outline;
    if (!done || linesGone.has(done)) return;
    const gone = new Set([...linesGone, done]);
    setLinesGone(gone);
    const storage = deviceStorage();
    if (storage) rememberTipsGone(storage, gone);
  }, [outline, linesGone]);
  const showsLine = onTheMap && hasMap && showsMapLineOf(outline, linesGone);
  // The ? beside the title (D81): the how-to of what the hand can do now, the first that has a topic.
  const howTo = stageNow === "find" ? firstKnownOf(["find.tool.find-the-roof"], HELP_KEYS) : onTheMap ? firstKnownOf(howTosOf(outline, tool).map((id) => `find.tool.${id}`), HELP_KEYS) : null;

  /** What is entered by hand changes: the roof follows it, at the place, once enough is there. */
  function changeHand(change: Partial<ByHand>, isByHand: boolean = byHand) {
    const next = { ...hand, ...change };
    setHand(next);
    if (!isByHand || next.lat === null || next.lon === null) return;
    on({ type: "entered", at: { lat: next.lat, lon: next.lon }, corners: isEntered(next)?.corners ?? [] });
  }

  /** The roof by its measurements: the place is the one found, or where the roof drawn stands. */
  function enterByHand() {
    setEntry("hand");
    setStep("outline");
    setDetected(null);
    const at = foundAt ?? (outline.frame ? { lat: outline.frame.centre.lat, lon: outline.frame.centre.lon } : null);
    changeHand({ lat: hand.lat ?? at?.lat ?? null, lon: hand.lon ?? at?.lon ?? null }, true);
  }

  // From Home's "Enter the roof by hand" (V2 · 9): Find opens on the by-hand entry, once.
  const isByHandFromHome = useRef(isByHandAsked(params));
  useEffect(() => {
    if (!isByHandFromHome.current) return;
    isByHandFromHome.current = false;
    enterByHand();
  });

  // Edit from the Roof step: the outline of the design that is open is shown on the map, where it is.
  useEffect(() => {
    if (!isEditing || !project || loaded.current) return;
    loaded.current = true;
    const control = new AbortController();
    api.roofOnMap(project.roof, { signal: control.signal }).then(
      (onMap) => {
        const at = { lon: project.roof.lon, lat: project.roof.lat };
        const frame = frameAt(at);
        on({ type: "loaded", at, corners: onMap.outline.map(([lon, lat]) => toMetres(frame, { lon, lat })), obstacles: obstaclesOfMap(onMap.obstacles, frame) });
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
    const request = buildRequestOf(outline, roofType, foundAt, byHand ? "coordinates" : "map");
    if (!request) return;
    setBuilding({ kind: "building" });
    try {
      const answer = await api.roofFromMap(request);
      if (isEditing && project) {
        store.getState().commit((design) => ({ ...design, roof: roofAfterBuild(design.roof, answer.roof) }));
      } else {
        store.getState().open(answer);
      }
      setStep("build");
      router.push(pathOfLens("roof"));
    } catch (error) {
      setBuilding({ kind: "failed", message: error instanceof ApiError ? error.message : "The roof could not be built. Try again." });
    }
  }

  /** A place was found: the map flies to it at roof zoom and the outline can begin; without a map the roof is entered by hand there. */
  function onPlace(place: FoundPlace) {
    const next = byHand ? "hand" : entryAfterPlace(hasMap);
    setFoundAt(place);
    setView({ lon: place.lon, lat: place.lat, zoom: ROOF_ZOOM });
    setEntry(next);
    setStep("outline");
    changeHand({ lat: place.lat, lon: place.lon }, next === "hand");
  }

  function near() {
    if (!map) return undefined;
    const centre = map.getCenter();
    return { lon: centre.lng, lat: centre.lat };
  }

  function takeTool(taken: Tool) {
    setTool(taken);
    setDetected(null);
    // Another tool is taken to draw: the roof picked up is let go.
    on({ type: "roofPicked", picked: false });
  }

  const roofLatitude = outline.frame?.centre.lat ?? hand.lat ?? latitude ?? view.lat;
  const showsFoot = stageNow === "closed" || stageNow === "hand";
  const foot: ReactNode = showsFoot ? (
    <div className="flex flex-col gap-2">
      {building.kind === "failed" ? (
        <p role="status" className="flex items-start gap-2 type-body-touch text-text-2 desktop:type-body">
          <StatusMark kind="note" label="Note" wordsShown={false} size={16} />
          {building.message}
        </p>
      ) : null}
      <Button kind="primary" size="xl" icon="arrow-right" disabled={!outline.closed || building.kind === "building"} onClick={build} className="w-full flex-row-reverse" data-testid="build">
        {building.kind === "building" ? (
          <>
            <ProgressRing size={16} />
            Building the roof
          </>
        ) : (
          buildLabelOf(outline.closed ? area : null)
        )}
      </Button>
      <p className="type-body-touch text-text-2 desktop:type-body">{BUILD_LINE}</p>
    </div>
  ) : null;

  const column =
    size === null ? null : (
      <div className="flex flex-col gap-group">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5">
            <h1 className="type-heading text-text">{head.title}</h1>
            {howTo ? <HelpDisc topic={howTo} /> : null}
          </span>
          <p className="text-text-2">{head.line}</p>
        </div>
        {state.kind !== "ready" ? (
          <div role="status" className="flex items-start gap-2.5 rounded-row border border-line bg-surface-1 px-3.5 py-3">
            <StatusMark kind="note" label="Note" wordsShown={false} size={16} className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{state.title}</span>
              <span className="type-body-touch text-text-2 desktop:type-body">{state.reason}</span>
            </span>
          </div>
        ) : null}
        {stageNow === "find" ? (
          <FirstStep
            search={<Search ref={search} provider={PROVIDER} near={near} onPlace={onPlace} found={foundAt?.label ?? null} look="column" examples={EXAMPLES} />}
            onWay={(way) => (way === "locate" ? search.current?.locate() : enterByHand())}
          />
        ) : null}
        {stageNow === "outline" ? <OutlineTools state={outline} tool={tool} onTool={takeTool} on={on} /> : null}
        {stageNow === "closed" ? (
          <>
            <ObstacleList state={outline} tool={tool} onTool={takeTool} on={on} />
            <RoofTypeChoice value={roofType} onChange={setRoofType} latitude={roofLatitude} />
            <SummaryRow id="find.edges" title="Edges" help="find.section.edges" facts={edgesFactsOf(outline)} setBy={null}>
              <OutlinePanel state={outline} on={on} />
            </SummaryRow>
          </>
        ) : null}
        {stageNow === "hand" ? (
          <>
            <ByHandPanel hand={hand} onChange={(change) => changeHand(change)} />
            <RoofTypeChoice value={roofType} onChange={setRoofType} latitude={roofLatitude} />
          </>
        ) : null}
        {stageNow === "outline" || stageNow === "closed" ? (
          <Button kind="quiet" size="m" icon="pencil" onClick={enterByHand} className="self-start">
            Enter the roof by hand
          </Button>
        ) : stageNow === "hand" && hasMap ? (
          <Button kind="quiet" size="m" onClick={() => setEntry("map")} className="self-start">
            Draw on the map instead
          </Button>
        ) : null}
      </div>
    );

  return (
    <HelpProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-ground text-text type-body-touch desktop:type-body">
        <FindBar name={isEditing && project ? project.name : "New design"} states={ON_FIND} />
        <div ref={room} className="relative flex min-h-0 grow flex-col desktop:flex-row-reverse">
          {/* The column comes first for the keyboard; on desktop it stands at the right. */}
          <aside aria-label={head.title} className="hidden desktop:flex desktop:w-inspector desktop:shrink-0 desktop:flex-col desktop:border-l desktop:border-line-subtle desktop:bg-chrome">
            {size === "desktop" ? (
              <>
                <div className="min-h-0 grow overflow-y-auto px-panel pt-6 pb-6">{column}</div>
                {foot ? <div className="shrink-0 border-t border-line-subtle px-panel pt-3 pb-safe-panel">{foot}</div> : null}
              </>
            ) : null}
          </aside>
          {size !== null && size !== "desktop" ? (
            <Sheet label={head.title} stop={stop} onStop={setStop} half={half} shares={shares} foot={foot}>
              <div className="px-4 pt-2 pb-6 tablet:px-5">{column}</div>
            </Sheet>
          ) : null}
          <div
            ref={stage}
            className={classNames("relative shrink-0 tablet:h-110 desktop:h-auto desktop:min-w-0 desktop:shrink desktop:grow", shares ? "h-span sheet-motion" : "h-stage-phone")}
            style={measures(shares ? { span: 1 - shares[stop] } : {})}
          >
            {state.kind === "ready" && PROVIDER && webGL && !byHand ? (
              <RoofMap
                imagery={PROVIDER.imagery}
                view={view}
                onState={(at) => setTilesFailed(at === "failed")}
                onMap={setMap}
                outline={{ state: outline, tool: onTheMap ? tool : null, on, onDetected: setDetected }}
                moreAttribution={onTheMap && tool === "detect" ? FOOTPRINTS_ATTRIBUTION : null}
                className="h-full"
              />
            ) : (
              <PlanView corners={outline.corners} />
            )}
            {showsLine ? (
              <p className="pointer-events-none absolute top-4 left-1/2 z-stage-overlay -translate-x-1/2 rounded-control bg-surface-1 px-3 py-1.5 whitespace-nowrap shadow-float">{MAP_LINE}</p>
            ) : null}
            {/* The phone has no buttons: the map is pinched and turned by hand. */}
            {map && !byHand ? <MapButtons map={map} className="absolute right-5 bottom-7 z-stage-overlay hidden tablet:flex" /> : null}
            {detected && footprintNoteStays(detected.found ? detected.taken : null, outline.corners) ? (
              <DetectedCallout
                detected={detected}
                // The note stands while the outline is the footprint: its Undo takes back the footprint and nothing else.
                onUndo={() => {
                  on({ type: "undone" });
                  setDetected(null);
                }}
                // The footprint stays and its corners drag, as the corners of any closed roof do.
                onClose={() => setDetected(null)}
              />
            ) : null}
          </div>
        </div>
        <StepTabBar current="roof" states={ON_FIND} />
      </div>
      {onTheMap ? (
        <HeightDialog
          shape={outline.pending}
          anchor={map && outline.frame && outline.pending ? anchorOf(map, outline.frame, outline.pending) : null}
          onAdd={(height) => on({ type: "heightGiven", name: "", height })}
          onDiscard={() => on({ type: "pendingDiscarded" })}
        />
      ) : null}
    </HelpProvider>
  );
}
