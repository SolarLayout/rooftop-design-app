"use client";

import { useId, useImperativeHandle, useReducer, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { classNames } from "@/components/ui/class-names";
import { LIST_GAP } from "@/components/ui/design-numbers";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { Icon } from "@/components/ui/Icon";
import { FACT, FLOATING_SURFACE, ROW, ROW_MARKED } from "@/components/ui/list-look";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusMark } from "@/components/ui/StatusMark";
import { Tooltip } from "@/components/ui/Tooltip";
import { useFloating } from "@/components/ui/use-floating";
import { SEARCH_UNAVAILABLE } from "@/lib/errors/problem-of";
import { placeInFull } from "@/lib/format/place";
import { besideTheField } from "@/lib/places/beside-the-field";
import { SearchError } from "@/lib/places/esri";
import { isAPlace, placeInputOf, type LatLon } from "@/lib/places/place-input";
import type { MapProvider } from "@/lib/places/provider";
import { afterKey, IDLE, searchStateAfter } from "@/lib/places/search-state";

/** What a screen around the search can ask of it (Find's first step, D85): the field focused, words put into it, my location. */
export type SearchHandle = { focus: () => void; put: (text: string) => void; locate: () => void };

/** A place the user chose: found by words, typed as coordinates, taken from a link, or the device's own. */
export type FoundPlace = { lon: number; lat: number; label: string; byWords: boolean };

type Props = {
  /** Null without a key: words cannot be searched for, coordinates and links still work. */
  provider: MapProvider | null;
  /** Where the map is, so that places near it come first. */
  near: () => { lon: number; lat: number } | undefined;
  onPlace: (place: FoundPlace) => void;
  /** The label of the place that was found, beside the field. */
  found: string | null;
  /** First in Find's column (V2 · 4), a field of a form (the import of a drawing), the well of Home with its primary action
   * beside it (`hero`), or Home's glass field over its picture with the action inside it from tablet on (`glass`, D120). */
  look?: "column" | "field" | "hero" | "glass";
  /** What the search reads, shown in its list while it is empty and has the focus (Find's column); pressed, put into it. */
  examples?: readonly { what: string; text: string; shown: string }[];
  /**
   * The primary action of Home's search (V2 · 9, D105): beside the well, 56 high, a link to *href* while nothing is typed, so
   * that it leads to Find by itself; with words typed it searches them, with coordinates or a link it takes them. On phone it
   * stands under the well, as wide as it.
   */
  hero?: { label: string; href: string };
  ref?: Ref<SearchHandle>;
  className?: string;
};

export const SEARCH_LABEL = "Search an address or paste coordinates";
/** The field's words in Find's column (the board "Find"). */
const COLUMN_LABEL = "Address or coordinates";
const NO_LOCATION = "Your location is not available. Allow it in the browser, or search for the address.";
const MY_LOCATION = "Use my location";

// The field of Find's column, 48 high, takes the accent line while it holds the focus, as every well does (D85).
const BOX = "flex h-12 min-w-0 items-center gap-3 rounded-row border border-line bg-well px-4 shadow-well focused:border-accent focused:shadow-well-focus";
const FIELD = "flex h-10 min-w-0 items-center gap-2.5 rounded-control border border-line bg-well px-3 shadow-well";
// A note may run to two lines (the board "Coordinates in the search"): its mark stays by the first.
const NOTE = "flex min-h-11 items-start gap-2.5 px-2.5 py-3 text-text-2";
const NOTE_MARK = "flex shrink-0 pt-0.5";

