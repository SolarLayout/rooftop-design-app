// The address of the Rooftop docs for the app where it runs (D91): read from the browser's own address once it is there;
// on the server and in the first render, production's.
import { useSyncExternalStore } from "react";
import { docsHomeOf } from "@/lib/docs/docs";

const nothingToHear = () => () => {};

export const useDocsHome = (): string =>
  useSyncExternalStore(nothingToHear, () => docsHomeOf(window.location.host), () => docsHomeOf(""));
