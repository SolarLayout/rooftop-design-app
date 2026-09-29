"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type State =
  | { kind: "checking" }
  | { kind: "reachable"; version: string }
  | { kind: "unreachable" };

// Shown in development only: tells whether the API answers behind the /api rewrite.
export function ApiStatus() {
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    const controller = new AbortController();

    api
      .getHealth({ signal: controller.signal })
      .then((health) => setState({ kind: "reachable", version: health.version }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ kind: "unreachable" });
      });

    return () => controller.abort();
  }, []);

  return (
    <p data-testid="api-status" data-state={state.kind} className="type-small text-text-2">
      {state.kind === "checking" && "API: checking"}
      {state.kind === "reachable" && `API reachable (version ${state.version})`}
      {state.kind === "unreachable" && "API not reachable"}
    </p>
  );
}
