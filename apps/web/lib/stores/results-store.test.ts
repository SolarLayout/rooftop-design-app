import { describe, expect, test } from "bun:test";
import type { DesignResult, LayoutResponse } from "../api";
import {
  chosenOptionOf,
  createResultsStore,
  designEditOf,
  designFailureOf,
  designOf,
  designStatusOf,
  isDesignUpdating,
  isLayoutUpdating,
  layoutEditOf,
  layoutFailureOf,
  layoutOf,
  layoutStatusOf,
  newerLayoutNotesOf,
  noOptionsOf,
  progressOf,
  readoutsOf,
} from "./results-store";

// Answers as the API hands them out; what the tests do not read is left out.
function layout(positions: number, notes: string[] = []): LayoutResponse {
  return { layout: { notes }, readouts: { positions, roof_area_m2: 3600 } } as unknown as LayoutResponse;
}

function design(positions: number, chosen: string | null = "29x22x1"): DesignResult {
  return {
    chosen_option: chosen,
    options: [
      { key: "29x22x1", letter: "A", n_modules: 638 },
      { key: "26x24x1", letter: "B", n_modules: 624 },
    ],
    no_options: null,
    readouts: { positions, roof_area_m2: 3600 },
  } as unknown as DesignResult;
}

const WAITS_FOR_THE_VOLTAGE = {
  chosen_option: null,
  options: [],
  no_options: {
    code: "system_voltage_missing",
    title: "Choose a system voltage to size the strings",
    message: "600, 1000 or 1500 V. Nothing is sized until you choose.",
  },
  readouts: { positions: 790, roof_area_m2: 3600 },
} as unknown as DesignResult;

const UNREACHABLE = { code: "api_unreachable", message: "The server cannot be reached. Check the connection and try again." };
const SHADING = { type: "progress", step: "Computing hourly shading for every module", fraction: 0.4 } as const;

const fresh = () => createResultsStore();

describe("before anything was asked", () => {
  test("there is no result, nothing is on its way and nothing failed", () => {
    const state = fresh().getState();

    expect(layoutOf(state)).toBeNull();
    expect(designOf(state)).toBeNull();
    expect(readoutsOf(state)).toBeNull();
    expect(chosenOptionOf(state)).toBeNull();
    expect(noOptionsOf(state)).toBeNull();
    expect(progressOf(state)).toBeNull();
    expect(layoutStatusOf(state)).toBe("idle");
    expect(designStatusOf(state)).toBe("idle");
    expect(isLayoutUpdating(state)).toBe(false);
    expect(isDesignUpdating(state)).toBe(false);
  });
});

describe("the layout", () => {
  test("asked for, it is on its way", () => {
    const store = fresh();

    store.getState().layoutAsked(1);

    expect(layoutStatusOf(store.getState())).toBe("running");
    expect(isLayoutUpdating(store.getState())).toBe(true);
    expect(layoutOf(store.getState())).toBeNull();
  });

  test("arrived, it is kept with the edit it belongs to", () => {
    const store = fresh();
    const answer = layout(790);
    store.getState().layoutAsked(1);

    store.getState().layoutArrived(1, answer);

    expect(layoutOf(store.getState())).toBe(answer);
    expect(layoutEditOf(store.getState())).toBe(1);
    expect(layoutStatusOf(store.getState())).toBe("idle");
  });

  test("the one of before stays while the next is on its way", () => {
    const store = fresh();
    const before = layout(790);
    store.getState().layoutAsked(1);
    store.getState().layoutArrived(1, before);

    store.getState().layoutAsked(2);

    expect(layoutOf(store.getState())).toBe(before);
    expect(layoutEditOf(store.getState())).toBe(1);
    expect(isLayoutUpdating(store.getState())).toBe(true);
  });

  test("a late answer never replaces a newer one", () => {
    const store = fresh();
    const newer = layout(640);
    store.getState().layoutAsked(1);
    store.getState().layoutAsked(2);
    store.getState().layoutArrived(2, newer);

    store.getState().layoutArrived(1, layout(790));

    expect(layoutOf(store.getState())).toBe(newer);
    expect(layoutEditOf(store.getState())).toBe(2);
  });

  test("an answer to what was overtaken is dropped, and the newer one is still waited for", () => {
    const store = fresh();
    store.getState().layoutAsked(1);
    store.getState().layoutAsked(2);

    store.getState().layoutArrived(1, layout(790));

    expect(layoutOf(store.getState())).toBeNull();
    expect(isLayoutUpdating(store.getState())).toBe(true);
  });

  test("a failure keeps the last good one and says what failed", () => {
    const store = fresh();
    const good = layout(790);
    store.getState().layoutAsked(1);
    store.getState().layoutArrived(1, good);
    store.getState().layoutAsked(2);

    store.getState().layoutFailed(2, UNREACHABLE);

    expect(layoutOf(store.getState())).toBe(good);
    expect(layoutEditOf(store.getState())).toBe(1);
    expect(layoutStatusOf(store.getState())).toBe("failed");
    expect(layoutFailureOf(store.getState())).toEqual(UNREACHABLE);
    expect(isLayoutUpdating(store.getState())).toBe(false);
  });

  test("a failure of what was overtaken is dropped", () => {
    const store = fresh();
    store.getState().layoutAsked(1);
    store.getState().layoutAsked(2);

    store.getState().layoutFailed(1, UNREACHABLE);

    expect(layoutStatusOf(store.getState())).toBe("running");
    expect(layoutFailureOf(store.getState())).toBeNull();
  });

  test("asked again, the failure of before is gone", () => {
    const store = fresh();
    store.getState().layoutAsked(1);
    store.getState().layoutFailed(1, UNREACHABLE);

    store.getState().layoutAsked(2);

    expect(layoutFailureOf(store.getState())).toBeNull();
    expect(layoutStatusOf(store.getState())).toBe("running");
  });
});

