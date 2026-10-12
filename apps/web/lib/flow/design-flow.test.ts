import { describe, expect, test } from "bun:test";
import { DESIGN_PAUSE, TIME_REST } from "../../components/ui/design-numbers";
import { ApiError } from "../api";
import type { CallOptions, DesignProgress, DesignResult, LayoutResponse, Project, ProjectRequest, RunOptions, SunRequest, SunResponse, Weather, WeatherRequest, WeatherResponse } from "../api";
import { clockOfTheTest } from "../clock-of-the-test";
import { canUndo, createProjectStore } from "../stores/project-store";
import {
  createResultsStore,
  designEditOf,
  designFailureOf,
  designOf,
  designStatusOf,
  isDesignUpdating,
  isLayoutUpdating,
  layoutFailureOf,
  layoutOf,
  layoutStatusOf,
  progressOf,
  shadowOutlinesOf,
  sunDayOf,
  sunFailureOf,
} from "../stores/results-store";
import { createViewStore, sunTimeOf } from "../stores/view-store";
import type { ChoiceGone } from "./choice-gone";
import { createDesignFlow } from "./design-flow";

type Asked<Answer> = {
  project: ProjectRequest;
  signal: AbortSignal;
  onProgress?: (progress: DesignProgress) => void;
  answer: (value: Answer) => void;
  refuse: (error: unknown) => void;
};

/** Stands in for the client of the API: it keeps what was asked, and the test answers when it wants to. */
function standIn() {
  const layouts: Array<Asked<LayoutResponse>> = [];
  const runs: Array<Asked<DesignResult>> = [];

  function asked<Answer>(list: Array<Asked<Answer>>, project: ProjectRequest, options: RunOptions = {}): Promise<Answer> {
    return new Promise<Answer>((resolve, reject) => {
      const signal = options.signal ?? new AbortController().signal;
      // As fetch does: a request that is given up throws the error of its signal.
      signal.addEventListener("abort", () => reject(signal.reason));
      list.push({ project, signal, onProgress: options.onProgress, answer: resolve, refuse: reject });
    });
  }

  const demos: Array<Asked<Project>> = [];
  const suns: Array<Asked<SunResponse> & { request: SunRequest }> = [];
  const weathers: Array<Asked<WeatherResponse> & { request: WeatherRequest }> = [];

  return {
    layouts,
    runs,
    demos,
    suns,
    weathers,
    api: {
      getDemo: (options?: CallOptions) => asked(demos, {} as ProjectRequest, options),
      computeLayout: (project: ProjectRequest, options?: CallOptions) => asked(layouts, project, options),
      runDesign: (project: ProjectRequest, options?: RunOptions) => asked(runs, project, options),
      computeSun(request: SunRequest, options?: CallOptions) {
        const promise = asked(suns, {} as ProjectRequest, options);
        suns[suns.length - 1] = { ...suns[suns.length - 1], request };
        return promise;
      },
      loadWeather(request: WeatherRequest, options?: CallOptions) {
        const promise = asked(weathers, {} as ProjectRequest, options);
        weathers[weathers.length - 1] = { ...weathers[weathers.length - 1], request };
        return promise;
      },
    },
  };
}

const DEMO = { name: "Pune demo roof", system_voltage: 1500, array: { tilt_deg: 15 }, roof: { lat: 18.52, lon: 73.86 } } as unknown as Project;

const layout = (positions: number) => ({ layout: { notes: [] }, readouts: { positions } }) as unknown as LayoutResponse;
const design = (positions: number) =>
  ({ chosen_option: "29x22x1", options: [{ key: "29x22x1" }], no_options: null, readouts: { positions } }) as unknown as DesignResult;

const tilt = (degrees: number) => (project: Project) => ({ ...project, array: { ...project.array, tilt_deg: degrees } });
const voltage = (volts: 600 | 1000 | 1500) => (document: Project) => ({ ...document, system_voltage: volts });
const choice = (key: string) => (document: Project) => ({ ...document, chosen_option: key });

const UNREACHABLE = "The server could not be reached. Check your connection, then try again.";
const SHADING = { type: "progress", step: "Computing hourly shading for every module", fraction: 0.4 } as const;

/** What was answered has reached the stores. */
const settled = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function flow() {
  const time = clockOfTheTest();
  const server = standIn();
  const project = createProjectStore();
  const results = createResultsStore();
  const view = createViewStore();
  /** The runs of the untouched demo, as the flow reports them (plan/phase-10-plan.md, step 11). */
  /** The choices taken away, as the flow tells them. */
  const gone: ChoiceGone[] = [];
  const designFlow = createDesignFlow({
    api: server.api,
    clock: time.clock,
    project,
    results,
    view,
    onChoiceGone: (choice) => gone.push(choice),
  });
  designFlow.start();
  const last = <Answer>(list: Array<Asked<Answer>>): Asked<Answer> => {
    const found = list.at(-1);
    if (!found) throw new Error("Nothing was asked.");
    return found;
  };
  return { ...time, ...server, project, results, view, designFlow, gone, last };
}

/** The demo is open and its first results are there. */
async function opened() {
  const all = flow();
  all.project.getState().open(DEMO);
  all.last(all.layouts).answer(layout(790));
  all.last(all.runs).answer(design(790));
  await settled();
  return all;
}

test("the pause before a design run is 500 ms", () => {
  expect(DESIGN_PAUSE).toBe(500);
});

