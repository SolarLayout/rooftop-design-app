"use client";

import { useEffect, useRef } from "react";
import { useStore } from "zustand";
import { classNames } from "@/components/ui/class-names";
import { Icon, type IconName } from "@/components/ui/Icon";
import { measures } from "@/components/ui/measures";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Controls } from "@/lib/present/controls";
import { trackOf } from "@/lib/present/controls";
import type { Tour } from "@/lib/present/create-tour";
import { SCENES } from "@/lib/present/tour";

type Props = { tour: Tour; controls: Controls; onLeave: () => void };

// The bar at the foot (V2 · 13, D110): 16 from the edges on phone, 40 on tablet and desktop; on the stage's dim panel,
// blurred. It fades out after 3 s while the tour plays and stays while it is paused (lib/present/controls.ts).
const BAR = classNames(
  "absolute inset-x-4 bottom-safe-4 z-stage-overlay flex items-center gap-2 rounded-card border border-line-glass bg-dim-panel px-3 py-2",
  "shadow-float backdrop-blur-panel duration-panel ease-out tablet:inset-x-10 tablet:bottom-safe-6 tablet:gap-3 tablet:px-4",
);
const ROUND = "flex shrink-0 cursor-pointer items-center justify-center rounded-full focus-ring";
const STEP = classNames(ROUND, "size-touch text-text hovered:bg-line-glass desktop:size-10");

function Step({ icon, words, shortcut, onPress }: { icon: IconName; words: string; shortcut: string; onPress: () => void }) {
  return (
    <Tooltip words={words} shortcut={shortcut}>
      <button type="button" aria-label={words} onClick={onPress} className={STEP}>
        <Icon name={icon} size={20} />
      </button>
    </Tooltip>
  );
}

/** The six scenes as segments, each a press to its scene; named under on tablet and desktop, bars alone on phone. */
function Track({ tour }: { tour: Tour }) {
  const index = useStore(tour.view, (state) => state.index);
  const share = useStore(tour.view, (state) => state.share);
  return (
    <div className="flex min-w-0 grow gap-1.5">
      {trackOf(SCENES, index, share).map((segment, at) => (
        <button
          key={segment.name}
          type="button"
          aria-label={`Scene ${at + 1}: ${segment.name}`}
          aria-current={segment.isCurrent ? "step" : undefined}
          onClick={() => tour.goTo(at)}
          className="flex min-h-touch min-w-0 grow basis-0 cursor-pointer flex-col justify-center gap-1.5 rounded-control text-left focus-ring desktop:min-h-10"
        >
          <span className="relative h-1 w-full overflow-hidden rounded-full bg-track-glass">
            <span className="absolute inset-y-0 left-0 w-span bg-text" style={measures({ span: segment.fill })} />
          </span>
          <span className={classNames("hidden truncate type-unit tablet:block", segment.isCurrent ? "text-text" : "text-text-2")}>{segment.short}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * The presenter's controls (V2 · 13; V2-102): the scene before, Pause or Play, the scene after, Paused while it is, the
 * six scenes as a track, and Leave, with Esc on desktop. Each control is named on hover and focus; a focus in the bar
 * holds it shown as a pause does. Hidden, it is out of the way of the pointer and of the focus alike.
 */
export function PresentControls({ tour, controls, onLeave }: Props) {
  const isShown = useStore(controls.view, (state) => state.isShown);
  const isPaused = useStore(tour.view, (state) => state.isPaused);
  const isRunning = useStore(tour.view, (state) => state.isRunning);
  const bar = useRef<HTMLDivElement>(null);

  // Hidden, the bar is out of the focus's way: Tab shows it and puts the focus on its first control.
  useEffect(() => {
    function tabbed(event: KeyboardEvent) {
      if (event.key !== "Tab" || controls.view.getState().isShown) return;
      event.preventDefault();
      controls.moved();
      requestAnimationFrame(() => bar.current?.querySelector("button")?.focus());
    }
    window.addEventListener("keydown", tabbed);
    return () => window.removeEventListener("keydown", tabbed);
  }, [controls]);

  if (!isRunning) return null;
  const play = isPaused ? "Play" : "Pause";

  return (
    <div
      ref={bar}
      role="toolbar"
      aria-label="Present"
      data-testid="present-controls"
      data-state={isShown ? "shown" : "hidden"}
      onFocus={() => controls.setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) controls.setFocused(false);
      }}
      // Shown, it is there at once for the focus and fades in; hidden, it fades out and then leaves the focus's way.
      className={classNames(BAR, isShown ? "transition-opacity" : "invisible opacity-gone transition-all")}
    >
      <Step icon="chevron-left" words="Scene before" shortcut="←" onPress={tour.before} />
      <Tooltip words={play} shortcut="Space">
        <button type="button" aria-label={play} onClick={isPaused ? tour.play : tour.pause} className={classNames(ROUND, "size-12 bg-text text-ground")}>
          <Icon name={isPaused ? "play" : "pause"} size={20} stroke="pause" />
        </button>
      </Tooltip>
      <Step icon="chevron-right" words="Scene after" shortcut="→" onPress={tour.after} />
      {isPaused ? <span className="shrink-0 type-body-touch desktop:type-body text-text-2">Paused</span> : null}
      <Track tour={tour} />
      <button
        type="button"
        onClick={onLeave}
        className="flex h-touch shrink-0 cursor-pointer items-center gap-2 rounded-control border border-line-strong px-3 type-strong-touch text-text hovered:border-line-hover focus-ring tablet:px-4 desktop:h-10 desktop:type-strong"
      >
        Leave
        <kbd className="hidden rounded-key border border-line-strong px-1.5 font-sans type-unit text-text-3 desktop:inline">Esc</kbd>
      </button>
    </div>
  );
}
