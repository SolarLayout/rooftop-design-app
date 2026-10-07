import Image from "next/image";
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { classNames } from "@/components/ui/class-names";
import { measures } from "@/components/ui/measures";

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

/** A numbered mark of the accent, in the light of the ? disc. */
const MARK = "grid shrink-0 place-items-center rounded-full bg-accent font-semibold text-accent-ink tabular-nums shadow-primary type-label-s";

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

type MarkProps = { n: number; x: number; y: number; ring?: boolean; children: ReactNode };

/** A callout of a picture: read by Picture, which draws it over the picture and its words under it. Outside one, its words. */
export function Mark({ children }: MarkProps) {
  return <>{children}</>;
}

type PictureProps = { src: string; alt: string; width: number; height: number; children?: ReactNode };

/** A picture of the app, its callouts drawn over it (crisp at every size) and their words under it. */
export function Picture({ src, alt, width, height, children }: PictureProps) {
  const marks = Children.toArray(children)
    .filter((child): child is ReactElement<MarkProps> => isValidElement(child) && child.type === Mark)
    .map(({ props }) => props);
  return (
    <figure className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-row border border-line bg-surface-2">
        <Image src={src} alt={alt} width={width} height={height} sizes="(min-width: 834px) 380px, 100vw" className="block h-auto w-full" />
        {marks.map(({ n, x, y, ring }) => (
          // The place is the topic's, in per cent of the picture: data, not a size of the design.
          <span key={n} aria-hidden="true" className="absolute left-at top-down" style={measures({ at: x / 100, down: y / 100 })}>
            {ring ? <span className="absolute size-10 -translate-1/2 rounded-full border-help-ring border-accent shadow-help-ring" /> : null}
            <span className={classNames(MARK, "absolute size-5", ring ? "translate-x-2 translate-y-2" : "-translate-1/2")}>{n}</span>
          </span>
        ))}
      </div>
      {marks.length > 0 ? (
        <figcaption>
          <ol className="flex flex-col gap-1">
            {marks.map(({ n, children: words }) => (
              <li key={n} className="flex items-start gap-2 type-small text-text-2">
                <span aria-hidden="true" className={classNames(MARK, "mt-0.5 size-4")}>
                  {n}
                </span>
                <span>{words}</span>
              </li>
            ))}
          </ol>
        </figcaption>
      ) : null}
    </figure>
  );
}

/** A key or a gesture, in the chip of the tips. */
export function Key({ children }: { children: ReactNode }) {
  return <kbd className="rounded-xs border border-line-strong px-1.5 type-label-s font-semibold text-text">{children}</kbd>;
}

/** Words for a mouse: shown where the pointer is fine. */
export function Pointer({ children }: { children: ReactNode }) {
  return <span className="pointer-coarse:hidden">{children}</span>;
}

/** Words for touch: shown where the pointer is coarse. */
export function Touch({ children }: { children: ReactNode }) {
  return <span className="hidden pointer-coarse:inline">{children}</span>;
}
