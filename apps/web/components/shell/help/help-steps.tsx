"use client";

import Image from "next/image";
import { Children, cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { PictureClip } from "./PictureClip";
import { PictureLarge } from "./PictureLarge";
import { FRAME, MARK, MarksOver, MarkWords, PictureFailed, useLoading, useMatches, type MarkProps } from "./picture-parts";

// A how-to in a help topic (D81; components.md, "How-to steps and pictures"): numbered steps, each with a picture of the
// app and callouts over it; the words of the hand in use; a key in the chip of the tips. Written in a topic so:
//   <Steps>
//   <Step title="Pick the roof up">
//   <Pointer>Click inside the roof.</Pointer><Touch>Press inside the roof.</Touch>
//   <Picture src="/help/find/move-the-roof/1.jpg" alt="…" width={1038} height={544}>
//     <Mark n={1} x={22} y={38.1} ring>Inside the roof, on a clear spot</Mark>
//   </Picture>
//   </Step>
//   </Steps>
// The gate (tools/help/pictures-in-topics.ts) holds each picture to its file and its callouts to three, in order, inside it.

type StepProps = { title: string; children?: ReactNode; n?: number; last?: boolean };

/** The steps of a how-to, numbered in their order, a line joining each to the next. */
export function Steps({ children }: { children: ReactNode }) {
  const steps = Children.toArray(children).filter((child): child is ReactElement<StepProps> => isValidElement(child));
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => cloneElement(step, { key: index, n: index + 1, last: index === steps.length - 1 }))}
    </ol>
  );
}

/** A step: its number, its title, and what to do (words, a picture). Numbered by Steps. */
export function Step({ title, children, n, last }: StepProps) {
  return (
    <li className="flex gap-3">
      <div className="flex shrink-0 flex-col items-center">
        <span className={classNames(MARK, "size-6")}>{n}</span>
        {last ? null : <span aria-hidden="true" className="w-px grow bg-line" />}
      </div>
      <div className={classNames("flex min-w-0 grow flex-col gap-2 text-text-2", last ? "pb-1" : "pb-6")}>
        <h4 className="pt-0.5 font-semibold text-text">{title}</h4>
        {children}
      </div>
    </li>
  );
}

/** A callout of a picture: read by Picture, which draws it over the picture and its words under it. Outside one, its words. */
export function Mark({ children }: MarkProps) {
  return <>{children}</>;
}

/** A picture, and its clip when its step has one (Phase 15): the clip's file and its length as the step shows it ("0:06"). */
type PictureProps = { src: string; alt: string; width: number; height: number; children?: ReactNode; clip?: string; length?: string };

const COARSE = "(pointer: coarse)";

/**
 * A picture of the app, its callouts drawn over it (crisp at every size) and their words under it. On touch it is pressed
 * to open it large, where it pinches (PictureLarge); a magnifier in its corner says so. A picture with a clip plays it in
 * its frame (PictureClip).
 */
export function Picture({ src, alt, width, height, children, clip, length }: PictureProps) {
  const touch = useMatches(COARSE);
  const [large, setLarge] = useState(false);
  const loading = useLoading();
  const marks = Children.toArray(children)
    .filter((child): child is ReactElement<MarkProps> => isValidElement(child) && child.type === Mark)
    .map(({ props }) => props);
  const image = <Image key={loading.attempt} src={src} alt={alt} width={width} height={height} sizes="(min-width: 834px) 380px, 100vw" onError={loading.failedNow} className="block h-auto w-full" />;
  if (clip) {
    return (
      <figure className="flex flex-col gap-2">
        <PictureClip clip={clip} length={length ?? ""} poster={src} alt={alt} width={width} height={height} marks={marks} />
        {marks.length > 0 ? (
          <figcaption>
            <MarkWords marks={marks} />
          </figcaption>
        ) : null}
      </figure>
    );
  }
  return (
    <figure className="flex flex-col gap-2">
      {loading.failed ? (
        <PictureFailed onRetry={loading.retry} />
      ) : touch ? (
        <button type="button" aria-label={`Open the picture larger: ${alt}`} onClick={() => setLarge(true)} className={classNames(FRAME, "cursor-pointer focus-ring")}>
          {image}
          <MarksOver marks={marks} />
          <span aria-hidden="true" className="absolute right-2 bottom-2 grid size-7 place-items-center rounded-full bg-surface-1 text-text-2 shadow-float">
            <Icon name="search" size={14} />
          </span>
        </button>
      ) : (
        <div className={FRAME}>
          {image}
          <MarksOver marks={marks} />
        </div>
      )}
      {marks.length > 0 ? (
        <figcaption>
          <MarkWords marks={marks} />
        </figcaption>
      ) : null}
      {large ? (
        <PictureLarge src={src} alt={alt} width={width} height={height} marks={<MarksOver marks={marks} />} words={<MarkWords marks={marks} />} onClose={() => setLarge(false)} />
      ) : null}
    </figure>
  );
}

/** A key or a gesture, in the chip of the tips. */
export function Key({ children }: { children: ReactNode }) {
  return <kbd className="rounded-control border border-line-strong px-1.5 type-unit font-semibold text-text">{children}</kbd>;
}

/** Words for a mouse: shown where the pointer is fine. */
export function Pointer({ children }: { children: ReactNode }) {
  return <span className="pointer-coarse:hidden">{children}</span>;
}

/** Words for touch: shown where the pointer is coarse. */
export function Touch({ children }: { children: ReactNode }) {
  return <span className="hidden pointer-coarse:inline">{children}</span>;
}
