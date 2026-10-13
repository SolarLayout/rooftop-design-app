"use client";

import { useResults } from "@/components/shell/stores";
import { belowTargetOf, type BelowTargetView } from "@/lib/studio/roof-inverter";
import { designOf } from "@/lib/stores/results-store";

/**
 * The problem of a design whose options all miss the DC/AC target, and the inverter for the roof that reaches it (D118):
 * the Strings step shows it at its head and the work column offers the inverter as its primary. One reading for both.
 */
export function useBelowTarget(): BelowTargetView | null {
  return belowTargetOf(useResults(designOf));
}
