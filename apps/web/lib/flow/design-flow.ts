// What follows a committed edit (decision D8: there is no Run button). The layout is asked for at once.
// The design run is asked for after a pause, so that edits shortly after each other are one run. What
// was overtaken is given up by its signal. The results of before stay in their store until newer ones
// are there.
//
// A run refused for want of weather loads the weather of the document's source for its site, puts it into the
// document of that edit (no step of undo) and runs again, once per edit (plan/phase-08-plan.md, decision 11).
//
// The calls go through the client of the API (lib/api) and nothing else.
import { DESIGN_PAUSE, TIME_REST } from "../../components/ui/design-numbers";
import { partsOfAnEdit } from "./edit-parts";
import { api as apiOfTheApp, ApiError, type Api, type DesignResult, type Project } from "../api";
import { CLOCK_OF_THE_BROWSER, type Clock } from "../clock";
import { stepOfLoading, weatherRequestOf, withWeatherLoaded } from "../performance/weather-source";
import { hoursOf, QUARTER_HOUR } from "../scene/sun-day";
import { heldHourOf } from "../studio/sun-time";
import type { ProjectState, ProjectStore } from "../stores/project-store";
import { sunKeyOf, withTheChoice, type Failure, type ResultsStore, type SunDay, type SunKey } from "../stores/results-store";
import type { ViewStore } from "../stores/view-store";

export type FlowApi = Pick<Api, "getDemo" | "computeLayout" | "runDesign" | "computeSun" | "loadWeather">;

type Options = {
  project: ProjectStore;
  results: ResultsStore;
  view: ViewStore;
  api?: FlowApi;
  clock?: Clock;
  /** Hears the run of the untouched demo when it lands (plan/phase-10-plan.md, step 11): Home's card shows its numbers. */
  onDemoRan?: (design: DesignResult) => void;
};

export type DesignFlow = {
  /** Begins to listen to the project. A design that is open already is asked for at once. */
  start: () => void;
  /**
   * Opens the demo: the document handed in, at once and without a request (Home has it for its card), or else the API's,
   * asked for and opened as it is handed out; until it is there the design is on its way.
   */
  openDemo: (demo?: Project) => void;
  /** Asks again for what failed, at once, with the document as it is now. */
  tryAgain: () => void;
  /** Gives up what is on its way and listens no longer. */
  stop: () => void;
};

/** The API's refusal of a run whose document holds no weather for its site: the one the flow answers itself. */
const NO_WEATHER = "weather_not_loaded";

const isForWantOfWeather = (error: unknown): boolean => error instanceof ApiError && error.code === NO_WEATHER;

/** What failed, in the API's words, or in words of the app for a fault that is not the API's. */
export function failureOf(error: unknown): Failure {
  if (error instanceof ApiError) return { code: error.code, message: error.message };
  const what = error instanceof Error ? error.message : String(error);
  return {
    code: "unexpected_fault",
    message: `Something went wrong in the app: ${what}. Try again; if it fails again, report it.`,
  };
}

