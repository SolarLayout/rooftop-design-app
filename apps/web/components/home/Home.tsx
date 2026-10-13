"use client";

import Image from "next/image";
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
import { DEMO, DEMO_PICTURE, DEMO_PICTURE_TALL, HOME, WAYS_IN, type WayIn } from "@/lib/home/home-view";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/places/esri";
import { FIND_BY_HAND, pathOfFind, pathOfLens } from "@/lib/routes";
import { lensOf } from "@/lib/stores/view-store";
import { YourDesigns } from "./YourDesigns";
import { OpenProject } from "@/components/shell/OpenProject";

const ICONS: Record<WayIn, IconName> = { locate: "locate", hand: "pencil", import: "layers", open: "download" };

const PROVIDER = esriProvider(KEY_OF_THE_APP);
const nowhere = () => undefined;

// A glass over the picture (D120): the stage seen through it, blurred, its edge of glass.
const GLASS = "border border-line-glass bg-dim-panel backdrop-blur-panel";
// The other ways in: rows of the column on phone, glass chips from tablet on.
const WAY = classNames(
  "flex h-13 w-full cursor-pointer items-center gap-3 border-b border-line-subtle type-strong-touch text-text press-motion focus-ring",
  "tablet:h-11 tablet:w-auto tablet:gap-2 tablet:rounded-full tablet:border tablet:border-line-glass tablet:bg-dim-panel tablet:px-4 tablet:backdrop-blur-panel",
  "hovered:text-text-2 tablet:hovered:border-line-strong tablet:hovered:text-text desktop:h-10 desktop:type-strong",
);

