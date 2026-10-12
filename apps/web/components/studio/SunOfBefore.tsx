"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStores } from "@/components/shell/stores";
import { pathOfLens } from "@/lib/routes";

/** The Sun lens's old address (D95): the Sun view on, over the step that was in hand. */
export function SunOfBefore() {
  const { view } = useStores();
  const router = useRouter();
  useEffect(() => {
    view.getState().showSunView(true);
    router.replace(pathOfLens(view.getState().lens));
  }, [view, router]);
  return null;
}