describe("a design is opened", () => {
  test("nothing is asked before one is open", () => {
    const { layouts, runs, waiting } = flow();

    expect(layouts).toHaveLength(0);
    expect(runs).toHaveLength(0);
    expect(waiting()).toBe(0);
  });

  test("the layout and the design run are asked for at once, with the document as it is", () => {
    const { project, layouts, runs, results } = flow();

    project.getState().open(DEMO);

    expect(layouts.map((call) => call.project)).toEqual([DEMO]);
    expect(runs.map((call) => call.project)).toEqual([DEMO]);
    expect(layoutStatusOf(results.getState())).toBe("running");
    expect(designStatusOf(results.getState())).toBe("running");
  });

  test("a design that was open before the flow began is asked for as well", () => {
    const time = clockOfTheTest();
    const server = standIn();
    const project = createProjectStore();
    project.getState().open(DEMO);

    const designFlow = createDesignFlow({ api: server.api, clock: time.clock, project, results: createResultsStore(), view: createViewStore() });
    expect(server.layouts).toHaveLength(0);

    designFlow.start();

    expect(server.layouts).toHaveLength(1);
    expect(server.runs).toHaveLength(1);
  });

  test("started twice, it listens once", () => {
    const { project, layouts, designFlow } = flow();

    designFlow.start();
    project.getState().open(DEMO);

    expect(layouts).toHaveLength(1);
  });

  test("the answers are kept with the edit they belong to", async () => {
    const { results } = await opened();

    expect(layoutOf(results.getState())?.readouts.positions).toBe(790);
    expect(designOf(results.getState())?.readouts.positions).toBe(790);
    expect(designEditOf(results.getState())).toBe(1);
    expect(isDesignUpdating(results.getState())).toBe(false);
  });

  test("the progress of the run is told on the way", async () => {
    const { project, runs, results, last } = flow();
    project.getState().open(DEMO);

    last(runs).onProgress?.(SHADING);

    expect(progressOf(results.getState())).toEqual(SHADING);
  });

  test("another design that is opened takes the results of the one before away", async () => {
    const { project, results, layouts, runs } = await opened();

    project.getState().open({ ...DEMO, name: "Another roof" });

    expect(layoutOf(results.getState())).toBeNull();
    expect(designOf(results.getState())).toBeNull();
    expect(layouts).toHaveLength(2);
    expect(runs).toHaveLength(2);
  });
});

describe("the demo is opened", () => {
  test("it is asked for, and until it is there the design is on its way", () => {
    const { demos, layouts, runs, results, project, designFlow } = flow();

    designFlow.openDemo();

    expect(demos).toHaveLength(1);
    expect(layouts).toHaveLength(0);
    expect(runs).toHaveLength(0);
    expect(project.getState().project).toBeNull();
    expect(designStatusOf(results.getState())).toBe("running");
    expect(isDesignUpdating(results.getState())).toBe(true);
  });

  test("arrived, it is the design that is open, and its layout and its run are asked for at once", async () => {
    const { demos, layouts, runs, project, designFlow, last } = flow();
    designFlow.openDemo();

    last(demos).answer(DEMO);
    await settled();

    expect(project.getState().project).toBe(DEMO);
    expect(layouts.map((call) => call.project)).toEqual([DEMO]);
    expect(runs.map((call) => call.project)).toEqual([DEMO]);
  });

  test("it is opened as the API hands it out: nothing is added, and no system voltage is chosen for it", async () => {
    const { demos, runs, project, designFlow, last } = flow();
    const withoutAVoltage = { ...DEMO, system_voltage: null } as Project;
    designFlow.openDemo();

    last(demos).answer(withoutAVoltage);
    await settled();

    expect(project.getState().project).toBe(withoutAVoltage);
    expect(runs[0]?.project.system_voltage).toBeNull();
  });

  test("a demo that does not come is a failure, in the words of the API; no design is open", async () => {
    const { demos, results, project, designFlow, last } = flow();
    designFlow.openDemo();

    last(demos).refuse(ApiError.unreachable(new TypeError("fetch failed")));
    await settled();

    expect(project.getState().project).toBeNull();
    expect(designStatusOf(results.getState())).toBe("failed");
    expect(designFailureOf(results.getState())).toMatchObject({ code: "api_unreachable", message: UNREACHABLE });
  });

  test("tried again, it is asked for once more", async () => {
    const { demos, runs, results, designFlow, last } = flow();
    designFlow.openDemo();
    last(demos).refuse(ApiError.unreachable(new TypeError("fetch failed")));
    await settled();

    designFlow.tryAgain();

    expect(demos).toHaveLength(2);
    expect(designStatusOf(results.getState())).toBe("running");
    expect(designFailureOf(results.getState())).toBeNull();

    last(demos).answer(DEMO);
    await settled();
    expect(runs).toHaveLength(1);
  });

  test("once it is open, try again asks for the run, not for the demo", async () => {
    const { demos, runs, designFlow, last } = flow();
    designFlow.openDemo();
    last(demos).answer(DEMO);
    await settled();
    last(runs).refuse(ApiError.unreachable(new TypeError("fetch failed")));
    await settled();

    designFlow.tryAgain();

    expect(demos).toHaveLength(1);
    expect(runs).toHaveLength(2);
  });

  test("the flow is stopped: the demo is given up, and one that comes late is not opened", async () => {
    const { demos, project, results, designFlow, last } = flow();
    designFlow.openDemo();

    designFlow.stop();
    last(demos).answer(DEMO);
    await settled();

    expect(last(demos).signal.aborted).toBe(true);
    expect(project.getState().project).toBeNull();
    expect(designFailureOf(results.getState())).toBeNull();
  });

  test("asked for twice, the first is given up", () => {
    const { demos, designFlow } = flow();

    designFlow.openDemo();
    designFlow.openDemo();

    expect(demos.map((call) => call.signal.aborted)).toEqual([true, false]);
  });

  test("another design that is opened meanwhile is the one that stays", async () => {
    const { demos, project, designFlow, last } = flow();
    const another = { ...DEMO, name: "Another roof" } as Project;
    designFlow.openDemo();

    project.getState().open(another);
    last(demos).answer(DEMO);
    await settled();

    expect(last(demos).signal.aborted).toBe(true);
    expect(project.getState().project).toBe(another);
  });
});

