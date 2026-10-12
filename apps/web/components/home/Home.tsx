"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Search, type FoundPlace, type SearchHandle } from "@/components/shell/Search";
import { ImportDrawing } from "@/components/shell/ImportDrawing";
import { Logo } from "@/components/shell/Logo";
import { useDocsHome } from "@/components/shell/use-docs-home";
import { useSaving, useStores } from "@/components/shell/stores";
import { classNames } from "@/components/ui/class-names";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Toaster } from "@/components/ui/Toaster";
import { openFromTheSwitcher } from "@/lib/device/opening";
import { keptDesignsOf, listedAtOf } from "@/lib/device/saving";
import { cardsOf, copyNameOf } from "@/lib/home/cards";
import { HOME, sectionsOf, WAYS_IN, type WayIn } from "@/lib/home/home-view";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/places/esri";
import { FIND_BY_HAND, pathOfFind, pathOfLens } from "@/lib/routes";
import { lensOf } from "@/lib/stores/view-store";
import { DemoCard } from "./DemoCard";
import { OnThisDevice } from "./OnThisDevice";
import { OpenProject } from "@/components/shell/OpenProject";

const ICONS: Record<WayIn, IconName> = { locate: "locate", hand: "pencil", import: "layers", open: "download" };

const PROVIDER = esriProvider(KEY_OF_THE_APP);
const nowhere = () => undefined;

const WAY = "flex min-h-touch cursor-pointer items-center gap-2 rounded-control px-1 type-strong-touch text-text press-motion focus-ring hovered:text-text-2 desktop:min-h-10 desktop:type-strong";

/**
 * Home as a start screen (V2 · 9, D105; the board "V2 · 9 · Handover and Home"): the logo and its name at the top left, Docs
 * at the right; a column of 960 on desktop: the title at the title's size and one line of what the app does (audit V2-03,
 * V2-115); the search the largest thing, 56 high, Find the roof beside it (under it on phone), the other ways in as links
 * under it: Use my location, Enter the roof by hand, Import a drawing, Open a project file. With designs on this device they
 * come first, under the search, which stays at the top as the page scrolls (V2-14); Try the demo after.
 */
export function Home() {
  const router = useRouter();
  const { flow, view, toasts, saving, downloads } = useStores();
  const kept = useSaving(keptDesignsOf);
  const listedAt = useSaving(listedAtOf);
  const cards = useMemo(() => cardsOf(kept, listedAt), [kept, listedAt]);
  const [isImportOpen, setImportOpen] = useState(false);
  const [isOpenProjectOpen, setOpenProjectOpen] = useState(false);
  const search = useRef<SearchHandle>(null);
  const docsHome = useDocsHome();
  const sections = sectionsOf(cards.length);

  /** Open the demo: the flow asks for it, then the Studio's last lens. */
  function openTheDemo() {
    flow.openDemo();
    router.push(pathOfLens(lensOf(view.getState())));
  }

  /** A place found or typed, or the device's own: Find, at the place, as Find's own search would have it. */
  function toFind(place: FoundPlace) {
    router.push(pathOfFind(place));
  }

  const take: Record<WayIn, () => void> = {
    locate: () => search.current?.locate(),
    hand: () => router.push(FIND_BY_HAND),
    import: () => setImportOpen(true),
    open: () => setOpenProjectOpen(true),
  };
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

  /** Download the project file: the .rtd of that design's document, asked of the API as it is. */
  function download(id: string) {
    const design = keptOf(id);
    if (design !== null) void downloads.getState().saveACopyOf(design.document);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ground text-text">
      <header className="box-content flex h-14 shrink-0 items-center justify-between border-b border-line-subtle bg-chrome px-4 pt-safe-0 tablet:h-15 tablet:px-6">
        <Logo wordmark="from-tablet" />
        {/* The docs, in a new tab (D91): Home has no project menu, where the rest of the app finds them. */}
        <a href={docsHome} target="_blank" rel="noopener" className="-mr-2 flex h-11 items-center gap-2 rounded-row px-3 type-body-touch desktop:type-body text-text-2 hovered:bg-surface-2 hovered:text-text focus-ring desktop:h-10">
          <Icon name="book" size={16} stroke="light" />
          Docs
        </a>
      </header>
      <main className="flex grow justify-center px-page-x-phone pt-8 pb-safe-10 tablet:px-page-x-tablet desktop:px-page-x-desktop desktop:pt-16">
        <div className="flex w-full max-w-240 flex-col gap-8 desktop:gap-10">
          <div className="flex flex-col gap-2">
            <h1 className="type-title-touch desktop:type-title">{HOME.title}</h1>
            <p className="type-body-touch desktop:type-body text-text-2">{HOME.line}</p>
          </div>
          {/* The search stays at the top as the page scrolls while there are designs under it (audit V2-14). */}
          <div data-testid="home-search" className={classNames("flex flex-col gap-3 bg-ground", sections[0] === "designs" && "sticky top-0 z-float py-2")}>
            <Search ref={search} provider={PROVIDER} near={nowhere} onPlace={toFind} found={null} look="hero" hero={{ label: HOME.find, href: pathOfFind() }} />
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {WAYS_IN.map((way) => (
                <li key={way.id}>
                  <button type="button" onClick={take[way.id]} className={WAY}>
                    <Icon name={ICONS[way.id]} size={16} className="text-text-2" />
                    {way.words}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {sections.map((section) =>
            section === "designs" ? (
              <OnThisDevice
                key={section}
                cards={cards}
                onOpen={(id) => void openTheDesign(id)}
                onRename={(id, name) => void saving.getState().rename(id, name)}
                onDuplicate={duplicate}
                onDownload={download}
                onDelete={(id) => void saving.getState().remove(id)}
              />
            ) : (
              <DemoCard key={section} onOpen={openTheDemo} />
            ),
          )}
        </div>
      </main>
      <ImportDrawing open={isImportOpen} onClose={() => setImportOpen(false)} />
      <OpenProject open={isOpenProjectOpen} onClose={() => setOpenProjectOpen(false)} />
      {/* What the app says, in the page from the start: a design that could not be opened, a file that could not be downloaded. */}
      <Toaster toasts={toasts} />
    </div>
  );
}
