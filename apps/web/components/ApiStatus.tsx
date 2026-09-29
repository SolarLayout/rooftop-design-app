"use client";

import { useEffect, useState } from "react";
import type { components } from "@rooftop/api-types";

type Health = components["schemas"]["Health"];

type State =
  | { kind: "checking" }
  | { kind: "reachable"; version: string }
  | { kind: "unreachable" };

// Shown in development only: tells whether the API answers behind the /api rewrite.
export function ApiStatus() {
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`status ${response.status}`);
        const health = (await response.json()) as Health;
        setState({ kind: "reachable", version: health.version });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ kind: "unreachable" });
      });

    return () => controller.abort();
  }, []);

  return (
    <p data-testid="api-status" data-state={state.kind} className="text-sm opacity-70">
      {state.kind === "checking" && "API: checking"}
      {state.kind === "reachable" && `API reachable (version ${state.version})`}
      {state.kind === "unreachable" && "API not reachable on port 4701"}
    </p>
  );
}