describe("the demo handed in", () => {
  test("Home has the demo already: handed to the flow it is opened at once, nothing is asked for it, its layout and its run are asked for", () => {
    const { demos, layouts, runs, project, designFlow } = flow();

    designFlow.openDemo(DEMO);

    expect(demos).toHaveLength(0);
    expect(project.getState().project).toBe(DEMO);
    expect(layouts.map((call) => call.project)).toEqual([DEMO]);
    expect(runs.map((call) => call.project)).toEqual([DEMO]);
  });

  test("a demo asked for before and still on its way is given up for the one handed in", () => {
    const { demos, project, designFlow } = flow();
    designFlow.openDemo();

    designFlow.openDemo(DEMO);

    expect(demos.map((call) => call.signal.aborted)).toEqual([true]);
    expect(project.getState().project).toBe(DEMO);
  });
});

describe("a committed edit", () => {
  test("asks for the layout at once", async () => {
    const { project, layouts } = await opened();

    project.getState().commit(tilt(20));

    expect(layouts).toHaveLength(2);
    expect(layouts[1]?.project.array?.tilt_deg).toBe(20);
  });

  test("asks for the design run after a pause of 500 ms", async () => {
    const { project, runs, results, pass } = await opened();

    project.getState().commit(tilt(20));
    expect(designStatusOf(results.getState())).toBe("waiting");

    pass(499);
    expect(runs).toHaveLength(1);

    pass(1);
    expect(runs).toHaveLength(2);
    expect(runs[1]?.project.array?.tilt_deg).toBe(20);
    expect(designStatusOf(results.getState())).toBe("running");
  });

  test("the results of before stay, and are marked as updating", async () => {
    const { project, results } = await opened();

    project.getState().commit(tilt(20));

    expect(layoutOf(results.getState())?.readouts.positions).toBe(790);
    expect(designOf(results.getState())?.readouts.positions).toBe(790);
    expect(isLayoutUpdating(results.getState())).toBe(true);
    expect(isDesignUpdating(results.getState())).toBe(true);
  });

  test("two edits shortly after each other are one run, of the later document", async () => {
    const { project, runs, pass, waiting } = await opened();

    project.getState().commit(tilt(20));
    pass(300);
    project.getState().commit(tilt(25));
    expect(waiting()).toBe(1);

    pass(499);
    expect(runs).toHaveLength(1);
    pass(1);
    expect(runs).toHaveLength(2);
    expect(runs[1]?.project.array?.tilt_deg).toBe(25);
  });

  test("the layout that was overtaken is given up by its signal", async () => {
    const { project, layouts } = await opened();

    project.getState().commit(tilt(20));
    project.getState().commit(tilt(25));

    expect(layouts.map((call) => call.signal.aborted)).toEqual([false, true, false]);
  });

  test("a run that has answered is not given up", async () => {
    const { project, runs, pass } = await opened();

    project.getState().commit(tilt(20));
    pass(DESIGN_PAUSE);

    expect(runs.map((call) => call.signal.aborted)).toEqual([false, false]);
  });

  test("the run that was overtaken is given up by its signal", async () => {
    const { project, runs, pass } = await opened();
    project.getState().commit(tilt(20));
    pass(DESIGN_PAUSE);
    expect(runs[1]?.signal.aborted).toBe(false);

    project.getState().commit(tilt(25));

    expect(runs[1]?.signal.aborted).toBe(true);
  });

  test("a run that was given up is no failure", async () => {
    const { project, results, pass } = await opened();
    project.getState().commit(tilt(20));
    pass(DESIGN_PAUSE);

    project.getState().commit(tilt(25));
    await settled();

    expect(designStatusOf(results.getState())).toBe("waiting");
    expect(designFailureOf(results.getState())).toBeNull();
    expect(layoutFailureOf(results.getState())).toBeNull();
  });

  test("a late answer never replaces a newer one", async () => {
    const { project, results, layouts, runs, pass } = await opened();
    project.getState().commit(tilt(20));
    pass(DESIGN_PAUSE);
    project.getState().commit(tilt(25));
    pass(DESIGN_PAUSE);

    layouts[2]?.answer(layout(640));
    runs[2]?.answer(design(640));
    await settled();
    layouts[1]?.answer(layout(700));
    runs[1]?.answer(design(700));
    await settled();

    expect(layoutOf(results.getState())?.readouts.positions).toBe(640);
    expect(designOf(results.getState())?.readouts.positions).toBe(640);
    expect(designEditOf(results.getState())).toBe(3);
  });

  test("the progress of a run that was overtaken is not told", async () => {
    const { project, results, runs, pass } = await opened();
    project.getState().commit(tilt(20));
    pass(DESIGN_PAUSE);
    project.getState().commit(tilt(25));

    runs[1]?.onProgress?.(SHADING);

    expect(progressOf(results.getState())).toBeNull();
  });
});

