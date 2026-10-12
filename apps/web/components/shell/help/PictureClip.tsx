"use client";

import { useEffect, useRef, useState } from "react";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { applyMeasures, measures } from "@/components/ui/measures";
import { clipShareOf } from "@/lib/help/clip-share";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { PictureLarge } from "./PictureLarge";
import { FRAME, MarksOver, MarkWords, useMatches, type MarkProps } from "./picture-parts";

type Props = {
  clip: string;
  /** Its length as the step shows it ("0:06"); the gate holds it to the file's. */
  length: string;
  /** The step's picture: what shows at rest, and where the clip cannot play. */
  poster: string;
  alt: string;
  width: number;
  height: number;
  marks: readonly MarkProps[];
};

/** At rest (the picture), coming, playing, paused, or failed (the picture stays). */
type State = "rest" | "loading" | "playing" | "paused" | "failed";

const BUTTON = "absolute top-1/2 left-1/2 grid size-12 -translate-1/2 place-items-center rounded-full bg-accent text-accent-ink shadow-primary";

/**
 * A step's clip in its picture's frame (Phase 15; components.md, "How-to steps and pictures", "A clip"): the picture with
 * play and the clip's length at rest, nothing loaded until pressed; muted and looping as it plays, a line of the accent at
 * its foot, the callouts aside; a press pauses it. Under reduced motion it plays once. Where it cannot play, the picture.
 */
export function PictureClip({ clip, length, poster, alt, width, height, marks }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<State>("rest");
  const line = useRef<HTMLSpanElement>(null);
  const still = useMatches("(prefers-reduced-motion: reduce)");
  const touch = useMatches("(pointer: coarse)");
  const [large, setLarge] = useState(false);
  // A failure stays: the events a failed clip still sends (pause) do not bring the button back.
  const unlessFailed = (next: State) => setState((now) => (now === "failed" ? now : next));

  function pressed() {
    const element = video.current;
    if (!element || state === "failed") return;
    if (!element.paused) return element.pause();
    if (state === "rest") setState("loading");
    element.play().catch(() => setState("failed"));
  }

  function opened() {
    video.current?.pause();
    setLarge(true);
  }

  const playing = state === "playing";
  const moving = playing || state === "paused";

  // The line at the foot follows the clip every frame while it plays: the video's own time events come about four times a
  // second, and the line jumped with them. Paused, it stays where the last frame put it. It begins at nothing (its style,
  // set once when it appears; a render after does not touch it, as the value given does not change).
  useEffect(() => {
    const element = video.current;
    if (!moving || !element) return;
    let frame = 0;
    const follow = () => {
      if (line.current) applyMeasures(line.current, { span: clipShareOf(element.currentTime, element.duration) });
      if (!element.paused) frame = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(frame);
  }, [moving, playing]);
  return (
    <>
      <div className="relative">
        <button
          type="button"
          aria-label={`${playing ? "Pause" : "Play"} the clip: ${alt}`}
          aria-disabled={state === "failed" || undefined}
          onClick={pressed}
          className={classNames(FRAME, state === "failed" ? "cursor-default" : "cursor-pointer", "focus-ring")}
        >
          <video
            ref={video}
            src={clip}
            poster={poster}
            width={width}
            height={height}
            muted
            playsInline
            loop={!still}
            preload="none"
            onPlaying={() => unlessFailed("playing")}
            onPause={() => unlessFailed("paused")}
            onEnded={() => unlessFailed("paused")}
            onError={() => setState("failed")}
            className="block h-auto w-full"
          />
          {moving ? null : <MarksOver marks={marks} />}
          {playing ? null : (
            <span aria-hidden="true" className={BUTTON}>
              {state === "loading" ? <ProgressRing size={20} /> : <Icon name={state === "failed" ? "note" : "play"} size={20} />}
            </span>
          )}
          {state === "rest" || state === "loading" ? (
            <span aria-hidden="true" className="absolute right-2 bottom-2 rounded-control bg-ground/80 px-2 type-unit text-text">
              {length}
            </span>
          ) : null}
          {moving ? (
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-ground/60">
              <span ref={line} className="block h-full w-span bg-accent" style={measures({ span: 0 })} />
            </span>
          ) : null}
        </button>
        {/* On touch, beside the press that plays it: the clip at the width of the screen, as a picture opens large. */}
        {touch && state !== "failed" ? (
          <button
            type="button"
            aria-label={`Open the clip larger: ${alt}`}
            onClick={opened}
            className="absolute top-2 right-2 grid size-touch place-items-center focus-ring"
          >
            <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-surface-1 text-text-2 shadow-float">
              <Icon name="search" size={14} />
            </span>
          </button>
        ) : null}
      </div>
      {state === "failed" ? <p className="type-body-touch desktop:type-body text-text-3">The clip did not load. The picture shows the step.</p> : null}
      {large ? (
        <PictureLarge src={poster} alt={alt} width={width} height={height} marks={null} words={<MarkWords marks={marks} />} clip={clip} once={still} onClose={() => setLarge(false)} />
      ) : null}
    </>
  );
}