describe("the design run", () => {
  test("it waits first, then runs; both are on its way", () => {
    const store = fresh();

    store.getState().designWaits(1);
    expect(designStatusOf(store.getState())).toBe("waiting");
    expect(isDesignUpdating(store.getState())).toBe(true);

    store.getState().designBegan(1);
    expect(designStatusOf(store.getState())).toBe("running");
    expect(isDesignUpdating(store.getState())).toBe(true);
  });

  test("its progress is told in the words of the engine", () => {
    const store = fresh();
    store.getState().designBegan(1);

    store.getState().designProgressed(1, SHADING);

    expect(progressOf(store.getState())).toEqual(SHADING);
  });

  test("the progress of a run that was overtaken is dropped", () => {
    const store = fresh();
    store.getState().designBegan(1);
    store.getState().designWaits(2);

    store.getState().designProgressed(1, SHADING);

    expect(progressOf(store.getState())).toBeNull();
  });

  test("arrived, it is kept with its edit, and the progress is over", () => {
    const store = fresh();
    const answer = design(790);
    store.getState().designBegan(1);
    store.getState().designProgressed(1, SHADING);

    store.getState().designArrived(1, answer);

    expect(designOf(store.getState())).toBe(answer);
    expect(designEditOf(store.getState())).toBe(1);
    expect(designStatusOf(store.getState())).toBe("idle");
    expect(progressOf(store.getState())).toBeNull();
    expect(isDesignUpdating(store.getState())).toBe(false);
  });

  test("the one of before stays while the next waits and runs, and a new run begins without progress", () => {
    const store = fresh();
    const before = design(790);
    store.getState().designBegan(1);
    store.getState().designProgressed(1, SHADING);
    store.getState().designArrived(1, before);

    store.getState().designWaits(2);
    expect(designOf(store.getState())).toBe(before);
    expect(designEditOf(store.getState())).toBe(1);

    store.getState().designBegan(2);
    expect(designOf(store.getState())).toBe(before);
    expect(progressOf(store.getState())).toBeNull();
  });

  test("a late answer never replaces a newer one", () => {
    const store = fresh();
    const newer = design(640);
    store.getState().designBegan(1);
    store.getState().designBegan(2);
    store.getState().designArrived(2, newer);

    store.getState().designArrived(1, design(790));

    expect(designOf(store.getState())).toBe(newer);
    expect(designEditOf(store.getState())).toBe(2);
  });

  test("a failure keeps the last good one, not updating, and says what failed", () => {
    const store = fresh();
    const good = design(790);
    store.getState().designBegan(1);
    store.getState().designArrived(1, good);
    store.getState().designBegan(2);
    store.getState().designProgressed(2, SHADING);

    store.getState().designFailed(2, UNREACHABLE);

    expect(designOf(store.getState())).toBe(good);
    expect(designEditOf(store.getState())).toBe(1);
    expect(designStatusOf(store.getState())).toBe("failed");
    expect(designFailureOf(store.getState())).toEqual(UNREACHABLE);
    expect(isDesignUpdating(store.getState())).toBe(false);
    expect(progressOf(store.getState())).toBeNull();
  });

  test("a failure of a run that was overtaken is dropped", () => {
    const store = fresh();
    store.getState().designBegan(1);
    store.getState().designWaits(2);

    store.getState().designFailed(1, UNREACHABLE);

    expect(designStatusOf(store.getState())).toBe("waiting");
    expect(designFailureOf(store.getState())).toBeNull();
  });

  test("tried again, the failure of before is gone", () => {
    const store = fresh();
    store.getState().designBegan(1);
    store.getState().designFailed(1, UNREACHABLE);

    store.getState().designBegan(1);

    expect(designFailureOf(store.getState())).toBeNull();
    expect(designStatusOf(store.getState())).toBe("running");
  });
});