describe("an edit asks for what it changes (plan/phase-07-plan.md, decision 2)", () => {

  test("a system voltage asks for the run after the pause, and not for the layout", async () => {
    const { project, layouts, runs, results, pass } = await opened();

    project.getState().commit(voltage(1000));
    pass(DESIGN_PAUSE);

    expect(layouts).toHaveLength(1);
    expect(runs).toHaveLength(2);
    expect(runs[1]?.project.system_voltage).toBe(1000);
    expect(layoutStatusOf(results.getState())).toBe("idle");
  });

  test("an edit of the roof or the array asks for both", async () => {
    const { project, layouts, runs, pass } = await opened();

    project.getState().commit(tilt(20));
    pass(DESIGN_PAUSE);

    expect(layouts).toHaveLength(2);
    expect(runs).toHaveLength(2);
  });

  test("an option chosen asks for nothing, and the design does not wait", async () => {
    const { project, layouts, runs, results, pass } = await opened();

    project.getState().commit(choice("26x24x1"));
    pass(DESIGN_PAUSE);

    expect(layouts).toHaveLength(1);
    expect(runs).toHaveLength(1);
    expect(designStatusOf(results.getState())).toBe("idle");
  });

  test("undo and redo of a choice ask for nothing either", async () => {
    const { project, layouts, runs, pass } = await opened();

    project.getState().commit(choice("26x24x1"));
    project.getState().undo();
    project.getState().redo();
    pass(DESIGN_PAUSE);

    expect(layouts).toHaveLength(1);
    expect(runs).toHaveLength(1);
  });

  test("an option chosen is the run's choice at once, without a request", async () => {
    const { project, results, runs, pass } = await opened();
    const both = { ...design(790), options: [{ key: "29x22x1" }, { key: "26x24x1" }] } as unknown as DesignResult;
    project.getState().commit(voltage(1000));
    pass(DESIGN_PAUSE);
    runs[1]?.answer(both);
    await settled();

    project.getState().commit(choice("26x24x1"));

    expect(designOf(results.getState())?.chosen_option).toBe("26x24x1");
    expect(runs).toHaveLength(2);
  });

  test("an option chosen while a run is on its way holds when the run lands", async () => {
    const { project, results, runs, pass } = await opened();
    project.getState().commit(voltage(1000));
    pass(DESIGN_PAUSE);

    project.getState().commit(choice("19x37x2"));
    runs[1]?.answer({ ...design(790), chosen_option: "18x42x2", options: [{ key: "18x42x2" }, { key: "19x37x2" }] } as unknown as DesignResult);
    await settled();

    expect(designOf(results.getState())?.chosen_option).toBe("19x37x2");
  });

  test("an option chosen while a run waits leaves the run to go on", async () => {
    const { project, runs, results, pass } = await opened();

    project.getState().commit(voltage(1000));
    project.getState().commit(choice("19x37x2"));
    pass(DESIGN_PAUSE);

    expect(runs).toHaveLength(2);
    expect(runs[1]?.project.system_voltage).toBe(1000);
    expect(designStatusOf(results.getState())).toBe("running");
  });
});

describe("a choice an edit took away (the owner's IKEA design, session 18)", () => {
  const A = { key: "23x67x7", letter: "A", caption: "Recommended", n_series: 23, n_strings: 67, n_inverters: 7 };
  const B = { key: "24x64x7", letter: "B", caption: "Fills the inverter", n_series: 24, n_strings: 64, n_inverters: 7 };
  const runOf = (...options: Array<typeof A>) =>
    ({ ...design(790), chosen_option: options[0]?.key ?? null, options }) as unknown as DesignResult;

  test("a design opened with a choice its run does not hold takes the option shown: nothing counted, nothing to undo, nothing asked again, and the user told", async () => {
    const { project, results, runs, layouts, gone, last } = flow();
    project.getState().open({ ...DEMO, chosen_option: "18x84x7" });
    const editOpened = project.getState().edit;
    last(layouts).answer(layout(790));
    last(runs).answer(runOf(A, B));
    await settled();

    expect(project.getState().project?.chosen_option).toBe("23x67x7");
    expect(project.getState().edit).toBe(editOpened);
    expect(canUndo(project.getState())).toBe(false);
    expect(runs).toHaveLength(1);
    expect(layouts).toHaveLength(1);
    expect(designOf(results.getState())?.chosen_option).toBe("23x67x7");
    expect(gone).toEqual([{ dropped: { series: 18, strings: 84, inverters: 7 }, shown: A }] as unknown as ChoiceGone[]);
  });

  test("an edit that takes the choice away: the run of that edit brings it to the option shown; undo gives the edit and its choice back", async () => {
    const { project, runs, gone, pass, last } = flow();
    project.getState().open({ ...DEMO, chosen_option: "24x64x7" });
    last(runs).answer(runOf(A, B));
    await settled();
    expect(gone).toEqual([]);

    project.getState().commit(voltage(1000));
    pass(DESIGN_PAUSE);
    runs[1]?.answer(runOf(A));
    await settled();

    expect(project.getState().project?.chosen_option).toBe("23x67x7");
    expect(gone).toHaveLength(1);
    project.getState().undo();
    expect(project.getState().project).toMatchObject({ system_voltage: 1500, chosen_option: "24x64x7" });
  });

  test("a choice the run holds, and no choice at all, are left as they are and nothing is said", async () => {
    const held = flow();
    held.project.getState().open({ ...DEMO, chosen_option: "24x64x7" });
    held.last(held.runs).answer(runOf(A, B));
    const none = flow();
    none.project.getState().open({ ...DEMO, chosen_option: "" });
    none.last(none.runs).answer(runOf(A, B));
    await settled();

    expect(held.project.getState().project?.chosen_option).toBe("24x64x7");
    expect(none.project.getState().project?.chosen_option).toBe("");
    expect([...held.gone, ...none.gone]).toEqual([]);
  });

  test("a run without options leaves the choice alone", async () => {
    const { project, runs, gone, last } = flow();
    project.getState().open({ ...DEMO, chosen_option: "18x84x7" });
    last(runs).answer(runOf());
    await settled();

    expect(project.getState().project?.chosen_option).toBe("18x84x7");
    expect(gone).toEqual([]);
  });

  test("an option chosen while the run is on its way, that the run does not hold, gives way to the option shown", async () => {
    const { project, runs, gone, pass, last } = flow();
    project.getState().open({ ...DEMO, chosen_option: "24x64x7" });
    last(runs).answer(runOf(A, B));
    await settled();
    project.getState().commit(voltage(1000));
    pass(DESIGN_PAUSE);
    project.getState().commit(choice("24x64x7"));
    runs[1]?.answer(runOf(A));
    await settled();

    expect(project.getState().project?.chosen_option).toBe("23x67x7");
    expect(gone).toHaveLength(1);
  });
});

