"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Search, type FoundPlace } from "@/components/shell/Search";
import { ImportDrawing } from "@/components/shell/ImportDrawing";
import { Logo } from "@/components/shell/Logo";
import { useSaving, useStores } from "@/components/shell/stores";
import { classNames } from "@/components/ui/class-names";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Toaster } from "@/components/ui/Toaster";
import { api, type Project } from "@/lib/api";
import { demoRunOfText, rawDemoRunOf } from "@/lib/device/demo-run";
import { openFromTheSwitcher } from "@/lib/device/opening";
import { keptDesignsOf, listedAtOf } from "@/lib/device/saving";
import { failureOf } from "@/lib/flow/design-flow";
import { cardsOf, copyNameOf } from "@/lib/home/cards";
import { demoCardOf } from "@/lib/home/home-view";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/places/esri";
import { pathOfFind, pathOfLens } from "@/lib/routes";
import { lensOf } from "@/lib/stores/view-store";
import { DemoCard, type Demo } from "./DemoCard";
import { HomeIllustration } from "./HomeIllustration";
import { OnThisDevice } from "./OnThisDevice";
import { OPEN_A_PROJECT, OpenProject } from "@/components/shell/OpenProject";

/** The words of the approved board "Home". */
export const HEADLINE = ["Find your roof.", "Design it in 3D."] as const;
export const SUBTITLE = "Search the map, outline your roof, and get layout, shading, stringing and 8,760-hour energy yield on one live model.";
export const FIND_MY_ROOF = "Find my roof";

type Way = { id: "import" | "open"; title: string; detail: string; icon: IconName };

/** The two other ways to a design, under the search: rows of 76 as the board draws them. */
const WAYS: Way[] = [
  { id: "import", title: "Import a drawing", detail: "KMZ, KML or DXF with the roof and its obstacles", icon: "upload" },
  { id: "open", title: OPEN_A_PROJECT, detail: "A saved .rtd file, from this device or a colleague", icon: "folder" },
];

/** The demo as it was asked of the API: on its way, here as the API hands it out, or not come with the API's words. */
type Asked = { kind: "on-its-way" } | { kind: "here"; document: Project } | { kind: "failed"; words: string };

const PROVIDER = esriProvider(KEY_OF_THE_APP);
const nowhere = () => undefined;
/** The demo's run on this device never changes while Home is shown: nothing to hear. */
const nothingToHear = () => () => undefined;
const noRunOnTheServer = () => null;

const WAY = classNames(
  "flex min-h-19 w-full cursor-pointer items-center gap-4 rounded-bar border border-line bg-surface-1 px-5 py-3.5 text-left text-text",
  "press-motion focus-ring hovered:bg-surface-2 pressed:bg-control-pressed",
);
/** The page's padding at the sides: 16 on phone, 24 on tablet, 64 on desktop, as the boards have them. */
const SIDES = "px-4 tablet:px-6 desktop:px-16";

/**
 * Home (plan/phase-10-plan.md, step 11, decision 5; the boards "Home" on three sizes): the headline and the subtitle, the
 * search with "Find my roof" as its primary action (Find's own search: a place found or coordinates pasted lead to Find
 * at the place), Import a drawing and Open a project as rows, the demo's card, "On this device". Outside the shell: Home
 * has no top bar, the logo and the name stand at the top left. The 3D illustration of the board stands at the right on
 * desktop, as a strip under the subtitle on tablet, and not at all on phone.
 */
