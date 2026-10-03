"use client";

import { useEffect } from "react";
import { openWhatBelongs } from "@/lib/device/opening";
import { rememberedOf } from "@/lib/device/remembered";
import { projectOf } from "@/lib/stores/project-store";
import { useStores } from "./stores";

/**
 * A page without a design opens the design remembered as open, from the device, else the demo (plan/phase-10-plan.md,
 * decision 2); the flow runs what is opened. A kept design that cannot be read opens the demo and says so. The shell
 * does this for the three workspaces, Present for itself (decision 8): one opening, not two.
 */
export function useOpensWhatBelongs(): void {
  const { flow, project, saving, toasts } = useStores();

  useEffect(() => {
    if (projectOf(project.getState()) !== null) return;
    void openWhatBelongs({
      remembered: rememberedOf(window.localStorage),
      openFromDevice: (id) => saving.getState().openFromDevice(id),
      openDemo: flow.openDemo,
      say: (words) => void toasts.show({ kind: "note", words }),
    });
  }, [flow, project, saving, toasts]);
}