describe("a call that fails", () => {
  test("the run: the last good result stays, and what failed is said in the words of the API", async () => {
    const { project, results, runs, pass, last } = await opened();
    project.getState().commit(tilt(20));
    pass(DESIGN_PAUSE);

    last(runs).refuse(ApiError.unreachable(new TypeError("fetch failed")));
    await settled();

    expect(designOf(results.getState())?.readouts.positions).toBe(790);
    expect(designEditOf(results.getState())).toBe(1);
    expect(designStatusOf(results.getState())).toBe("failed");
    expect(designFailureOf(results.getState())).toMatchObject({ code: "api_unreachable", message: UNREACHABLE });
  });

  test("the layout: the same", async () => {
    const { project, results, layouts, last } = await opened();
    project.getState().commit(tilt(20));

    last(layouts).refuse(new ApiError(422, "roof_too_small", "The roof has no room for a module. Make it larger.", "roof.outline"));
    await settled();

    expect(layoutOf(results.getState())?.readouts.positions).toBe(790);
    expect(layoutStatusOf(results.getState())).toBe("failed");
    expect(layoutFailureOf(results.getState())).toMatchObject({
      code: "roof_too_small",
      message: "The roof has no room for a module. Make it larger.",
    });
  });

  test("a failure of the layout does not hold the design run back", async () => {
    const { project, layouts, runs, pass, last } = await opened();
    project.getState().commit(tilt(20));

    last(layouts).refuse(ApiError.unreachable(new TypeError("fetch failed")));
    await settled();
    pass(DESIGN_PAUSE);

    expect(runs).toHaveLength(2);
  });

  test("a fault that is not of the API is a failure too, and says what it was", async () => {
    const { project, results, runs, pass, last } = await opened();
    project.getState().commit(tilt(20));
    pass(DESIGN_PAUSE);

    last(runs).refuse(new TypeError("result.options is not iterable"));
    await settled();

    expect(designStatusOf(results.getState())).toBe("failed");
    expect(designFailureOf(results.getState())).toEqual({
      code: "unexpected_fault",
      message: "The app could not finish this step.",
      status: null,
      details: "TypeError: result.options is not iterable",
    });
  });
});

describe("try again", () => {
  test("runs the design at once, with the document as it is now", async () => {
    const { project, results, runs, pass, last, designFlow } = await opened();
    project.getState().commit(tilt(20));
    pass(DESIGN_PAUSE);
    last(runs).refuse(ApiError.unreachable(new TypeError("fetch failed")));
    await settled();

    designFlow.tryAgain();

    expect(runs).toHaveLength(3);
    expect(runs[2]?.project.array?.tilt_deg).toBe(20);
    expect(designStatusOf(results.getState())).toBe("running");
    expect(designFailureOf(results.getState())).toBeNull();

    last(runs).answer(design(640));
    await settled();
    expect(designOf(results.getState())?.readouts.positions).toBe(640);
    expect(designEditOf(results.getState())).toBe(2);
  });

  test("asks for the layout again when it was the layout that failed", async () => {
    const { project, layouts, runs, last, designFlow, pass } = await opened();
    project.getState().commit(tilt(20));
    last(layouts).refuse(ApiError.unreachable(new TypeError("fetch failed")));
    pass(DESIGN_PAUSE);
    last(runs).answer(design(640));
    await settled();

    designFlow.tryAgain();

    expect(layouts).toHaveLength(3);
    expect(runs).toHaveLength(2);
  });

  test("asks for nothing when nothing failed", async () => {
    const { layouts, runs, designFlow } = await opened();

    designFlow.tryAgain();

    expect(layouts).toHaveLength(1);
    expect(runs).toHaveLength(1);
  });
});

describe("the flow is stopped", () => {
  test("what is on its way is given up, and what waits does not begin", async () => {
    const { project, layouts, runs, pass, waiting, designFlow } = await opened();
    project.getState().commit(tilt(20));

    designFlow.stop();
    pass(DESIGN_PAUSE);

    expect(layouts[1]?.signal.aborted).toBe(true);
    expect(waiting()).toBe(0);
    expect(runs).toHaveLength(1);
  });

  test("started again, it follows what happened meanwhile", async () => {
    const { project, layouts, runs, designFlow } = await opened();
    designFlow.stop();
    project.getState().commit(tilt(20));

    designFlow.start();

    expect(layouts).toHaveLength(2);
    expect(layouts[1]?.project.array?.tilt_deg).toBe(20);
    expect(runs).toHaveLength(1);
  });

  test("an edit after it asks for nothing", async () => {
    const { project, layouts, designFlow } = await opened();
    designFlow.stop();

    project.getState().commit(tilt(20));

    expect(layouts).toHaveLength(1);
  });
});

