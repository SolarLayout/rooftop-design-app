"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { measures } from "@/components/ui/measures";
import { fitted, panned, pinched, type Point, type Size, type View } from "@/lib/help/zoom";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** The callouts as drawn over the picture: they scale with it. */
  marks: ReactNode;
  /** A clip to play in the picture's place (Phase 15): from the start, muted, looping unless `once`. */
  clip?: string;
  once?: boolean;
  /** Their words, under it. */
  words: ReactNode;
  onClose: () => void;
};

/**
 * A how-to's picture opened large on touch (D81; components.md, "How-to steps and pictures"): over the help sheet, the
 * whole screen, the picture the screen's width, pinched to look closer and moved with a finger; × or Escape returns to the
 * step. Opened by its picture, or by a clip's magnifier, when it plays the clip there (Phase 15); closed, it is gone.
 */
export function PictureLarge({ src, alt, width, height, marks, words, clip, once, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const picture: Size = { width, height };
  const [frame, setFrame] = useState<Size | null>(null);
  const [view, setView] = useState<View | null>(null);
  const fingers = useRef(new Map<number, Point>());

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    const box = frameRef.current?.getBoundingClientRect();
    if (box) {
      const measured = { width: box.width, height: box.height };
      setFrame(measured);
      setView(fitted(measured, { width, height }));
    }
  }, [width, height]);

  function at(event: PointerEvent): Point {
    const box = frameRef.current?.getBoundingClientRect();
    return { x: event.clientX - (box?.left ?? 0), y: event.clientY - (box?.top ?? 0) };
  }

  function moved(event: PointerEvent) {
    const before = fingers.current.get(event.pointerId);
    if (!before || !frame) return;
    const now = at(event);
    const other = [...fingers.current.entries()].find(([id]) => id !== event.pointerId)?.[1];
    // Each finger's move comes as an event of its own, two before a render: each builds on the view the one before made.
    setView((view) => {
      if (!view) return view;
      return other ? pinched(view, [before, other], [now, other], frame, picture) : panned(view, { x: now.x - before.x, y: now.y - before.y }, frame, picture);
    });
    fingers.current.set(event.pointerId, now);
  }

  function lifted(event: PointerEvent) {
    fingers.current.delete(event.pointerId);
  }

  return (
    <dialog
      ref={dialog}
      aria-label={alt}
      onClose={onClose}
      className="fixed inset-0 size-full max-h-none max-w-none flex-col bg-ground p-0 pt-safe-0 px-safe-0 text-text outline-none backdrop:bg-dim open:flex"
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-line-subtle py-1 pr-1 pl-4">
        <span className="grow type-small text-text-3">Pinch to look closer</span>
        <IconButton label="Close the picture" icon="close" iconSize={18} kind="quiet" size="l" onClick={() => dialog.current?.close()} />
      </div>
      <div
        ref={frameRef}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          fingers.current.set(event.pointerId, at(event));
        }}
        onPointerMove={moved}
        onPointerUp={lifted}
        onPointerCancel={lifted}
        className="relative min-h-0 grow touch-none overflow-hidden"
      >
        {view ? (
          <div className="absolute top-0 left-0 w-full zoomed" style={measures({ zoom: view.scale, x: view.x, y: view.y })}>
            {clip ? (
              // Opened by a press, so it plays at once; the callouts step aside while a clip plays.
              <video src={clip} poster={src} width={width} height={height} aria-label={alt} autoPlay muted playsInline loop={!once} className="block h-auto w-full" />
            ) : (
              <>
                <Image src={src} alt={alt} width={width} height={height} sizes={`${width}px`} className="block h-auto w-full" draggable={false} />
                {marks}
              </>
            )}
          </div>
        ) : null}
      </div>
      <div className="shrink-0 border-t border-line-subtle px-4 pt-3 pb-safe-5">{words}</div>
    </dialog>
  );
}
