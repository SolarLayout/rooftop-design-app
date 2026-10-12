"use client";

// The order of work as the shell shows it (D95): the step in hand, the state of each, and the steps opened, which the
// device remembers per design (lib/device/progression.ts). Opening a step records it.
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { addSeen, rememberSeen, seenOf } from "@/lib/device/progression";
import { idOf } from "@/lib/device/saving";
import { stepStatesOf, stepOfPath, waitingStepsOf, type Step, type StepState } from "@/lib/flow/steps";
import { projectOf } from "@/lib/stores/project-store";
import { designOf } from "@/lib/stores/results-store";
import { useNotes, useProject, useResults, useSaving } from "./stores";

export type Progression = { current: Step | null; states: Record<Step, StepState>; seen: readonly Step[] };

const storageOrNull = () => (typeof window === "undefined" ? null : window.localStorage);

// What is remembered changes when a step is opened: those who read it hear of it.
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};
// One array per design and content, so that the same steps read twice are the same value.
const snapshots = new Map<string, readonly Step[]>();
const NONE: readonly Step[] = [];

function seenSnapshot(design: string | null): readonly Step[] {
  const storage = storageOrNull();
  if (storage === null || design === null) return NONE;
  const seen = seenOf(storage, design);
  const key = `${design}:${seen.join(",")}`;
  const known = snapshots.get(key);
  if (known) return known;
  snapshots.set(key, seen);
  return seen;
}

export function useProgression(): Progression {
  const current = stepOfPath(usePathname());
  const design = useSaving(idOf);
  const hasDesign = useProject(projectOf) !== null;
  const notes = useNotes();
  const noOptions = useResults((results) => Boolean(designOf(results)?.no_options));
  const seen = useSyncExternalStore(subscribe, () => seenSnapshot(design), () => NONE);

  // The step opened now is added to what the device remembers of this design.
  useEffect(() => {
    const storage = storageOrNull();
    if (storage === null || design === null || current === null) return;
    const remembered = seenOf(storage, design);
    const now = addSeen(remembered, current);
    if (now.length === remembered.length) return;
    rememberSeen(storage, design, now);
    listeners.forEach((listener) => listener());
  }, [design, current]);

  const waiting = useMemo(() => waitingStepsOf(notes, noOptions), [notes, noOptions]);
  const states = useMemo(() => stepStatesOf({ current: current ?? "roof", seen, waiting, hasDesign }), [current, seen, waiting, hasDesign]);
  return { current, states, seen };
}