// The sun of the scene (plan/phase-05-plan.md, decision 5; plan/phase-06-plan.md, decisions 1 and 2): a
// whole day of it, asked for the roof's place and the view's day when a design opens, and again when the
// place or the day changes; never when the hour or anything else does.
describe("the sun", () => {
  const SUN = {
    day_of_year: 355,
    positions: [
      { hour: 10.5, elevation_deg: 40.2, azimuth_deg: 151.3 },
      { hour: 10.75, elevation_deg: 42.1, azimuth_deg: 155.0 },
    ],
    sunrise_h: 6.8,
    sunset_h: 17.8,
    shadows: null,
  } as SunResponse;
  const place = (lat: number) => (project: Project) => ({ ...project, roof: { ...project.roof, lat } });
  const designDay = (doy: number | null) => (project: Project) => ({ ...project, array: { ...project.array, design_doy: doy } });

  test("a whole day of it is asked for the roof's place on the view's day when a design opens, a quarter hour apart", () => {
    const { project, suns } = flow();

    project.getState().open(DEMO);

    expect(suns).toHaveLength(1);
    expect(suns[0].request).toEqual({ lat: 18.52, lon: 73.86, day: "design_day", step_h: 0.25 });
  });

  test("arrived, the day is kept, with the place and the day it is of", async () => {
    const { project, results, suns } = flow();
    project.getState().open(DEMO);

    suns[0].answer(SUN);
    await settled();

    expect(sunDayOf(results.getState())).toEqual({
      lat: 18.52,
      lon: 73.86,
      day: "design_day",
      dayOfYear: 355,
      sunriseH: 6.8,
      sunsetH: 17.8,
      positions: [
        { hour: 10.5, elevationDeg: 40.2, azimuthDeg: 151.3 },
        { hour: 10.75, elevationDeg: 42.1, azimuthDeg: 155.0 },
      ],
    });
  });

  test("the design day of the view is the array's when the array has one", () => {
    const { project, suns } = flow();

    project.getState().open(designDay(172)(DEMO));

    expect(suns[0].request.day).toBe(172);
  });

  test("a change of the array's design day asks again while the view shows the design day", async () => {
    const { project, suns } = await opened();

    project.getState().commit(designDay(80));

    expect(suns).toHaveLength(2);
    expect(suns[1].request.day).toBe(80);
  });

  test("an edit that leaves the place and the day alone does not ask again", async () => {
    const { project, suns } = await opened();

    project.getState().commit(tilt(20));

    expect(suns).toHaveLength(1);
  });

  test("an edit of the place asks again, and the one before is given up", async () => {
    const { project, suns } = await opened();

    project.getState().commit(place(19));

    expect(suns).toHaveLength(2);
    expect(suns[0].signal.aborted).toBe(true);
    expect(suns[1].request.lat).toBe(19);
  });

  test("a change of the view's hour asks nothing: the day has every quarter hour", async () => {
    const { view, suns } = await opened();

    view.getState().setSunTime({ day: "design_day", hour: 16 });
    view.getState().setSunTime({ day: "design_day", hour: 16.25 });

    expect(suns).toHaveLength(1);
  });

  test("a change of the view's day asks again", async () => {
    const { view, suns } = await opened();

    view.getState().setSunTime({ day: 172, hour: 16 });

    expect(suns).toHaveLength(2);
    expect(suns[1].request).toEqual({ lat: 18.52, lon: 73.86, day: 172, step_h: 0.25 });
  });

  test("a day that comes holds the view's hour inside its hours, to the quarter hour", async () => {
    const { view, suns } = await opened();
    view.getState().setSunTime({ day: 172, hour: 5.5 });

    suns[1].answer({ ...SUN, day_of_year: 172, sunrise_h: 6.8, sunset_h: 17.8 });
    await settled();

    expect(sunTimeOf(view.getState())).toEqual({ day: 172, hour: 7 });
  });

  test("an hour inside the day that comes is left as it is", async () => {
    const { view, suns } = await opened();

    suns[0].answer(SUN);
    await settled();

    expect(sunTimeOf(view.getState())).toEqual({ day: "design_day", hour: 12 });
  });

  test("a late answer for another place or day is not kept", async () => {
    const { project, results, suns } = await opened();
    project.getState().commit(place(19));

    suns[1].answer(SUN);
    await settled();

    expect(sunDayOf(results.getState())?.lat).toBe(19);
    expect(sunDayOf(results.getState())?.dayOfYear).toBe(355);
  });

  test("a sun that does not come leaves the scene without one, and says why in the store", async () => {
    const { project, results, suns } = flow();
    project.getState().open(DEMO);

    suns[0].refuse(new ApiError(null, "unreachable", UNREACHABLE, null));
    await settled();

    expect(sunDayOf(results.getState())).toBeNull();
    expect(sunFailureOf(results.getState())?.message).toBe(UNREACHABLE);
  });

  test("try again asks once more for a sun that did not come", async () => {
    const { project, results, suns, designFlow } = flow();
    project.getState().open(DEMO);
    suns[0].refuse(new ApiError(null, "unreachable", UNREACHABLE, null));
    await settled();

    designFlow.tryAgain();

    expect(suns).toHaveLength(2);
    expect(suns[1].request).toEqual(suns[0].request);
    expect(sunFailureOf(results.getState())).toBeNull();
  });

  test("the flow stopped gives the sun up", async () => {
    const { suns, designFlow } = flow();
    designFlow.stop();

    expect(suns).toHaveLength(0);
  });

  test("another design that is opened takes the sun of the one before away", async () => {
    const { project, results, suns } = await opened();
    suns[0].answer(SUN);
    await settled();

    project.getState().open({ ...DEMO, roof: { lat: 19, lon: 73.86 } } as unknown as Project);

    expect(sunDayOf(results.getState())).toBeNull();
    expect(suns).toHaveLength(2);
  });
});