/**
 * Home (D120: direction A, Golden hour, of the canvas "Rooftop Home · Three directions", with direction B's Your designs and its
 * graph paper): the demo's roof in 3D over the satellite ground fills the first screen, the title and the app's line over it,
 * the search a glass field with Find the roof in it, the other ways in as glass chips under it (rows on phone), the demo's card
 * on the picture; under it Your designs, the demo its first row, on the graph paper, and the line that says where designs are.
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
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-ground text-text">
      <section aria-label={HOME.title} className="relative desktop:min-h-235">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-130 overflow-hidden tablet:h-190 desktop:h-235">
          {/* The demo's roof as Present shows it: tall on phone and tablet, wide on desktop. */}
          <Image src={DEMO_PICTURE_TALL} alt="" fill priority sizes="100vw" className="object-cover object-center desktop:hidden" />
          {/* On desktop the picture stands a tenth of the width in, faded in from its left, so that the roof is right of the words (D120). */}
          <div className="absolute inset-y-0 right-0 left-1/10 hidden fade-from-left desktop:block">
            <Image src={DEMO_PICTURE} alt="" fill priority sizes="80vw" className="object-cover object-left" />
          </div>
          <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-ground/85 to-transparent" />
          <div className="absolute inset-0 hidden bg-linear-to-r from-ground/95 via-ground/78 via-35% to-transparent to-65% desktop:block" />
          <div className="absolute inset-x-0 bottom-0 h-60 bg-linear-to-b from-transparent via-ground/85 to-ground tablet:h-100 desktop:h-75 desktop:via-transparent" />
        </div>

        <header className="relative flex h-14 items-center justify-between px-page-x-phone pt-safe-3 tablet:h-15 tablet:px-8 tablet:pt-safe-6 desktop:px-16 desktop:pt-safe-7">
          <Logo wordmark="from-tablet" />
          <nav aria-label="Elsewhere" className="flex items-center gap-2">
            <button type="button" onClick={take.open} className="hidden h-10 cursor-pointer items-center rounded-full px-4 type-body text-text-2 press-motion focus-ring hovered:text-text desktop:flex">
              Open a project file
            </button>
            {/* The docs, in a new tab (D91): Home has no project menu, where the rest of the app finds them. */}
            <a href={docsHome} target="_blank" rel="noopener" className={classNames("flex h-11 items-center gap-2 rounded-full px-4.5 type-body-touch text-text press-motion focus-ring hovered:border-line-strong desktop:h-10 desktop:type-body", GLASS)}>
              <Icon name="book" size={16} stroke="light" />
              Docs
            </a>
          </nav>
        </header>

        <a
          href="#"
          onClick={(event) => {
            event.preventDefault();
            openTheDemo();
          }}
          data-testid="demo-card"
          className={classNames(
            "absolute top-88 left-page-x-phone z-float flex items-center gap-3 rounded-card px-3.5 py-2.5 shadow-float press-motion focus-ring",
            "tablet:top-105 tablet:right-8 tablet:left-auto desktop:top-150 desktop:right-30 desktop:gap-4.5 desktop:px-4.5 desktop:py-3.5",
            GLASS,
          )}
        >
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-ok" />
          <span className="flex flex-col">
            <span className="hidden type-body text-text-2 tablet:block">
              {DEMO.name} · {DEMO.kwp} kWp
            </span>
            <span className="type-body-touch text-text-2 tablet:type-figure-touch tablet:text-text">
              <span className="tablet:hidden">{DEMO.name} · </span>
              <span className="font-display font-semibold text-text">{DEMO.mwh}</span> <span className="tablet:type-body tablet:text-text-2">MWh per year</span>
            </span>
          </span>
          <span className="hidden h-9 items-center rounded-control border border-line-strong px-3.5 type-strong desktop:ml-1.5 desktop:flex">{DEMO.action}</span>
        </a>

        <div className="relative flex flex-col gap-4.5 px-page-x-phone pt-93 pb-8 tablet:gap-5.5 tablet:px-8 tablet:pt-119 tablet:pb-12 desktop:w-176 desktop:gap-7 desktop:px-16 desktop:pt-23 desktop:pb-0">
          <h1 className="type-display-touch tablet:type-display desktop:type-banner">{HOME.title}</h1>
          <p className="type-body-touch text-text-2 tablet:type-banner-line desktop:max-w-130">{HOME.line}</p>
          <Search ref={search} provider={PROVIDER} near={nowhere} onPlace={toFind} found={null} look="glass" hero={{ label: HOME.find, href: pathOfFind() }} className="tablet:mt-1.5" />
          <ul aria-label="Other ways to start" className="flex flex-col border-t border-line-subtle tablet:flex-row tablet:flex-wrap tablet:gap-2.5 tablet:border-t-0 desktop:-mt-1">
            {WAYS_IN.map((way) => (
              // On desktop Open a project file stands in the top bar.
              <li key={way.id} className={way.id === "open" ? "desktop:hidden" : undefined}>
                <button type="button" onClick={take[way.id]} className={WAY}>
                  <Icon name={ICONS[way.id]} size={16} className="hidden text-text-2 tablet:block" />
                  <span className="grow text-left">{way.words}</span>
                  <Icon name="chevron-right" size={16} className="text-text-3 tablet:hidden" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="relative flex grow flex-col">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-30 bottom-0 graph-paper" />
        <main className="relative w-full px-page-x-phone pt-6 pb-16 tablet:px-8 tablet:pt-4 desktop:px-16 desktop:pt-4">
          <YourDesigns
            cards={cards}
            onOpenDemo={openTheDemo}
            onOpen={(id) => void openTheDesign(id)}
            onRename={(id, name) => void saving.getState().rename(id, name)}
            onDuplicate={duplicate}
            onDownload={download}
            onDelete={(id) => void saving.getState().remove(id)}
          />
        </main>
        <footer className="relative mx-page-x-phone flex min-h-22 items-center justify-between gap-4 border-t border-line-subtle pb-safe-0 type-body-touch text-text-3 tablet:mx-8 desktop:mx-16 desktop:type-body">
          <span>Your designs are kept on this device.</span>
          <a href={docsHome} target="_blank" rel="noopener" className="rounded-control text-text-2 focus-ring hovered:text-text">
            Docs
          </a>
        </footer>
      </div>

      <ImportDrawing open={isImportOpen} onClose={() => setImportOpen(false)} />
      <OpenProject open={isOpenProjectOpen} onClose={() => setOpenProjectOpen(false)} />
      {/* What the app says, in the page from the start: a design that could not be opened, a file that could not be downloaded. */}
      <Toaster toasts={toasts} />
    </div>
  );
}
