"use client";

import { SectionHeading } from "@/components/shell/help/SectionHeading";
import { HelpDisc } from "@/components/shell/help/HelpDisc";
import { HelpProvider } from "@/components/shell/help/HelpProvider";
import { ShowMeHow, TipsAgainProvider } from "@/components/shell/help/ways-in";
import type { Map as MapLibre } from "maplibre-gl";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Tip } from "@/components/ui/Tip";
import { useProject, useStores } from "@/components/shell/stores";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusMark } from "@/components/ui/StatusMark";
import { iconButtonLook } from "@/components/ui/button-look";
import { classNames } from "@/components/ui/class-names";
import { ROOF_ZOOM } from "@/components/ui/design-numbers";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError, type MapShapeRequest } from "@/lib/api";
import { roofAfterBuild } from "@/lib/geometry/roof-type-rule";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/places/esri";
import { FOOTPRINTS_ATTRIBUTION } from "@/lib/map/overture";
import { mapStateOf } from "@/lib/map/map-state";
import { buildRequestOf } from "@/lib/outline/build-request";
import { isEntered, NOTHING_ENTERED, type ByHand } from "@/lib/outline/by-hand";
import { frameAt, toMetres } from "@/lib/outline/frame";
import { nameOf, obstaclesOfMap, treesOfMap } from "@/lib/outline/obstacles";
import { firstKnownOf } from "@/lib/help/keys";
import { HELP_KEYS } from "@/lib/help/manifest.gen";
import { entryAfterPlace, firstStepOf, type Entry } from "@/lib/outline/first-step";
import { howTosOf, type HowTo, type Tool } from "@/lib/outline/how-to";
import { isClosedAndSettled, outlineAfter, START } from "@/lib/outline/outline-state";
import { TIPS, tipDoneBy, tipShownOf, type TipId } from "@/lib/outline/tips";
import { rememberTipsGone, tipsGoneOf } from "@/lib/device/tips-seen";
import { pathOfLens, placeOfFindAddress } from "@/lib/routes";
import { latitudeOf, longitudeOf, projectOf } from "@/lib/stores/project-store";
import { MapButtons } from "./MapButtons";
import { ByHandPanel } from "./ByHandPanel";
import { DetectedCallout } from "./DetectedCallout";
import { HeightDialog } from "./HeightDialog";
import { FirstStep } from "./FirstStep";
import { NoMap } from "./NoMap";
import { ObstacleList } from "./ObstacleList";
import type { Detected } from "./OutlineLayer";
import { OutlinePanel } from "./OutlinePanel";
import { isObstacleTool, OutlineTools, toolFor } from "./OutlineTools";
import { PlanView } from "./PlanView";
import { RoofTypeChoice } from "./RoofTypeChoice";
import type { RoofType } from "@/lib/geometry/roof-types";
import type { MapView } from "./RoofMap";
import { Search, type FoundPlace, type SearchHandle } from "@/components/shell/Search";
import { Steps, type Step } from "./Steps";
import { useOutlineKeys } from "./use-outline-keys";
import { useWebGL } from "./use-web-gl";

// The map draws with WebGL in the browser alone: it is loaded there, never on the server.
const RoofMap = dynamic(() => import("./RoofMap").then((module) => module.RoofMap), { ssr: false });

const PROVIDER = esriProvider(KEY_OF_THE_APP);

/** Before a roof is found the map shows India, where the first users are, from far. */
const FROM_FAR: MapView = { lon: 78.5, lat: 21.5, zoom: 4 };

/** The how-to of a tip's move (D81): Show me how opens it, once it is written. */
const HOW_TO_OF_TIP: Readonly<Record<TipId, HowTo>> = { roof: "move-the-roof", obstacle: "move-an-obstacle" };

// The first step's words are its panel's (D85), with a map or without one.
const WORDS: Record<Exclude<Step, "find"> | Exclude<Tool, "corners"> | "hand", { title: string; lead: string }> = {
  outline: { title: "Outline the roof", lead: "Click each corner. Drag a corner to adjust it, or type a length you have measured." },
  rectangle: { title: "Outline the roof", lead: "Drag a box across the roof, then turn it to the building by its handle. Drag a corner to adjust it." },
  detect: { title: "Outline the roof", lead: "Click inside the building. Where its footprint is known, it is proposed as the outline, to accept or adjust." },
  box: { title: "Outline the roof", lead: "Drag a box across the thing on the roof, then turn it by its handle. Its height is asked right after." },
  tank: { title: "Outline the roof", lead: "Drag from the middle of the tank to its edge. Its height is asked right after." },
  wall: { title: "Outline the roof", lead: "Click each point of the wall; click the last again, or press Enter, to end it. Its height is asked right after." },
  building: { title: "Outline the roof", lead: "Click the corners of the building beside the roof; click the first again to close it. Its height is asked right after." },
  build: { title: "Build the roof", lead: "The roof rises in the Studio; the array fills it at once." },
  hand: { title: "Enter the roof by hand", lead: "Type what you have measured. The roof is drawn as you type; Faces is where its long side looks." },
};

