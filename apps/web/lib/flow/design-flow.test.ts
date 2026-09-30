import { describe, expect, test } from "bun:test";
import { DESIGN_PAUSE } from "../../components/ui/design-numbers";
import { ApiError } from "../api";
import type { CallOptions, DesignProgress, DesignResult, LayoutResponse, Project, ProjectRequest, RunOptions } from "../api";
import { clockOfTheTest } from "../clock-of-the-test";
import { createProjectStore } from "../stores/project-store";
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
} from "../stores/results-store";
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

  return {
    layouts,
    runs,
    api: {
      computeLayout: (project: ProjectRequest, options?: CallOptions) => asked(layouts, project, options),
      runDesign: (project: ProjectRequest, options?: RunOptions) => asked(runs, project, options),
    },
  };
}

const DEMO = { name: "Pune demo roof", system_voltage: 1500, array: { tilt_deg: 15 } } as unknown as Project;

const layout = (positions: number) => ({ layout: { notes: [] }, readouts: { positions } }) as unknown as LayoutResponse;
const design = (positions: number) =>
  ({ chosen_option: "29x22x1", options: [{ key: "29x22x1" }], no_options: null, readouts: { positions } }) as unknown as DesignResult;

const tilt = (degrees: number) => (project: Project) => ({ ...project, array: { ...project.array, tilt_deg: degrees } });

const UNREACHABLE = "The server cannot be reached. Check the connection and try again.";
const SHADING = { type: "progress", step: "Computing hourly shading for every module", fraction: 0.4 } as const;

/** What was answered has reached the stores. */
const settled = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function flow() {
  const time = clockOfTheTest();
  const server = standIn();
  const project = createProjectStore();
  const results = createResultsStore();
  const designFlow = createDesignFlow({ api: server.api, clock: time.clock, project, results });
  designFlow.start();
  const last = <Answer>(list: Array<Asked<Answer>>): Asked<Answer> => {
    const found = list.at(-1);
    if (!found) throw new Error("Nothing was asked.");
    return found;
  };
  return { ...time, ...server, project, results, designFlow, last };
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

    const designFlow = createDesignFlow({ api: server.api, clock: time.clock, project, results: createResultsStore() });
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
    expect(designFailureOf(results.getState())).toEqual({ code: "api_unreachable", message: UNREACHABLE });
  });

  test("the layout: the same", async () => {
    const { project, results, layouts, last } = await opened();
    project.getState().commit(tilt(20));

    last(layouts).refuse(new ApiError(422, "roof_too_small", "The roof has no room for a module. Make it larger.", "roof.outline"));
    await settled();

    expect(layoutOf(results.getState())?.readouts.positions).toBe(790);
    expect(layoutStatusOf(results.getState())).toBe("failed");
    expect(layoutFailureOf(results.getState())).toEqual({
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
      message: "Something went wrong in the app: result.options is not iterable. Try again; if it fails again, report it.",
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