export function createDesignFlow({ project, results, view, api = apiOfTheApp, clock = CLOCK_OF_THE_BROWSER, onDemoRan }: Options): DesignFlow {
  let followed = 0;
  /** The edit at which the demo was opened: the run of that edit is the untouched demo's. Edits only grow, so no later edit is it. */
  let demoEdit: number | null = null;
  /** The document of the edit followed last: what the next edit is compared with. */
  let documentFollowed: Project | null = null;
  let sunCall: AbortController | null = null;
  let sunAsked: string | null = null;
  let stopFollowingTheView: (() => void) | null = null;
  let shadowsCall: AbortController | null = null;
  let shadowsAsked: string | null = null;
  let giveUpTheShadowsPause: (() => void) | null = null;
  /** The roof the outlines were last keyed by, and how many roofs there were: a new roof is a new key. */
  let roofOfTheShadows: Project["roof"] | null = null;
  let roofsSeen = 0;
  let layoutCall: AbortController | null = null;
  let designCall: AbortController | null = null;
  let weatherCall: AbortController | null = null;
  /** The edit whose weather came: a second refusal of it is the run's failure (decision 11, and its risk). A load that failed may be tried again. */
  let weatherLoadedFor: number | null = null;
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
    weatherCall?.abort();
    weatherCall = null;
  }

  function giveUpTheDemo() {
    demoCall?.abort();
    demoCall = null;
  }

  function giveUpTheShadows() {
    giveUpTheShadowsPause?.();
    giveUpTheShadowsPause = null;
    shadowsCall?.abort();
    shadowsCall = null;
    shadowsAsked = null;
  }

  /**
   * The engine's shadow outlines (plan/phase-06-plan.md, decisions 7 and 8): while their switch is on, for
   * the roof alone at the view's day and hour, asked once the time has stood still for TIME_REST; what was
   * on its way before is given up. The results show them only while the time is the one they are of.
   */
  function followTheShadows() {
    const document = project.getState().project;
    const { sunTime, onTheRoof } = view.getState();
    if (document === null || !onTheRoof.shadowOutlines) {
      giveUpTheShadows();
      results.getState().shadowsWanted(null);
      return;
    }
    if (document.roof !== roofOfTheShadows) {
      roofOfTheShadows = document.roof;
      roofsSeen += 1;
    }
    const day = sunTime.day === "design_day" ? (document.array.design_doy ?? "design_day") : sunTime.day;
    const key = `${sunKeyOf({ lat: document.roof.lat, lon: document.roof.lon, day })},${sunTime.hour},roof ${roofsSeen}`;
    if (key === shadowsAsked) return;
    giveUpTheShadows();
    shadowsAsked = key;
    results.getState().shadowsWanted(key);
    const roof = document.roof;
    const { hour } = sunTime;
    giveUpTheShadowsPause = clock.after(TIME_REST, () => {
      giveUpTheShadowsPause = null;
      const call = new AbortController();
      shadowsCall = call;
      api
        .computeSun({ lat: roof.lat, lon: roof.lon, day, hours: [hour], shadows: { roof, hour } }, { signal: call.signal })
        .then(
          (answer) => results.getState().shadowsArrived({ key, hour, polygons: answer.shadows?.polygons ?? [] }),
          (error: unknown) => {
            if (!call.signal.aborted) results.getState().shadowsFailed(key, failureOf(error));
          },
        )
        .finally(() => {
          if (shadowsCall === call) shadowsCall = null;
        });
    });
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

  function openDemo(given?: Project) {
    giveUpTheDemo();
    giveUpTheLayout();
    giveUpTheRun();
    hasTheDemoFailed = false;
    // The edit that the demo will be: until then the results say that it is on its way.
    const edit = project.getState().edit + 1;
    if (given !== undefined) {
      demoEdit = edit;
      project.getState().open(given);
      return;
    }
    const call = new AbortController();
    demoCall = call;
    results.getState().clear();
    results.getState().designBegan(edit);
    api
      .getDemo({ signal: call.signal })
      .then(
        (demo) => {
          if (call.signal.aborted) return;
          demoEdit = edit;
          project.getState().open(demo);
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

  /**
   * The weather of the document's source for its site, for a run refused for want of it (decision 11): the step says
   * what is loaded; what comes goes into the document of the edit without a step of undo, and the run is asked again
   * with it under the same edit. What does not come is the run's failure, in the API's words. An edit meanwhile gives
   * the load up, as it gives up the run.
   */
  function loadTheWeatherThenRun(document: Project, edit: number) {
    const call = new AbortController();
    weatherCall = call;
    results.getState().designProgressed(edit, { type: "progress", step: stepOfLoading(document), fraction: 0 });
    api
      .loadWeather(weatherRequestOf(document), { signal: call.signal })
      .then(
        (answer) => {
          if (call.signal.aborted) return;
          weatherCall = null;
          weatherLoadedFor = edit;
          const withTheWeather = withWeatherLoaded(answer.weather);
          // Once another edit is current the document is no longer this one; the run of this edit still has its weather.
          const amended = project.getState().amend(edit, withTheWeather) ?? withTheWeather(document);
          run(amended, edit);
        },
        (error: unknown) => {
          if (!call.signal.aborted) results.getState().designFailed(edit, failureOf(error));
        },
      )
      .finally(() => {
        if (weatherCall === call) weatherCall = null;
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
        (design) => {
          // An option chosen while the run was on its way is the one the run lands with (plan/phase-07-plan.md, decision 3).
          results.getState().designArrived(edit, withTheChoice(design, project.getState().project?.chosen_option));
          if (edit === demoEdit) onDemoRan?.(design);
        },
        (error: unknown) => {
          if (call.signal.aborted) return;
          if (isForWantOfWeather(error) && weatherLoadedFor !== edit) return loadTheWeatherThenRun(document, edit);
          results.getState().designFailed(edit, failureOf(error));
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
    if (document === null) return;
    if (edit === followed) {
      // The edit followed was amended (the weather loaded for it): the next edit is compared with the document as it is.
      documentFollowed = document;
      return;
    }
    followed = edit;
    // A design was opened, by whatever way: a demo that is still on its way is not waited for.
    giveUpTheDemo();
    hasTheDemoFailed = false;
    const isOpened = openedAt === edit;
    const before = documentFollowed;
    documentFollowed = document;
    if (isOpened) {
      giveUpTheLayout();
      giveUpTheRun();
      giveUpTheSun();
      results.getState().clear();
    }
    // An edit asks for what it changes (plan/phase-07-plan.md, decision 2): the layout only for the roof, the
    // array or the module; nothing at all for the option chosen, which the run's answer already holds.
    const parts = isOpened || before === null ? { layout: true, run: true } : partsOfAnEdit(before, document);
    if (parts.layout) askForTheLayout(document, edit);
    askForTheSun();
    followTheShadows();
    // The option chosen is shown from the run's answer at once.
    if (!isOpened && before !== null && document.chosen_option !== before.chosen_option) results.getState().optionChosen(document.chosen_option);
    if (!parts.run) return;
    // Nobody edits a design that is just opened: its run need not wait.
    if (isOpened) run(document, edit);
    else runAfterThePause(document, edit);
  }

  return {
    start() {
      if (stopListening) return;
      stopListening = project.subscribe(follow);
      stopFollowingTheView = view.subscribe(() => {
        askForTheSun();
        followTheShadows();
      });
      follow(project.getState());
    },
    openDemo,
    tryAgain() {
      const { project: document, edit } = project.getState();
      if (hasTheDemoFailed) openDemo();
      if (document === null) return;
      if (results.getState().layout.status === "failed") askForTheLayout(document, edit);
      if (results.getState().design.status === "failed") run(document, edit);
      if (results.getState().sun.failure !== null) {
        // What was asked last is asked once more: the key is let go, so that it is not taken for asked.
        sunAsked = null;
        askForTheSun();
      }
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
      giveUpTheShadows();
    },
  };
}
