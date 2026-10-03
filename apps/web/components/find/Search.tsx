"use client";

import { useId, useReducer, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { classNames } from "@/components/ui/class-names";
import { LIST_GAP } from "@/components/ui/design-numbers";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { Icon } from "@/components/ui/Icon";
import { FACT, LIST, ROW, ROW_MARKED } from "@/components/ui/list-look";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusMark } from "@/components/ui/StatusMark";
import { useFloating } from "@/components/ui/use-floating";
import { placeInFull } from "@/lib/format/place";
import { SearchError } from "@/lib/map/esri";
import { placeInputOf } from "@/lib/map/place-input";
import type { MapProvider } from "@/lib/map/provider";
import { afterKey, IDLE, searchStateAfter } from "@/lib/map/search-state";

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
  /** Floating over the map (Find), a field of a form (the import of a drawing), or the well of Home with its primary action inside (`hero`). */
  look?: "floating" | "field" | "hero";
  /**
   * The primary action of Home's search (the board "Home"): a link to *href* while nothing is typed, so that it leads to
   * Find by itself; with words typed it searches them, with coordinates or a link it takes them. On phone it stands under
   * the well, as wide as it.
   */
  hero?: { label: string; href: string };
  className?: string;
};

export const SEARCH_LABEL = "Search an address or paste coordinates";
const NO_KEY = "Words cannot be searched for without a map key. Paste coordinates or a maps link instead.";
const NO_LOCATION = "Your location is not available. Allow it in the browser, or search for the address.";

const BOX = "flex h-12 min-w-0 items-center gap-3 rounded-card-s border border-line bg-surface-1 px-4 shadow-float";
const FIELD = "flex h-10 min-w-0 items-center gap-2.5 rounded-control border border-line bg-well px-3 shadow-well";
const NOTE = "flex min-h-11 items-center gap-2.5 px-2.5 text-text-2";

// Home's well: 76 high with the action inside at the right from tablet up; on phone the form alone is the well, 56 high,
// and the action stands under it. The focus inside gives the well the accent line and the halo, as every well has.
const HERO = classNames(
  "flex min-w-0 flex-col gap-2.5 tablet:h-19 tablet:flex-row tablet:items-center tablet:gap-3 tablet:pr-2.5 tablet:pl-5",
  "tablet:rounded-bar tablet:border tablet:border-line-strong tablet:bg-well tablet:shadow-well tablet:focused:border-accent tablet:focused:shadow-well-focus",
);
const HERO_FORM = classNames(
  "flex h-14 min-w-0 items-center gap-3 rounded-bar border border-line-strong bg-well px-4 shadow-well focused:border-accent focused:shadow-well-focus",
  "tablet:h-auto tablet:grow tablet:rounded-none tablet:border-0 tablet:bg-transparent tablet:px-0 tablet:shadow-none",
);
const HERO_ACTION = "w-full max-tablet:h-12 max-tablet:rounded-row tablet:w-auto";

/** The field of the search: words for the geocoder, coordinates, or a maps link; the places found under it. */
export function Search({ provider, near, onPlace, found, look = "floating", hero, className }: Props) {
  const id = useId();
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
      dispatch({ type: "failed", query, message: NO_KEY });
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

  function onSubmit() {
    const input = placeInputOf(typed);
    if (input.kind === "nothing") return;
    if (input.kind === "words") {
      void searchFor(input.query);
      return;
    }
    take({ lon: input.lon, lat: input.lat, label: placeInFull(input.lat, input.lon), byWords: false });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && state.kind !== "idle") {
      event.preventDefault();
      close();
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

  const listId = `${id}-places`;
  const formId = `${id}-search`;
  const isListOpen = state.kind === "found";
  const isHero = look === "hero";
  const hasWords = typed.trim() !== "";

  return (
    <div className={classNames(isHero ? HERO : "flex min-w-0 items-center gap-2 tablet:gap-2.5", className)}>
      <form
        id={formId}
        ref={anchor}
        role="search"
        className={classNames(isHero ? HERO_FORM : look === "field" ? FIELD : BOX, "min-w-0 grow")}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Icon name="search" size={isHero ? 22 : 18} className="text-text-2" />
        <input
          type="text"
          role="combobox"
          aria-label={SEARCH_LABEL}
          aria-autocomplete="list"
          aria-expanded={isListOpen}
          aria-controls={listId}
          aria-activedescendant={isListOpen ? `${listId}-${state.marked}` : undefined}
          placeholder={SEARCH_LABEL}
          autoComplete="off"
          enterKeyHint="search"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          onKeyDown={onKeyDown}
          className={classNames("min-w-0 grow truncate border-0 bg-transparent text-text outline-none placeholder:text-text-3", isHero ? "text-(length:--text-title)" : "type-body-touch desktop:type-body")}
        />
        {state.kind === "searching" ? (
          <ProgressRing size={16} label="Searching" />
        ) : found !== null ? (
          <span data-testid="found-at" className="hidden max-w-40 truncate type-small text-text-2 tablet:inline">
            {found}
          </span>
        ) : null}
      </form>
      {hero ? (
        hasWords ? (
          <Button type="submit" form={formId} kind="primary" size="xl" className={HERO_ACTION}>
            {hero.label}
            <Icon name="arrow-right" size={18} />
          </Button>
        ) : (
          <ButtonLink kind="primary" size="xl" href={hero.href} className={HERO_ACTION}>
            {hero.label}
            <Icon name="arrow-right" size={18} />
          </ButtonLink>
        )
      ) : null}
      {!isHero && typed === "" && found === null ? (
        <button
          type="button"
          aria-label="Use my location"
          aria-busy={isLocating}
          onClick={useMyLocation}
          className={classNames(
            "flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-card-s border border-line bg-surface-1 text-text shadow-float",
            "press-motion focus-ring hovered:bg-control-hover desktop:hidden",
          )}
        >
          {isLocating ? <ProgressRing size={16} /> : <Icon name="locate" size={18} />}
        </button>
      ) : null}

      <FloatingPanel floating={floating} width="search">
        <div className={LIST}>
          {state.kind === "found" ? (
            <ul id={listId} role="listbox" aria-label="Places found" className="flex flex-col gap-0.5">
              {state.places.map((place, index) => (
                <li
                  key={`${place.lon},${place.lat}`}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === state.marked}
                  onClick={() => take({ lon: place.lon, lat: place.lat, label: place.label, byWords: true })}
                  className={classNames(ROW, index === state.marked && ROW_MARKED, "hovered:bg-surface-2")}
                >
                  <Icon name="pin" size={16} className="text-text-3" />
                  <span className="min-w-0 grow truncate">{place.label}</span>
                  {place.kind ? <span className={FACT}>{place.kind}</span> : null}
                </li>
              ))}
            </ul>
          ) : state.kind === "nothing" ? (
            <p role="status" className={NOTE}>
              <StatusMark kind="note" label="Note" wordsShown={false} size={16} />
              Nothing found for “{state.query}”. Try a fuller address, or paste coordinates.
            </p>
          ) : state.kind === "failed" ? (
            <p role="status" className={NOTE}>
              <StatusMark kind="note" label="Note" wordsShown={false} size={16} />
              {state.message}
            </p>
          ) : state.kind === "searching" ? (
            <p role="status" className={NOTE}>
              <ProgressRing size={16} />
              Searching for “{state.query}”
            </p>
          ) : null}
        </div>
      </FloatingPanel>
    </div>
  );
}