describe("what is read of the results", () => {
  test("the option that is chosen is the one the result names", () => {
    const store = fresh();
    store.getState().designBegan(1);
    store.getState().designArrived(1, design(790, "26x24x1"));

    expect(chosenOptionOf(store.getState())).toMatchObject({ letter: "B", n_modules: 624 });
    expect(chosenOptionOf(store.getState())).toBe(chosenOptionOf(store.getState()));
  });

  test("no option is chosen when the result names one it does not have", () => {
    const store = fresh();
    store.getState().designBegan(1);
    store.getState().designArrived(1, design(790, "30x20x1"));

    expect(chosenOptionOf(store.getState())).toBeNull();
  });

  test("without a system voltage the result says what it waits for, in the words of the API", () => {
    const store = fresh();
    store.getState().designBegan(1);
    store.getState().designArrived(1, WAITS_FOR_THE_VOLTAGE);

    expect(chosenOptionOf(store.getState())).toBeNull();
    expect(noOptionsOf(store.getState())).toEqual({
      code: "system_voltage_missing",
      title: "Choose a system voltage to size the strings",
      message: "600, 1000 or 1500 V. Nothing is sized until you choose.",
    });
  });

  test("the read-outs are those of the layout when it is the newer one", () => {
    const store = fresh();
    store.getState().designBegan(1);
    store.getState().designArrived(1, design(790));
    store.getState().layoutAsked(2);
    store.getState().layoutArrived(2, layout(640));

    expect(readoutsOf(store.getState())?.positions).toBe(640);
  });

  test("the read-outs are those of the design when the layout is not newer", () => {
    const store = fresh();
    store.getState().layoutAsked(1);
    store.getState().layoutArrived(1, layout(790));
    store.getState().designBegan(2);
    store.getState().designArrived(2, design(640));

    expect(readoutsOf(store.getState())?.positions).toBe(640);
  });

  test("the read-outs of the one that is there", () => {
    const store = fresh();
    store.getState().layoutAsked(1);
    store.getState().layoutArrived(1, layout(790));

    expect(readoutsOf(store.getState())?.positions).toBe(790);
  });
});

describe("the notes of the layout", () => {
  const UNIT_GAP = "Unit gap 0.30 m keeps east-west units shade-free in the window.";

  test("of a layout that is newer than the design", () => {
    const store = fresh();
    store.getState().designBegan(1);
    store.getState().designArrived(1, design(790));
    store.getState().layoutAsked(2);
    store.getState().layoutArrived(2, layout(640, [UNIT_GAP]));

    expect(newerLayoutNotesOf(store.getState())).toEqual([UNIT_GAP]);
    expect(newerLayoutNotesOf(store.getState())).toBe(newerLayoutNotesOf(store.getState()));
  });

  test("of a layout before its design came", () => {
    const store = fresh();
    store.getState().layoutAsked(1);
    store.getState().layoutArrived(1, layout(790, [UNIT_GAP]));

    expect(newerLayoutNotesOf(store.getState())).toEqual([UNIT_GAP]);
  });

  test("none of their own when the design is as new: it has the notes of its layout itself", () => {
    const store = fresh();
    store.getState().layoutAsked(1);
    store.getState().layoutArrived(1, layout(790, [UNIT_GAP]));
    store.getState().designBegan(1);
    store.getState().designArrived(1, design(790));

    expect(newerLayoutNotesOf(store.getState())).toBeNull();
  });

  test("none before a layout came", () => {
    expect(newerLayoutNotesOf(fresh().getState())).toBeNull();
  });
});

describe("another design is opened", () => {
  test("nothing of the one before stays", () => {
    const store = fresh();
    store.getState().layoutAsked(1);
    store.getState().layoutArrived(1, layout(790));
    store.getState().designBegan(1);
    store.getState().designArrived(1, design(790));
    store.getState().designBegan(2);
    store.getState().designFailed(2, UNREACHABLE);

    store.getState().clear();

    expect(layoutOf(store.getState())).toBeNull();
    expect(designOf(store.getState())).toBeNull();
    expect(designStatusOf(store.getState())).toBe("idle");
    expect(designFailureOf(store.getState())).toBeNull();
  });

  test("an answer for the one before, which comes after, is dropped", () => {
    const store = fresh();
    store.getState().designBegan(1);

    store.getState().clear();
    store.getState().designArrived(1, design(790));

    expect(designOf(store.getState())).toBeNull();
  });
});

describe("an option chosen (plan/phase-07-plan.md, step 9, decision 3)", () => {
  test("is the run's chosen option at once: the run's answer holds every option", () => {
    const results = createResultsStore();
    results.getState().designBegan(1);
    results.getState().designArrived(1, design(790));

    results.getState().optionChosen("26x24x1");

    expect(chosenOptionOf(results.getState())?.letter).toBe("B");
    expect(designEditOf(results.getState())).toBe(1);
    expect(designStatusOf(results.getState())).toBe("idle");
  });

  test("a key the run does not hold, or none, leaves the run's own choice", () => {
    const results = createResultsStore();
    results.getState().designBegan(1);
    results.getState().designArrived(1, design(790));
    const before = designOf(results.getState());

    results.getState().optionChosen("custom");
    results.getState().optionChosen("");

    expect(designOf(results.getState())).toBe(before);
    expect(chosenOptionOf(results.getState())?.letter).toBe("A");
  });

  test("before any run there is nothing to choose in", () => {
    const results = createResultsStore();
    results.getState().optionChosen("26x24x1");
    expect(designOf(results.getState())).toBeNull();
  });
});
