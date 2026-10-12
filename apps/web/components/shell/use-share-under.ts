"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { shareUnder } from "@/components/ui/sheet-stops";

/**
 * The share of `room` that lies under `above`, which stands at its top, followed as either changes size;
 * undefined while it is not measured or `isOn` is false. A sheet in the room that takes this share at half
 * meets the foot of what is above it, on a screen of any height.
 */
export function useShareUnder(room: RefObject<HTMLElement | null>, above: RefObject<HTMLElement | null>, isOn: boolean): number | undefined {
  const [share, setShare] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const roomNow = room.current;
    const aboveNow = above.current;
    if (!isOn || !roomNow || !aboveNow) return;
    // The observer reports each element once as it starts to observe it, then on every change of size.
    const observer = new ResizeObserver(() => {
      const foot = aboveNow.getBoundingClientRect().bottom - roomNow.getBoundingClientRect().top;
      setShare(shareUnder(roomNow.clientHeight, foot) ?? undefined);
    });
    observer.observe(roomNow);
    observer.observe(aboveNow);
    return () => observer.disconnect();
  }, [room, above, isOn]);

  return isOn ? share : undefined;
}
