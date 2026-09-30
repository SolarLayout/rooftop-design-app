// What follows a committed edit (decision D8: there is no Run button). The layout is asked for at once.
// The design run is asked for after a pause, so that edits shortly after each other are one run. What
// was overtaken is given up by its signal. The results of before stay in their store until newer ones
// are there.
//
// The calls go through the client of the API (lib/api) and nothing else.
import { DESIGN_PAUSE } from "../../components/ui/design-numbers";
import { api as apiOfTheApp, ApiError, type Api, type Project } from "../api";
import { CLOCK_OF_THE_BROWSER, type Clock } from "../clock";
import type { ProjectState, ProjectStore } from "../stores/project-store";
import type { Failure, ResultsStore } from "../stores/results-store";

export type FlowApi = Pick<Api, "computeLayout" | "runDesign">;

type Options = {
  project: ProjectStore;
  results: ResultsStore;
  api?: FlowApi;
  clock?: Clock;
};

export type DesignFlow = {
  /** Begins to listen to the project. A design that is open already is asked for at once. */
  start: () => void;
  /** Asks again for what failed, at once, with the document as it is now. */
  tryAgain: () => void;
  /** Gives up what is on its way and listens no longer. */
  stop: () => void;
};

function failureOf(error: unknown): Failure {
  if (error instanceof ApiError) return { code: error.code, message: error.message };
  const what = error instanceof Error ? error.message : String(error);
  return {
    code: "unexpected_fault",
    message: `Something went wrong in the app: ${what}. Try again; if it fails again, report it.`,
  };
}

export function createDesignFlow({ project, results, api = apiOfTheApp, clock = CLOCK_OF_THE_BROWSER }: Options): DesignFlow {
  let followed = 0;
  let layoutCall: AbortController | null = null;
  let designCall: AbortController | null = null;
  let giveUpThePause: (() => void) | null = null;
  let stopListening: (() => void) | null = null;

  function giveUpTheLayout() {
    layoutCall?.abort();
    layoutCall = null;
  }

  function giveUpTheRun() {
    giveUpThePause?.();
    giveUpThePause = null;
    designCall?.abort();
    designCall = null;
  }

  function askForTheLayout(document: Project, edit: number) {
    giveUpTheLayout();
    const call = new AbortController();
    layoutCall = call;
    results.getState().layoutAsked(edit);
    api
      .computeLayout(document, { signal: call.signal })
      .then(
        (layout) => results.getState().layoutArrived(edit, layout),
        (error: unknown) => {
          // A request that was given up is no failure.
          if (!call.signal.aborted) results.getState().layoutFailed(edit, failureOf(error));
        },
      )
      .finally(() => {
        // What has answered cannot be given up any more.
        if (layoutCall === call) layoutCall = null;
      });
  }

  function run(document: Project, edit: number) {
    giveUpTheRun();
    const call = new AbortController();
    designCall = call;
    results.getState().designBegan(edit);
    api
      .runDesign(document, {
        signal: call.signal,
        onProgress: (progress) => {
          if (!call.signal.aborted) results.getState().designProgressed(edit, progress);
        },
      })
      .then(
        (design) => results.getState().designArrived(edit, design),
        (error: unknown) => {
          if (!call.signal.aborted) results.getState().designFailed(edit, failureOf(error));
        },
      )
      .finally(() => {
        if (designCall === call) designCall = null;
      });
  }

  function runAfterThePause(document: Project, edit: number) {
    giveUpTheRun();
    results.getState().designWaits(edit);
    giveUpThePause = clock.after(DESIGN_PAUSE, () => {
      giveUpThePause = null;
      run(document, edit);
    });
  }

  function follow({ project: document, edit, openedAt }: ProjectState) {
    if (document === null || edit === followed) return;
    followed = edit;
    const isOpened = openedAt === edit;
    if (isOpened) {
      giveUpTheLayout();
      giveUpTheRun();
      results.getState().clear();
    }
    askForTheLayout(document, edit);
    // Nobody edits a design that is just opened: its run need not wait.
    if (isOpened) run(document, edit);
    else runAfterThePause(document, edit);
  }

  return {
    start() {
      if (stopListening) return;
      stopListening = project.subscribe(follow);
      follow(project.getState());
    },
    tryAgain() {
      const { project: document, edit } = project.getState();
      if (document === null) return;
      if (results.getState().layout.status === "failed") askForTheLayout(document, edit);
      if (results.getState().design.status === "failed") run(document, edit);
    },
    stop() {
      stopListening?.();
      stopListening = null;
      giveUpTheLayout();
      giveUpTheRun();
    },
  };
}
