// What follows a committed edit (decision D8: there is no Run button). The layout is asked for at once.
// The design run is asked for after a pause, so that edits shortly after each other are one run. What
// was overtaken is given up by its signal. The results of before stay in their store until newer ones
// are there.
//
// The calls go through the client of the API (lib/api) and nothing else.
import { DESIGN_PAUSE } from "../../components/ui/design-numbers";
import { api as apiOfTheApp, ApiError, type Api, type Project } from "../api";
import { CLOCK_OF_THE_BROWSER, type Clock } from "../clock";
import { hoursOf, QUARTER_HOUR } from "../scene/sun-day";
import { heldHourOf } from "../studio/sun-time";
import type { ProjectState, ProjectStore } from "../stores/project-store";
import { sunKeyOf, type Failure, type ResultsStore, type SunDay, type SunKey } from "../stores/results-store";
import type { ViewStore } from "../stores/view-store";

export type FlowApi = Pick<Api, "getDemo" | "computeLayout" | "runDesign" | "computeSun">;

type Options = {
  project: ProjectStore;
  results: ResultsStore;
  view: ViewStore;
  api?: FlowApi;
  clock?: Clock;
};

export type DesignFlow = {
  /** Begins to listen to the project. A design that is open already is asked for at once. */
  start: () => void;
  /** Asks the API for the demo and opens it, as it is handed out. Until it is there the design is on its way. */
  openDemo: () => void;
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

export function createDesignFlow({ project, results, view, api = apiOfTheApp, clock = CLOCK_OF_THE_BROWSER }: Options): DesignFlow {
  let followed = 0;
  let sunCall: AbortController | null = null;
  let sunAsked: string | null = null;
  let stopFollowingTheView: (() => void) | null = null;
  let layoutCall: AbortController | null = null;
  let designCall: AbortController | null = null;
  let giveUpThePause: (() => void) | null = null;
  let stopListening: (() => void) | null = null;
  let demoCall: AbortController | null = null;
  let hasTheDemoFailed = false;

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

  function giveUpTheDemo() {
    demoCall?.abort();
    demoCall = null;
  }

  function giveUpTheSun() {
    sunCall?.abort();
    sunCall = null;
    sunAsked = null;
  }

  /**
   * The sun of the scene: a whole day of it over the roof, a quarter hour apart (plan/phase-06-plan.md,
   * decision 1), for the view's day; the design day is the array's when it has one (decision 2). Asked
   * when the place or the day changes, never for the hour; what was asked before is given up.
   */
  function askForTheSun() {
    const document = project.getState().project;
    if (document === null) return;
    const { day: viewDay } = view.getState().sunTime;
    const day = viewDay === "design_day" ? (document.array.design_doy ?? "design_day") : viewDay;
    const key: SunKey = { lat: document.roof.lat, lon: document.roof.lon, day };
    const keyed = sunKeyOf(key);
    if (keyed === sunAsked) return;
    giveUpTheSun();
    sunAsked = keyed;
    const call = new AbortController();
    sunCall = call;
    results.getState().sunAsked(key);
    api
      .computeSun({ lat: key.lat, lon: key.lon, day: key.day, step_h: QUARTER_HOUR }, { signal: call.signal })
      .then(
        (answer) => {
          const day: SunDay = {
            ...key,
            dayOfYear: answer.day_of_year,
            sunriseH: answer.sunrise_h,
            sunsetH: answer.sunset_h,
            positions: answer.positions.map((position) => ({ hour: position.hour, elevationDeg: position.elevation_deg, azimuthDeg: position.azimuth_deg })),
          };
          results.getState().sunArrived(day);
          // The time stays inside the hours of the day it is of (plan/phase-06-plan.md, decision 4).
          const time = view.getState().sunTime;
          const held = heldHourOf(time.hour, hoursOf(day));
          if (results.getState().sun.value === day && held !== time.hour) view.getState().setSunTime({ ...time, hour: held });
        },
        (error: unknown) => {
          if (!call.signal.aborted) results.getState().sunFailed(key, failureOf(error));
        },
      )
      .finally(() => {
        if (sunCall === call) sunCall = null;
      });
  }

  function openDemo() {
    giveUpTheDemo();
    giveUpTheLayout();
    giveUpTheRun();
    hasTheDemoFailed = false;
    const call = new AbortController();
    demoCall = call;
    // The edit that the demo will be: until then the results say that it is on its way.
    const edit = project.getState().edit + 1;
    results.getState().clear();
    results.getState().designBegan(edit);
    api
      .getDemo({ signal: call.signal })
      .then(
        (demo) => {
          if (!call.signal.aborted) project.getState().open(demo);
        },
        (error: unknown) => {
          if (call.signal.aborted) return;
          hasTheDemoFailed = true;
          results.getState().designFailed(edit, failureOf(error));
        },
      )
      .finally(() => {
        if (demoCall === call) demoCall = null;
      });
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
    // A design was opened, by whatever way: a demo that is still on its way is not waited for.
    giveUpTheDemo();
    hasTheDemoFailed = false;
    const isOpened = openedAt === edit;
    if (isOpened) {
      giveUpTheLayout();
      giveUpTheRun();
      giveUpTheSun();
      results.getState().clear();
    }
    askForTheLayout(document, edit);
    askForTheSun();
    // Nobody edits a design that is just opened: its run need not wait.
    if (isOpened) run(document, edit);
    else runAfterThePause(document, edit);
  }

  return {
    start() {
      if (stopListening) return;
      stopListening = project.subscribe(follow);
      stopFollowingTheView = view.subscribe(askForTheSun);
      follow(project.getState());
    },
    openDemo,
    tryAgain() {
      const { project: document, edit } = project.getState();
      if (hasTheDemoFailed) openDemo();
      if (document === null) return;
      if (results.getState().layout.status === "failed") askForTheLayout(document, edit);
      if (results.getState().design.status === "failed") run(document, edit);
    },
    stop() {
      stopListening?.();
      stopListening = null;
      stopFollowingTheView?.();
      stopFollowingTheView = null;
      giveUpTheDemo();
      giveUpTheLayout();
      giveUpTheRun();
      giveUpTheSun();
    },
  };
}