// The engine's shadow outlines (plan/phase-06-plan.md, decisions 7 and 8): asked only while their switch is
// on, once the time has stood still, for the roof alone; shown only while the time is the one they are of.
describe("the shadow outlines", () => {
  const OUTLINE = { exterior: [[30, 21], [33, 21], [33, 25], [30, 25]] as [number, number][], holes: [] as [number, number][][] };
  const answerOf = (hour: number) =>
    ({ day_of_year: 355, positions: [{ hour, elevation_deg: 18, azimuth_deg: 236.6 }], sunrise_h: 6.56, sunset_h: 17.44, shadows: { hour, elevation_deg: 18, azimuth_deg: 236.6, plane_height_m: 0, polygons: [OUTLINE] } }) as unknown as SunResponse;
  const asked = (suns: ReturnType<typeof flow>["suns"]) => suns.filter((sun) => sun.request.shadows);
  const roofAndTilt = (project: Project) => ({ ...project, roof: { ...project.roof, lat: 18.52, parapet_h: 0.9 } });

  test("are not asked while their switch is off", async () => {
    const { suns, view, pass } = await opened();

    view.getState().setSunTime({ day: "design_day", hour: 16 });
    pass(1000);

    expect(asked(suns)).toHaveLength(0);
  });

  test("on, they are asked once the time has stood still, for the roof alone at the hour", async () => {
    const { suns, view, pass } = await opened();
    view.getState().showOnTheRoof("shadowOutlines", true);
    pass(TIME_REST - 1);
    expect(asked(suns)).toHaveLength(0);

    pass(1);

    expect(asked(suns)).toHaveLength(1);
    const [request] = asked(suns).map((sun) => sun.request);
    expect(request).toEqual({ lat: 18.52, lon: 73.86, day: "design_day", hours: [12], shadows: { roof: DEMO.roof, hour: 12 } });
  });

  test("a drag passing many quarter hours asks once, for where it stopped", async () => {
    const { suns, view, pass } = await opened();
    view.getState().showOnTheRoof("shadowOutlines", true);
    pass(TIME_REST);

    for (const hour of [12.25, 12.5, 12.75, 13]) {
      view.getState().setSunTime({ day: "design_day", hour });
      pass(40);
    }
    pass(TIME_REST);

    expect(asked(suns).map((sun) => sun.request.hours)).toEqual([[12], [13]]);
  });

  test("are shown while the time is the one they are of, and not once it moved on", async () => {
    const { suns, results, view, pass } = await opened();
    view.getState().showOnTheRoof("shadowOutlines", true);
    pass(TIME_REST);
    asked(suns)[0].answer(answerOf(12));
    await settled();
    expect(shadowOutlinesOf(results.getState())?.polygons).toEqual([OUTLINE]);

    view.getState().setSunTime({ day: "design_day", hour: 13 });

    expect(shadowOutlinesOf(results.getState())).toBeNull();
  });

  test("switched off they are gone, and what was on its way is given up", async () => {
    const { suns, results, view, pass } = await opened();
    view.getState().showOnTheRoof("shadowOutlines", true);
    pass(TIME_REST);

    view.getState().showOnTheRoof("shadowOutlines", false);

    expect(asked(suns)[0].signal.aborted).toBe(true);
    expect(shadowOutlinesOf(results.getState())).toBeNull();
  });

  test("an edit of the roof asks again; an edit of the array does not", async () => {
    const { suns, project, view, pass } = await opened();
    view.getState().showOnTheRoof("shadowOutlines", true);
    pass(TIME_REST);

    project.getState().commit(tilt(20));
    pass(TIME_REST);
    expect(asked(suns)).toHaveLength(1);

    project.getState().commit(roofAndTilt);
    pass(TIME_REST);
    expect(asked(suns)).toHaveLength(2);
  });

  // Present asks the API for nothing (plan/phase-10-plan.md, step 20, decision 8): its tour moves the hour, and the outlines
  // of every hour would be asked while the switch stands on. They are let go for the tour and asked again after it.
  test("under a presentation they are not asked, though the switch is on and the hour moves; after it they are, once", async () => {
    const { suns, view, pass, results } = await opened();
    view.getState().showOnTheRoof("shadowOutlines", true);
    pass(TIME_REST);
    expect(asked(suns)).toHaveLength(1);

    view.getState().setPresentation({ reveal: { building: 1, obstacles: 1, modules: 1 }, colouring: null, sunPath: false });
    for (const hour of [11, 12, 13, 14]) {
      view.getState().setSunTime({ day: "design_day", hour });
      pass(TIME_REST);
    }
    expect(asked(suns)).toHaveLength(1);
    expect(shadowOutlinesOf(results.getState())).toBeNull();

    view.getState().setPresentation(null);
    pass(TIME_REST);
    expect(asked(suns)).toHaveLength(2);
    expect(asked(suns).at(-1)?.request.hours).toEqual([14]);
  });
});