export function Home() {
  const router = useRouter();
  const { flow, view, toasts, saving, downloads } = useStores();
  const kept = useSaving(keptDesignsOf);
  const listedAt = useSaving(listedAtOf);
  const cards = useMemo(() => cardsOf(kept, listedAt), [kept, listedAt]);
  const [asked, setAsked] = useState<Asked>({ kind: "on-its-way" });
  const [isImportOpen, setImportOpen] = useState(false);
  const [isOpenProjectOpen, setOpenProjectOpen] = useState(false);
  const demoRunText = useSyncExternalStore(nothingToHear, () => rawDemoRunOf(window.localStorage), noRunOnTheServer);
  const demo = useMemo<Demo>(() => (asked.kind === "here" ? { kind: "here", card: demoCardOf(asked.document, demoRunOfText(demoRunText)) } : asked), [asked, demoRunText]);

  // The demo's card reads its name and its roof from the demo as the API hands it out; the numbers are its run's here.
  useEffect(() => {
    const call = new AbortController();
    api.getDemo({ signal: call.signal }).then(
      (document) => setAsked({ kind: "here", document }),
      (error: unknown) => {
        if (!call.signal.aborted) setAsked({ kind: "failed", words: failureOf(error).message });
      },
    );
    return () => call.abort();
  }, []);

  /** Open the demo: the document at hand is opened without a second request; else the flow asks for it. Then the Studio's last lens. */
  function openTheDemo() {
    flow.openDemo(asked.kind === "here" ? asked.document : undefined);
    router.push(pathOfLens(lensOf(view.getState())));
  }

  /** A place found or typed: Find, at the place, as Find's own search would have it. */
  function toFind(place: FoundPlace) {
    router.push(pathOfFind(place));
  }

  const take = { import: () => setImportOpen(true), open: () => setOpenProjectOpen(true) };
  const say = (words: string) => void toasts.show({ kind: "note", words });
  const toTheStudio = () => router.push(pathOfLens(lensOf(view.getState())));
  const keptOf = (id: string) => kept.find((one) => one.id === id) ?? null;

  /** A card pressed, or Open in its menu: the design opens from the device and runs again, in the Studio at its last lens. */
  async function openTheDesign(id: string) {
    await openFromTheSwitcher(id, { openFromDevice: (one) => saving.getState().openFromDevice(one), say });
    // A design that could not be opened is said, and the page stays; one that was (or is open already) is shown.
    if (saving.getState().id === id) toTheStudio();
  }

  /** Duplicate: a copy named after the design, kept under a new id and opened at once (decision 7). */
  function duplicate(id: string) {
    const design = keptOf(id);
    if (design === null) return;
    saving.getState().keepAndOpen({ ...design.document, name: copyNameOf(design.name) });
    toTheStudio();
  }

  /** Save a copy: the .rtd of that design's document, asked of the API as it is. */
  function saveACopy(id: string) {
    const design = keptOf(id);
    if (design !== null) void downloads.getState().saveACopyOf(design.document);
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-ground text-text">
      {/* The board's picture: 1040 wide at 470 from the left and 150 from the top, the roof ending above the demo's card. */}
      <div aria-hidden="true" className="pointer-events-none absolute top-37.5 left-117.5 hidden w-260 desktop:block">
        <HomeIllustration view="whole" />
      </div>
      <header className={classNames("flex h-14 shrink-0 items-center tablet:h-18", SIDES)}>
        <Logo wordmark="always" />
      </header>
      <main className={classNames("relative flex grow flex-col pt-5 pb-10 tablet:pt-7 tablet:pb-12 desktop:pt-19 desktop:pb-14", SIDES)}>
        <div className="flex flex-col gap-3 tablet:gap-5.5 desktop:w-140">
          <h1 className="type-page text-balance tablet:type-hero">
            {HEADLINE[0]}
            <br />
            {HEADLINE[1]}
          </h1>
          <p className="type-body-touch text-text-2 tablet:type-lead tablet:max-w-140 desktop:max-w-118">{SUBTITLE}</p>
        </div>
        <div className="relative mt-4 hidden w-full overflow-hidden tablet:block desktop:hidden">
          <HomeIllustration view="strip" />
          {/* The strip's top edge fades into the ground, as the stage's vignette does. */}
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-18 bg-linear-to-b from-ground to-transparent" />
        </div>
        <div className="mt-6 flex flex-col gap-2.5 tablet:mt-5 desktop:mt-20 desktop:w-120">
          <Search provider={PROVIDER} near={nowhere} onPlace={toFind} found={null} look="hero" hero={{ label: FIND_MY_ROOF, href: pathOfFind() }} />
          {WAYS.map((way) => (
            <button key={way.id} type="button" onClick={take[way.id]} className={WAY}>
              <Icon name={way.icon} size={22} stroke="light" />
              <span className="flex min-w-0 grow flex-col gap-0.5">
                <span className="type-title">{way.title}</span>
                <span className="type-small text-text-2">{way.detail}</span>
              </span>
            </button>
          ))}
        </div>
        {/* The demo's card and "On this device": side by side at the foot on desktop while nothing is kept; with cards, the cards take the width under the demo's card. */}
        <div className={classNames("mt-6 flex flex-col gap-8 tablet:mt-5 tablet:gap-7 desktop:mt-auto desktop:gap-6 desktop:pt-10", cards.length === 0 ? "desktop:flex-row-reverse desktop:items-end desktop:justify-between" : "desktop:items-end")}>
          <DemoCard demo={demo} onOpen={openTheDemo} className="desktop:shrink-0" />
          <OnThisDevice
            cards={cards}
            onOpen={(id) => void openTheDesign(id)}
            onRename={(id, name) => void saving.getState().rename(id, name)}
            onDuplicate={duplicate}
            onSaveACopy={saveACopy}
            onDelete={(id) => void saving.getState().remove(id)}
            className={cards.length === 0 ? "desktop:max-w-110" : "w-full min-w-0"}
          />
        </div>
      </main>
      <ImportDrawing open={isImportOpen} onClose={() => setImportOpen(false)} />
      <OpenProject open={isOpenProjectOpen} onClose={() => setOpenProjectOpen(false)} />
      {/* What the app says, in the page from the start: a design that could not be opened, a copy that could not be saved. */}
      <Toaster toasts={toasts} />
    </div>
  );
}
