import { useSyncExternalStore } from "react";
import { hasWebGL } from "@/lib/map/map-state";

// A fact of the browser, read once: whether it can draw with WebGL. On the server it is not known.
let known: boolean | null = null;
const never = () => () => {};
const onTheClient = () => (known ??= hasWebGL());
const onTheServer = () => null;

/** Whether this browser can draw with WebGL; null until the page is in a browser. */
export function useWebGL(): boolean | null {
  return useSyncExternalStore(never, onTheClient, onTheServer);
}