// Home's well (V2 · 9, D105): 56 high, the largest thing on the page, with Find the roof beside it from tablet up and under it
// on phone, as wide as it; the field's words never cut by the button (audit V2-05). The places float under the well, as wide
// as it. The focus inside gives the well the accent line and the halo, as every well has.
const HERO = "relative flex min-w-0 flex-col gap-3 tablet:flex-row tablet:items-stretch";
const HERO_FORM = "relative flex h-14 min-w-0 items-center gap-3 rounded-row border border-line-strong bg-well px-4 shadow-well focused:border-accent focused:shadow-well-focus";
const HERO_ANCHOR = "pointer-events-none absolute inset-x-0 bottom-0";
const HERO_ACTION = "w-full tablet:h-14 tablet:w-auto";
/** Home's field's words: short, so that they are never cut (V2 · 9). */
const HERO_LABEL = "Address or coordinates";
// Home over its picture (D120): the field a glass of 60 (68 from tablet), the stage seen through it; the action under it on
// phone, inside its right end from tablet on, 52 high with the large primary's radius.
const GLASS = "relative flex min-w-0 flex-col gap-2.5 tablet:block";
const GLASS_FORM =
  "relative flex h-15 min-w-0 items-center gap-3 rounded-hero border border-line-glass bg-dim-panel px-4.5 shadow-float backdrop-blur-panel focused:border-accent tablet:h-17 tablet:pr-48 tablet:pl-5.5";
const GLASS_ACTION = "h-14 w-full rounded-cta tablet:absolute tablet:top-2 tablet:right-2 tablet:h-13 tablet:w-auto";

