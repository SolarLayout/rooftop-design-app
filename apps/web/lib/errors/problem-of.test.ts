import { describe, expect, test } from "bun:test";
import { CSV_REFUSED_TITLE, noStringsFitProblemOf, problemOfFile, problemOfFileTooLarge, problemOfFailure, problemOfNoOptions, SEARCH_UNAVAILABLE, whenOf, type Problem } from "./problem-of";

// Every problem in one shape (V2 · 5, D101; voice §5): the title (the thing and its state), the cause (one sentence, the agent
// named), the remedy (the first thing to try), the actions, and the details only a developer reads, behind Details.

const AT = "12 Oct 2026, 10:42";
const UNREACHABLE = { code: "api_unreachable", message: "The server cannot be reached. Check the connection and try again.", status: null, details: null };
const UNREADABLE = { code: "unexpected_answer", message: "The server answered 503 in a form that cannot be read.", status: 503, details: null };
const FAULT = { code: "unexpected_fault", message: "The app could not finish this step.", status: null, details: "TypeError: x is undefined" };
const REFUSED = { code: "roof_too_small", message: "The roof is too small for one module.", status: 422, details: null };

/** No word of the machine in the first two lines (voice §5). */
const MACHINE = /\b(HTTP|status|JSON|IndexedDB|WebGL|key|engine|request|catalog|TypeError|undefined)\b/i;
const firstTwoLines = (problem: Problem) => `${problem.title} ${problem.cause}`;

describe("a run that failed", () => {
  test("with nothing before: Energy not computed, the server named, what to do, Try again, the details", () => {
    expect(problemOfFailure(UNREACHABLE, { subject: "energy", hasBefore: false, at: AT })).toEqual({
      title: "Energy not computed",
      cause: "The server could not be reached.",
      remedy: "Check your connection, then try again.",
      actions: [{ id: "try-again", label: "Try again" }],
      details: `No answer · ${AT}`,
    });
  });

  test("after a change: Energy not updated, the result shown is from before the change", () => {
    const problem = problemOfFailure(UNREACHABLE, { subject: "energy", hasBefore: true, at: AT });
    expect(problem.title).toBe("Energy not updated");
    expect(problem.cause).toBe("The server could not be reached after your last change. The result shown is from before the change.");
  });

  test("an answer that cannot be read: the server did not answer, try again in a moment, its status in the details", () => {
    expect(problemOfFailure(UNREADABLE, { subject: "energy", hasBefore: false, at: AT })).toMatchObject({
      cause: "The server did not answer.",
      remedy: "Try again in a moment.",
      details: `503 · ${AT}`,
    });
  });

  test("a fault of the app: it could not finish this step, the fault in the details alone", () => {
    expect(problemOfFailure(FAULT, { subject: "layout", hasBefore: false, at: AT })).toEqual({
      title: "Layout not computed",
      cause: "The app could not finish this step.",
      remedy: "Try again.",
      actions: [{ id: "try-again", label: "Try again" }],
      details: `TypeError: x is undefined · ${AT}`,
    });
  });

  test("a refusal of the API: its own words, which say what to change; trying again would not help", () => {
    expect(problemOfFailure(REFUSED, { subject: "energy", hasBefore: false, at: AT })).toEqual({
      title: "Energy not computed",
      cause: "The roof is too small for one module.",
      remedy: null,
      actions: [],
      details: `422 · roof_too_small · ${AT}`,
    });
  });

  test("without the time, the details say what is known", () => {
    expect(problemOfFailure(UNREADABLE, { subject: "energy", hasBefore: false }).details).toBe("503");
  });

  test("no word of the machine in any problem's first two lines", () => {
    for (const failure of [UNREACHABLE, UNREADABLE, FAULT, REFUSED]) {
      for (const subject of ["energy", "layout"] as const) {
        for (const hasBefore of [false, true]) expect(firstTwoLines(problemOfFailure(failure, { subject, hasBefore, at: AT }))).not.toMatch(MACHINE);
      }
    }
  });
});

describe("no string length fits", () => {
  const range = { n_min: 14, n_max: 11 };

  test("at the voltage set: what the inverter needs and what a string holds; the inverter and the temperatures to change", () => {
    expect(noStringsFitProblemOf({ voltage: 600, range, fitsAt: null })).toEqual({
      problem: {
        title: "No string length fits at 600 V",
        cause: "This inverter needs at least 14 modules in a string. At 600 V a string holds at most 11.",
        remedy: null,
        actions: [
          { id: "choose-inverter", label: "Choose another inverter" },
          { id: "sizing", label: "Change the sizing temperatures" },
        ],
        details: null,
      },
      primary: null,
    });
  });

  test("where a higher voltage the equipment takes fits, it is the step's primary, with the site's code to check (D87, D88)", () => {
    expect(noStringsFitProblemOf({ voltage: 600, range, fitsAt: 1000 }).primary).toEqual({
      volts: 1000,
      label: "Use 1000 V",
      line: "Allowed on most commercial roofs. Check the site's code first.",
    });
  });
});

describe("no option to offer", () => {
  test("the result is not computed; the API's words are the cause, the way leads to where it is put right", () => {
    expect(problemOfNoOptions({ message: "The roof holds no position for a module.", path: "/studio/roof", stepName: "Roof" })).toEqual({
      title: "Energy not computed",
      cause: "The roof holds no position for a module.",
      remedy: null,
      actions: [{ id: "open", label: "Open Roof", href: "/studio/roof" }],
      details: null,
    });
  });
});

describe("a file that was not loaded", () => {
  const HOURS = "weather.csv has 8,000 hours, not the 8,760 of a year. Energy of a year needs every hour of it.";

  test("a refusal of the API stays in its dialog: This file cannot be used, the API's words, the detail behind Details", () => {
    expect(problemOfFile({ code: "csv_invalid", message: HOURS, status: 422 })).toEqual({
      title: "This file cannot be used",
      cause: HOURS,
      remedy: null,
      actions: [],
      details: "422 · csv_invalid",
    });
  });

  test("a file over the size the app takes is refused before any request: its words, nothing behind Details", () => {
    expect(problemOfFileTooLarge("This file is over 3 MB.")).toEqual({ title: "This file cannot be used", cause: "This file is over 3 MB.", remedy: null, actions: [], details: null });
  });

  test("a server that does not answer is no refusal of the file: it was not loaded, and trying another changes nothing", () => {
    const problem = problemOfFile(UNREACHABLE);

    expect(problem).toMatchObject({ title: "The file was not loaded", cause: "The server could not be reached.", actions: [] });
    expect(firstTwoLines(problem)).not.toMatch(MACHINE);
  });

  test("a fault of the app while reading the file: the fault behind Details alone", () => {
    expect(problemOfFile(FAULT)).toMatchObject({ title: "The file was not loaded", cause: "The app could not finish this step.", details: "TypeError: x is undefined" });
  });
});

describe("the other words", () => {
  test("the address search without its service, and a refused file", () => {
    expect(SEARCH_UNAVAILABLE).toBe("Address search is not available. Paste coordinates or a maps link.");
    expect(CSV_REFUSED_TITLE).toBe("This file cannot be used");
  });

  test("when, as the details say it", () => {
    expect(whenOf(new Date(2026, 9, 12, 10, 42))).toBe("12 Oct 2026, 10:42");
  });
});