// On phone and tablet the panel is a sheet of 384 at the bottom; the map ends above it.
const STAGE = "absolute inset-x-0 top-0 bottom-safe-96 desktop:bottom-0";
const OVER_THE_STAGE = "pointer-events-none absolute inset-x-0 top-0 bottom-safe-96 desktop:bottom-0 desktop:right-find-stage-inset";
const FLOATING_BUTTON = classNames(iconButtonLook("secondary", "l", "square"), "size-12 rounded-card-s bg-surface-1 shadow-float");

type Building = { kind: "idle" } | { kind: "building" } | { kind: "failed"; message: string };

/** The device's storage, or null where reaching it is refused (a private window, blocked site data). */
function deviceStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

// The tip is never over what is moved (components.md, "Tip"): on tablet and desktop at the map's edge, under the search;
// on phone, whose map above the sheet is too short to give a card room, at the top of the sheet, under the lead.
const TIP_OVER_THE_MAP = "pointer-events-auto absolute top-safe-22 left-5 hidden w-75 tablet:block";
const TIP_IN_THE_SHEET = "tablet:hidden";

/** Find the roof on the map and outline it: the flagship (plan/phase-04-find-and-outline.md). */
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
  const [tilesFailed, setTilesFailed] = useState(false);
  const [map, setMap] = useState<MapLibre | null>(null);
  const [step, setStep] = useState<Step>(placeAsked ? "outline" : "find");
  const [foundAt, setFoundAt] = useState<FoundPlace | null>(placeAsked);
  const [outline, on] = useReducer(outlineAfter, START);
  const [toolTaken, setTool] = useState<Tool>("corners");
  // The toolbar follows the roof: closed (and no drag going on), an obstacle is drawn; opened again, the outline is.
  const roofClosed = isClosedAndSettled(outline);
  const tool: Tool = roofClosed === isObstacleTool(toolTaken) ? toolTaken : toolFor(roofClosed);
  const [detected, setDetected] = useState<Detected | null>(null);
  const [roofType, setRoofType] = useState<RoofType>("flat_tilted");
  const [building, setBuilding] = useState<Building>({ kind: "idle" });
  const [entry, setEntry] = useState<Entry>("map");
  const [hand, setHand] = useState<ByHand>(placeAsked ? { ...NOTHING_ENTERED, lat: placeAsked.lat, lon: placeAsked.lon } : NOTHING_ENTERED);
  const loaded = useRef(false);
  // The trees of the roof edited: the map draws none, and they go back with the build where they stand (issue 179, item 1).
  const trees = useRef<MapShapeRequest[]>([]);
  // The tips (D79): gone for good on this device once Got it is pressed or their move is done; all hidden for this visit by the ×.
  const [tipsGone, setTipsGone] = useState<ReadonlySet<TipId>>(() => {
    const storage = deviceStorage();
    return storage ? tipsGoneOf(storage) : new Set();
  });
  const [tipsHidden, setTipsHidden] = useState(false);
  const [touch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const outlineBefore = useRef(outline);
  const search = useRef<SearchHandle>(null);
  // The map begins at the place asked for in the address, else at the roof of the design that is open; without either, from far.
  const [view, setView] = useState<MapView>(() => {
    if (placeAsked) return { lon: placeAsked.lon, lat: placeAsked.lat, zoom: ROOF_ZOOM };
    return latitude === null || longitude === null ? FROM_FAR : { lon: longitude, lat: latitude, zoom: ROOF_ZOOM };
  });

  const state = useMemo(
    () => mapStateOf({ hasKey: PROVIDER !== null, hasWebGL: webGL ?? true, tilesFailed }),
    [webGL, tilesFailed],
  );
  const hasMap = state.kind === "ready" && PROVIDER !== null && Boolean(webGL);
  const firstStep = firstStepOf(hasMap);
  const words =
    step === "find" ? { title: "Find the roof", lead: firstStep.lead } : WORDS[step === "outline" ? (entry === "hand" ? "hand" : tool !== "corners" ? tool : step) : step];
  useOutlineKeys(step === "outline" && entry === "map" && outline.pending === null, on);

  /** A tip gone for good, on this device. */
  function tipGone(id: TipId) {
    const gone = new Set([...tipsGone, id]);
    setTipsGone(gone);
    const storage = deviceStorage();
    if (storage) rememberTipsGone(storage, gone);
  }

  /** The ?: every tip shows again, from the first. */
  function showTips() {
    setTipsGone(new Set());
    setTipsHidden(false);
    const storage = deviceStorage();
    if (storage) rememberTipsGone(storage, new Set());
  }

  /** The card of a tip, in the words of the pointer or of touch, with the way into the how-to of its move. */
  function tipCard(id: TipId) {
    const tipHowTo = firstKnownOf([`find.tool.${HOW_TO_OF_TIP[id]}`], HELP_KEYS);
    return (
      <Tip
        key={id}
        title={TIPS[id].title}
        rows={touch ? TIPS[id].touch : TIPS[id].pointer}
        onGotIt={() => tipGone(id)}
        onClose={() => setTipsHidden(true)}
        howTo={tipHowTo ? <ShowMeHow topic={tipHowTo} /> : null}
      />
    );
  }

  // A tip goes by itself once its move is done.
  useEffect(() => {
    const done = tipDoneBy(outlineBefore.current, outline);
    outlineBefore.current = outline;
    if (done && !tipsGone.has(done)) tipGone(done);
  });
  const tip = step === "outline" && entry === "map" && hasMap && !tipsHidden ? tipShownOf(outline, tipsGone) : null;
  // The ? beside the title (D81): the how-to of what the hand can do now, the first that has a topic.
  const howTo =
    step === "find"
      ? firstKnownOf(["find.tool.find-the-roof"], HELP_KEYS)
      : step === "outline" && entry === "map"
        ? firstKnownOf(howTosOf(outline, tool).map((id) => `find.tool.${id}`), HELP_KEYS)
        : null;

  /** What is entered by hand changes: the roof follows it, at the place, once enough is there. */
  function changeHand(change: Partial<ByHand>, mode: Entry = entry) {
    const next = { ...hand, ...change };
    setHand(next);
    if (mode !== "hand" || next.lat === null || next.lon === null) return;
    on({ type: "entered", at: { lat: next.lat, lon: next.lon }, corners: isEntered(next)?.corners ?? [] });
  }

  /** The roof by its measurements: the place is the one found, or where the roof drawn stands. */
  function enterByHand() {
    setEntry("hand");
    setStep("outline");
    setDetected(null);
    const at = foundAt ?? (outline.frame ? { lat: outline.frame.centre.lat, lon: outline.frame.centre.lon } : null);
    changeHand({ lat: hand.lat ?? at?.lat ?? null, lon: hand.lon ?? at?.lon ?? null }, "hand");
  }

  // Edit from the Roof lens: the outline of the design that is open is shown on the map, where it is.
  useEffect(() => {
    if (!isEditing || !project || loaded.current) return;
    loaded.current = true;
    const control = new AbortController();
    api.roofOnMap(project.roof, { signal: control.signal }).then(
      (onMap) => {
        const at = { lon: project.roof.lon, lat: project.roof.lat };
        const frame = frameAt(at);
        on({ type: "loaded", at, corners: onMap.outline.map(([lon, lat]) => toMetres(frame, { lon, lat })), obstacles: obstaclesOfMap(onMap.obstacles, frame) });
        trees.current = treesOfMap(onMap.obstacles);
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
    const request = buildRequestOf(outline, roofType, foundAt, entry === "hand" ? "coordinates" : "map", trees.current);
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
    const next = entry === "hand" ? "hand" : entryAfterPlace(hasMap);
    setFoundAt(place);
    setView({ lon: place.lon, lat: place.lat, zoom: ROOF_ZOOM });
    setEntry(next);
    setStep("outline");
    changeHand({ lat: place.lat, lon: place.lon }, next);
  }

  function near() {
    if (!map) return undefined;
    const centre = map.getCenter();
    return { lon: centre.lng, lat: centre.lat };
  }

  return (
    <TipsAgainProvider showTips={showTips}>
      <HelpProvider>
        <div className="relative h-dvh overflow-hidden bg-ground text-text type-body-touch desktop:type-body">
          <div className={STAGE}>
            {state.kind === "ready" && PROVIDER && webGL ? (
              <RoofMap
                imagery={PROVIDER.imagery}
                view={view}
                onState={(at) => setTilesFailed(at === "failed")}
                onMap={setMap}
                outline={{ state: outline, tool: step === "outline" && entry === "map" ? tool : null, on, onDetected: setDetected }}
                moreAttribution={step === "outline" && entry === "map" && tool === "detect" ? FOOTPRINTS_ATTRIBUTION : null}
                className="h-full"
              />
            ) : entry === "hand" ? (
              <PlanView corners={outline.corners} reason={state.kind === "ready" ? null : state.reason} />
            ) : state.kind !== "ready" ? (
              <NoMap state={state} onByHand={enterByHand} />
            ) : null}
          </div>

          <div className={OVER_THE_STAGE}>
            <div className="pointer-events-auto absolute top-safe-3 right-3 left-3 flex items-center gap-2 tablet:top-safe-5 tablet:right-5 tablet:left-5 tablet:gap-2.5 desktop:right-auto">
              <Link href="/" aria-label="Back to home" className={FLOATING_BUTTON}>
                <Icon name="arrow-left" size={18} />
              </Link>
              <Search ref={search} provider={PROVIDER} near={near} onPlace={onPlace} found={foundAt?.label ?? null} className="min-w-0 grow desktop:w-100 desktop:grow-0" />
              <Steps current={step} className="hidden tablet:flex" />
            </div>
            {/* The phone has no buttons: the map is pinched and turned by hand. Without a map there is nothing to turn or zoom. */}
            {map ? <MapButtons map={map} className="pointer-events-auto absolute right-5 bottom-7 hidden tablet:flex desktop:right-0 desktop:bottom-safe-7" /> : null}
            {step === "outline" && entry === "map" ? (
              <OutlineTools
                state={outline}
                tool={tool}
                onTool={(taken) => {
                  setTool(taken);
                  setDetected(null);
                  // Another tool is taken to draw: the roof picked up is let go.
                  on({ type: "roofPicked", picked: false });
                }}
                on={on}
                onShowTips={showTips}
                className="pointer-events-auto absolute bottom-16 left-1/2 -translate-x-1/2 tablet:bottom-22 desktop:bottom-safe-7"
              />
            ) : null}
            {tip ? <div className={TIP_OVER_THE_MAP}>{tipCard(tip)}</div> : null}
            {detected ? (
              <div className="pointer-events-auto">
                <DetectedCallout
                  detected={detected}
                  onUse={() => setDetected(null)}
                  // The footprint stays and its corners drag, as the corners of any closed roof do.
                  onClose={() => setDetected(null)}
                />
              </div>
            ) : null}
          </div>

          {/* Outside the layer over the stage, which lets pointer events through: a dialog inherits that. */}
          {step === "outline" ? (
            <HeightDialog
              shape={outline.pending}
              suggestedName={outline.pending ? nameOf(outline.pending.kind, outline.obstacles) : ""}
              onAdd={(name, height) => on({ type: "heightGiven", name, height })}
              onDiscard={() => on({ type: "pendingDiscarded" })}
            />
          ) : null}

          <aside
            aria-label={words.title}
            className="absolute inset-x-0 bottom-0 flex h-safe-96 max-h-full flex-col gap-3 overflow-y-auto rounded-t-panel border-t border-line bg-chrome px-4 pt-2 pb-safe-5 tablet:px-5 desktop:inset-x-auto desktop:top-safe-5 desktop:right-5 desktop:bottom-safe-5 desktop:h-auto desktop:w-find-panel desktop:gap-5 desktop:rounded-panel desktop:border desktop:p-card desktop:shadow-panel"
          >
            <span className="flex justify-center desktop:hidden">
              <span className="h-1 w-10 rounded-full bg-line-strong" />
            </span>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                {/* The ? beside the title stands for the toolbar's on phone, which has room for Undo alone (D81). */}
                <span className="flex items-center gap-1.5">
                  <h1 className="type-lens-touch desktop:type-lens">{words.title}</h1>
                  {howTo ? <HelpDisc topic={howTo} /> : null}
                </span>
                <span className="ml-auto type-small text-text-2 desktop:hidden">Step {["find", "outline", "build"].indexOf(step) + 1} of 3</span>
              </div>
              <p className="text-text-2">{words.lead}</p>
            </div>
            {tip ? <div className={TIP_IN_THE_SHEET}>{tipCard(tip)}</div> : null}
            {step === "find" ? (
              <FirstStep
                panel={firstStep}
                onWay={(way) => (way === "search" ? search.current?.focus() : way === "locate" ? search.current?.locate() : enterByHand())}
                onExample={(text) => search.current?.put(text)}
              />
            ) : null}
            {step === "outline" ? (
              <>
                {entry === "hand" ? (
                  <ByHandPanel hand={hand} onChange={changeHand} state={outline} />
                ) : (
                  <>
                    <OutlinePanel state={outline} on={on} />
                    {outline.closed ? <ObstacleList state={outline} on={on} /> : null}
                  </>
                )}
                <section className="flex flex-col gap-2.5">
                  <SectionHeading help="app.section.roof-type" value={roofType} className="hidden desktop:flex">
                    Roof type
                  </SectionHeading>
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
                  {entry === "map" ? (
                    <Button kind="quiet" size="l" onClick={enterByHand} className="w-full">
                      Enter dimensions by hand instead
                    </Button>
                  ) : hasMap ? (
                    <Button kind="quiet" size="l" onClick={() => setEntry("map")} className="w-full">
                      Draw on the map instead
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}
          </aside>
        </div>
      </HelpProvider>
    </TipsAgainProvider>
  );
}

