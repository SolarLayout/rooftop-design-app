"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { SHEET_PEEK_OF_A_STEP } from "@/components/ui/design-numbers";
import { sharesOnPhone, type Shares } from "@/components/ui/sheet-stops";

/**
 * The shares of `room` a step's sheet takes at each stop on phone (V2 · 10, D106): at peek its handle, the instruction and
 * the primary; at half the stage keeps 40 % of the screen; at full a strip of the roof stays. Followed as the room or the
 * window changes size; undefined while `isOn` is false.
 */
export function usePhoneSheet(room: RefObject<HTMLElement | null>, isOn: boolean): Shares | undefined {
  const [shares, setShares] = useState<Shares | undefined>(undefined);

  useLayoutEffect(() => {
    const roomNow = room.current;
    if (!isOn || !roomNow) return;
    const measure = () => setShares(sharesOnPhone(window.innerHeight, roomNow.clientHeight, SHEET_PEEK_OF_A_STEP));
    const observer = new ResizeObserver(measure);
    observer.observe(roomNow);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [room, isOn]);

  return isOn ? shares : undefined;
}
