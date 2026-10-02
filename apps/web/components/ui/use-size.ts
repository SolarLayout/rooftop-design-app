"use client";

import { useEffect, useState, type RefObject } from "react";

export type Size = { width: number; height: number };

/** The size of an element, followed as it changes; null before it was measured. */
export function useSize(element: RefObject<HTMLElement | null>): Size | null {
  const [size, setSize] = useState<Size | null>(null);
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((was) => (was?.width === width && was?.height === height ? was : { width, height }));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [element]);
  return size;
}