// Weather for a design that has none (plan/phase-08-plan.md, step 16, decision 11): the API says when the document
// holds no weather for its site; the flow loads the weather of the document's source, puts it into the document of
// that edit without a step of undo, and runs again. Once per edit: a second refusal is the run's failure.
describe("weather for a design that has none", () => {
  const WITHOUT_WEATHER = { ...DEMO, weather_source: "pvgis", weather_csv: "", weather_csv_text: "", weather_json: null } as Project;
  const NO_WEATHER_YET = "This project has no weather for 18.5200, 73.8600 yet. Load the PVGIS TMY weather first.";
  const refusedForWeather = () => new ApiError(422, "weather_not_loaded", NO_WEATHER_YET, "weather_json");
  const HOURS = { source: "pvgis", label: "PVGIS TMY", lat: 18.52, lon: 73.86, time: ["2019-01-01T00:00:00+00:00"] } as unknown as Weather;
  const LOADED = { weather: HOURS, summary: {}, notes: [] } as unknown as WeatherResponse;
  const OVER_THE_SEA = "PVGIS TMY has no weather for 10.0000, 65.0000: Location over the sea. Please, select another location. Check the site, or choose another weather source.";

  /** The design without weather is open, and its first run was refused for want of it. */
  async function refused(document: Project = WITHOUT_WEATHER) {
    const all = flow();
    all.project.getState().open(document);
    all.last(all.layouts).answer(layout(790));
    all.last(all.runs).refuse(refusedForWeather());
    await settled();
    return all;
  }

  test("a run refused for want of weather asks /weather for the document's source at the roof's place, and the step says so", async () => {
    const { weathers, results } = await refused();

    expect(weathers.map((call) => call.request)).toEqual([{ source: "pvgis", lat: 18.52, lon: 73.86, csv_name: "", csv_text: "" }]);
    expect(designStatusOf(results.getState())).toBe("running");
    expect(designFailureOf(results.getState())).toBeNull();
    expect(progressOf(results.getState())).toEqual({ type: "progress", step: "Loading the typical year from PVGIS", fraction: 0 });
  });

  test("a NASA document asks for NASA's", async () => {
    const { weathers, results } = await refused({ ...WITHOUT_WEATHER, weather_source: "nasa" } as Project);

    expect(weathers[0]?.request.source).toBe("nasa");
    expect(progressOf(results.getState())?.step).toBe("Loading 2023's weather from NASA POWER");
  });

  test("the weather that comes goes into the document of that edit, and the run is asked again with it, under the same edit", async () => {
    const { weathers, runs, project, results, last } = await refused();

    last(weathers).answer(LOADED);
    await settled();

    expect(runs).toHaveLength(2);
    expect(runs[1]?.project.weather_json).toBe(HOURS);
    expect(runs[1]?.project.weather_source).toBe("pvgis");
    expect(project.getState().project?.weather_json).toBe(HOURS);
    expect(project.getState().edit).toBe(1);
    expect(canUndo(project.getState())).toBe(false);
    expect(designStatusOf(results.getState())).toBe("running");

    last(runs).answer(design(790));
    await settled();
    expect(designOf(results.getState())?.readouts.positions).toBe(790);
    expect(designEditOf(results.getState())).toBe(1);
  });

  test("the weather loaded asks for no layout: it is of the run alone", async () => {
    const { weathers, layouts, last } = await refused();

    last(weathers).answer(LOADED);
    await settled();

    expect(layouts).toHaveLength(1);
  });

  test("an option chosen after the weather came asks for nothing, as before", async () => {
    const { weathers, runs, layouts, project, last, pass } = await refused();
    last(weathers).answer(LOADED);
    await settled();
    last(runs).answer(design(790));
    await settled();

    project.getState().commit((document) => ({ ...document, chosen_option: "26x24x1" }));
    pass(DESIGN_PAUSE);

    expect(runs).toHaveLength(2);
    expect(layouts).toHaveLength(1);
  });

  test("a weather that does not come is the run's failure, in the words of the API", async () => {
    const { weathers, runs, results, project, last } = await refused();

    last(weathers).refuse(new ApiError(422, "no_weather_for_site", OVER_THE_SEA, null));
    await settled();

    expect(designStatusOf(results.getState())).toBe("failed");
    expect(designFailureOf(results.getState())).toMatchObject({ code: "no_weather_for_site", message: OVER_THE_SEA });
    expect(runs).toHaveLength(1);
    expect(project.getState().project?.weather_json).toBeNull();
  });

  test("an edit while the weather loads gives it up, and is no failure", async () => {
    const { weathers, runs, results, project, pass } = await refused();

    project.getState().commit(tilt(20));

    expect(weathers[0]?.signal.aborted).toBe(true);
    await settled();
    expect(designFailureOf(results.getState())).toBeNull();
    expect(designStatusOf(results.getState())).toBe("waiting");
    pass(DESIGN_PAUSE);
    expect(runs).toHaveLength(2);
    expect(runs[1]?.project.weather_json).toBeNull();
  });

  test("the run of the next edit, refused again, loads once more: once per edit", async () => {
    const { weathers, runs, project, pass, last } = await refused();
    project.getState().commit(tilt(20));
    pass(DESIGN_PAUSE);

    last(runs).refuse(refusedForWeather());
    await settled();

    expect(weathers).toHaveLength(2);
    expect(weathers[1]?.signal.aborted).toBe(false);
  });

  test("a second refusal of the same edit is the run's failure, in the words of the API", async () => {
    const { weathers, runs, results, last } = await refused();
    last(weathers).answer(LOADED);
    await settled();

    last(runs).refuse(refusedForWeather());
    await settled();

    expect(weathers).toHaveLength(1);
    expect(designStatusOf(results.getState())).toBe("failed");
    expect(designFailureOf(results.getState())).toMatchObject({ code: "weather_not_loaded", message: NO_WEATHER_YET });
  });

  test("tried again after that, the run is asked once more and may load again", async () => {
    const { weathers, runs, results, last, designFlow } = await refused();
    last(weathers).refuse(ApiError.unreachable(new TypeError("fetch failed")));
    await settled();
    expect(designStatusOf(results.getState())).toBe("failed");

    designFlow.tryAgain();
    expect(runs).toHaveLength(2);
    last(runs).refuse(refusedForWeather());
    await settled();

    expect(weathers).toHaveLength(2);
  });

  test("the flow stopped gives the weather up, and one that comes late changes nothing", async () => {
    const { weathers, runs, project, last, designFlow } = await refused();

    designFlow.stop();
    last(weathers).answer(LOADED);
    await settled();

    expect(weathers[0]?.signal.aborted).toBe(true);
    expect(runs).toHaveLength(1);
    expect(project.getState().project?.weather_json).toBeNull();
  });

  test("a CSV document is never refused so by the API; were it, its text would be sent to be read", async () => {
    const csv = { ...WITHOUT_WEATHER, weather_source: "csv", weather_csv: "pune.csv", weather_csv_text: "time,ghi" } as Project;
    const { weathers, results } = await refused(csv);

    expect(weathers[0]?.request).toEqual({ source: "csv", lat: 18.52, lon: 73.86, csv_name: "pune.csv", csv_text: "time,ghi" });
    expect(progressOf(results.getState())?.step).toBe("Reading pune.csv");
  });
});