/** The field of the search: words for the geocoder, coordinates, or a maps link; the places found under it. */
export function Search({ provider, near, onPlace, found, look = "column", examples, hero, ref, className }: Props) {
  const id = useId();
  const field = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");
  const [state, dispatch] = useReducer(searchStateAfter, IDLE);
  const [floating, anchor] = useFloating({ side: "below", align: "start", gap: LIST_GAP });
  const call = useRef<AbortController | null>(null);
  const [isLocating, setLocating] = useState(false);

  function close() {
    call.current?.abort();
    call.current = null;
    dispatch({ type: "closed" });
    floating.close();
  }

  function take(place: FoundPlace) {
    close();
    dispatch({ type: "taken" });
    onPlace(place);
  }

  async function searchFor(query: string) {
    call.current?.abort();
    const control = new AbortController();
    call.current = control;
    dispatch({ type: "asked", query });
    floating.open();
    if (!provider) {
      dispatch({ type: "failed", query, message: SEARCH_UNAVAILABLE });
      return;
    }
    try {
      const places = await provider.search(query, { near: near(), signal: control.signal });
      if (!control.signal.aborted) dispatch({ type: "found", query, places });
    } catch (error) {
      if (control.signal.aborted) return;
      const message = error instanceof SearchError ? error.message : "The search failed. Try again.";
      dispatch({ type: "failed", query, message });
    }
  }

  function takeAt({ lat, lon }: LatLon) {
    take({ lon, lat, label: placeInFull(lat, lon), byWords: false });
  }

  function onSubmit() {
    const input = placeInputOf(typed);
    if (input.kind === "nothing") return;
    if (input.kind === "words") {
      void searchFor(input.query);
      return;
    }
    if (input.kind === "unreadable") {
      // What looks like coordinates is never sent to the address search: it says why it cannot be read.
      call.current?.abort();
      dispatch({ type: "refused", why: input.why, offer: input.offer });
      floating.open();
      return;
    }
    takeAt(input);
  }

  // Coordinates and links are read back under the field as they are typed; a refusal no longer holds once the text changes.
  function onType(text: string) {
    setTyped(text);
    if (isAPlace(placeInputOf(text))) {
      if (state.kind !== "idle") {
        call.current?.abort();
        dispatch({ type: "closed" });
      }
      floating.open();
      return;
    }
    if (state.kind === "refused") dispatch({ type: "closed" });
    if (state.kind === "idle" || state.kind === "refused") floating.close();
  }

  function showExamples() {
    if (examples && typed === "" && state.kind === "idle") floating.open();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && state.kind !== "idle") {
      event.preventDefault();
      close();
      return;
    }
    if (state.kind === "refused" && state.offer && event.key === "Enter") {
      event.preventDefault();
      takeAt(state.offer);
      return;
    }
    if (state.kind !== "found") return;
    if (event.key === "Enter") {
      event.preventDefault();
      const place = state.places[state.marked];
      take({ lon: place.lon, lat: place.lat, label: place.label, byWords: true });
      return;
    }
    if (afterKey(state, event.key) === state) return;
    event.preventDefault();
    dispatch({ type: "key", key: event.key });
  }

  function useMyLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        take({ lon: coords.longitude, lat: coords.latitude, label: placeInFull(coords.latitude, coords.longitude), byWords: false });
      },
      () => {
        setLocating(false);
        dispatch({ type: "asked", query: "" });
        dispatch({ type: "failed", query: "", message: NO_LOCATION });
        floating.open();
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  useImperativeHandle(ref, () => ({
    focus: () => field.current?.focus(),
    put: (text: string) => {
      onType(text);
      field.current?.focus();
    },
    locate: useMyLocation,
  }));

  const listId = `${id}-places`;
  const formId = `${id}-search`;
  const reading = placeInputOf(typed);
  const readBack = state.kind === "idle" && isAPlace(reading) ? reading : null;
  const offer = state.kind === "refused" ? state.offer : null;
  const marked = state.kind === "found" ? state.marked : readBack || offer ? 0 : null;
  const isListOpen = marked !== null;
  const isGlass = look === "glass";
  const isHero = look === "hero" || isGlass;
  const hasWords = typed.trim() !== "";
  const beside = besideTheField({ look, typed, found });
  const locateMark = isLocating ? <ProgressRing size={16} /> : <Icon name="locate" size={18} />;

  return (
    <div className={classNames(isGlass ? GLASS : isHero ? HERO : "flex min-w-0 items-center gap-2 tablet:gap-2.5", className)}>
      <form
        id={formId}
        ref={isHero ? undefined : anchor}
        role="search"
        className={classNames(isGlass ? GLASS_FORM : isHero ? HERO_FORM : look === "field" ? FIELD : BOX, "min-w-0 grow")}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {isHero ? <span ref={anchor} aria-hidden className={HERO_ANCHOR} /> : null}
        <Icon name="search" size={isHero ? 20 : 18} className="text-text-2" />
        <input
          ref={field}
          type="text"
          role="combobox"
          aria-label={SEARCH_LABEL}
          aria-autocomplete="list"
          aria-expanded={isListOpen}
          aria-controls={listId}
          aria-activedescendant={marked !== null ? `${listId}-${marked}` : undefined}
          placeholder={look === "column" ? COLUMN_LABEL : isHero ? HERO_LABEL : SEARCH_LABEL}
          autoComplete="off"
          enterKeyHint="search"
          value={typed}
          onChange={(event) => onType(event.target.value)}
          onKeyDown={onKeyDown}
          // The examples show while the field is empty: on the focus from the keyboard, and on the press, which the panel's
          // light dismiss would otherwise take for a press outside it.
          onFocus={showExamples}
          onClick={showExamples}
          className="min-w-0 grow truncate border-0 bg-transparent type-body-touch text-text outline-none placeholder:text-text-3 desktop:type-body"
        />
        {state.kind === "searching" ? (
          <ProgressRing size={16} label="Searching" />
        ) : found !== null ? (
          <span data-testid="found-at" className="hidden max-w-40 truncate type-body-touch desktop:type-body text-text-2 tablet:inline">
            {found}
          </span>
        ) : null}
      </form>
      {hero ? (
        hasWords ? (
          <Button type="submit" form={formId} kind="primary" size="xl" icon={isGlass ? "arrow-right" : undefined} className={classNames(isGlass ? GLASS_ACTION : HERO_ACTION, isGlass && "flex-row-reverse")}>
            {hero.label}
          </Button>
        ) : (
          <ButtonLink kind="primary" size="xl" href={hero.href} icon={isGlass ? "arrow-right" : undefined} className={classNames(isGlass ? GLASS_ACTION : HERO_ACTION, isGlass && "flex-row-reverse")}>
            {hero.label}
          </ButtonLink>
        )
      ) : null}
      {!isHero && beside === "locate" ? (
        <Tooltip words={MY_LOCATION}>
          <button
            type="button"
            aria-label={MY_LOCATION}
            aria-busy={isLocating}
            onClick={useMyLocation}
            className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-row border border-line bg-surface-1 text-text shadow-float press-motion focus-ring hovered:bg-control-hover"
          >
            {locateMark}
          </button>
        </Tooltip>
      ) : null}
      {beside === "search" ? (
        // With something typed, the action that Enter is: the words searched, coordinates or a link taken.
        <Button type="submit" form={formId} kind="primary" className="h-12 shrink-0 rounded-cta px-4 desktop:h-12">
          Search
        </Button>
      ) : null}

      {/* The places float under the field on every size: a sheet would stand under the keyboard of a phone. */}
      <FloatingPanel floating={floating} width="control" onTouch="floating">
        <div className={FLOATING_SURFACE}>
          {examples && typed === "" && state.kind === "idle" ? (
            <div className="flex flex-col gap-0.5">
              <p className="px-2.5 pt-1 pb-0.5 type-unit text-text-3">Examples</p>
              <ul aria-label="Examples" className="flex flex-col gap-0.5">
                {examples.map((example) => (
                  <li key={example.what}>
                    <button type="button" onClick={() => onType(example.text)} className={classNames(ROW, "w-full text-left hovered:bg-surface-2")}>
                      <code className="min-w-0 grow truncate type-mono-touch desktop:type-mono">{example.shown}</code>
                      <span className={classNames(FACT, "shrink-0 whitespace-nowrap")}>{example.what}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : readBack ? (
            <ul id={listId} role="listbox" aria-label="Places found" className="flex flex-col gap-0.5">
              <PlaceOption id={`${listId}-0`} label={placeInFull(readBack.lat, readBack.lon)} fact="Coordinates" isMarked onTake={() => takeAt(readBack)} />
            </ul>
          ) : state.kind === "found" ? (
            <ul id={listId} role="listbox" aria-label="Places found" className="flex flex-col gap-0.5">
              {state.places.map((place, index) => (
                <PlaceOption
                  key={`${place.lon},${place.lat}`}
                  id={`${listId}-${index}`}
                  label={place.label}
                  fact={place.kind}
                  isMarked={index === state.marked}
                  onTake={() => take({ lon: place.lon, lat: place.lat, label: place.label, byWords: true })}
                />
              ))}
            </ul>
          ) : state.kind === "refused" ? (
            <>
              <Note>{state.why}</Note>
              {offer ? (
                <ul id={listId} role="listbox" aria-label="Places found" className="flex flex-col gap-0.5">
                  <PlaceOption id={`${listId}-0`} label={placeInFull(offer.lat, offer.lon)} fact="Swapped" isMarked onTake={() => takeAt(offer)} />
                </ul>
              ) : null}
            </>
          ) : state.kind === "nothing" ? (
            <Note>Nothing found for “{state.query}”. Try a fuller address, or paste coordinates.</Note>
          ) : state.kind === "failed" ? (
            <Note>{state.message}</Note>
          ) : state.kind === "searching" ? (
            <p role="status" className={NOTE}>
              <span className={NOTE_MARK}>
                <ProgressRing size={16} />
              </span>
              Searching for “{state.query}”
            </p>
          ) : null}
        </div>
      </FloatingPanel>
    </div>
  );
}

/** A place in the list under the field: found by words, read back from coordinates, or offered for them. */
function PlaceOption({ id, label, fact, isMarked, onTake }: { id: string; label: string; fact: string; isMarked: boolean; onTake: () => void }) {
  return (
    <li id={id} role="option" aria-selected={isMarked} onClick={onTake} className={classNames(ROW, isMarked && ROW_MARKED, "hovered:bg-surface-2")}>
      <Icon name="pin" size={16} className="text-text-3" />
      <span className="min-w-0 grow truncate">{label}</span>
      {fact ? <span className={FACT}>{fact}</span> : null}
    </li>
  );
}

/** A note under the field, with the exclamation of a note and never a cross. */
function Note({ children }: { children: ReactNode }) {
  return (
    <p role="status" className={NOTE}>
      <span className={NOTE_MARK}>
        <StatusMark kind="note" label="Note" wordsShown={false} size={16} />
      </span>
      <span>{children}</span>
    </p>
  );
}
