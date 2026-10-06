"use client";

import { useCallback, useEffect, useState } from "react";
import { loaderOf, type Catalog } from "@/lib/equipment/catalog";

// The catalog is fetched once for the page, by whoever asks first: the cards and the pickers share it.
const load = loaderOf((url) => fetch(url));

export type CatalogState = {
  catalog: Catalog | null;
  /** Why the catalog could not be loaded; null while it loads or once it has. */
  error: string | null;
  retry: () => void;
};

/** The catalog of the app's library of PAN and OND files (D75), loaded when first asked for. */
export function useEquipmentCatalog(): CatalogState {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    load().then(
      (loaded) => {
        if (!isCurrent) return;
        setCatalog(loaded);
        setError(null);
      },
      (failure: unknown) => {
        if (isCurrent) setError(failure instanceof Error ? failure.message : String(failure));
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((count) => count + 1);
  }, []);

  return { catalog, error, retry };
}
