import { describe, expect, test } from "bun:test";
import type { DesignOption, DesignResult, Project } from "../../lib/api";
import { introOf, keepWordsOf, notesOf, reviewTitleOf, withNoteValue, subjectOf, withTrueMinus, wordsOfTheTarget } from "./notes-view";

const VOC =
  "Voc coefficient -0.164 %/°C is outside the usual -0.35 to -0.20 %/°C for crystalline silicon. Check the datasheet and enter it if it differs.";
const VOC_SHOWN =
  "Voc coefficient −0.164 %/°C is outside the usual −0.35 to −0.20 %/°C for crystalline silicon. Check the datasheet and enter it if it differs.";
const NO_SIZE = "insolation.PAN gives no size of the module (Width and Height). The layout needs it: choose a PAN file that has it.";
const UNIT_GAP = "Unit gap 0.30 m keeps east-west units shade-free in the window.";
const NO_BEAM =
  "weather.csv has no beam and diffuse irradiance. They were worked out from the global irradiance (Erbs model), which is less exact than measured values.";
const HOURS = "weather.csv has 8,000 hours, not the 8,760 of a year. Energy of a year needs every hour of it.";

const UNREACHABLE = { code: "api_unreachable", message: "The server cannot be reached. Check the connection and try again." };

const OPTION_A = { key: "29x22x1", letter: "A", ok: true, note: "", verdict: { ok: true, title: "", detail: "" } } as unknown as DesignOption;
const OPTION_D = {
  key: "26x27x2",
  letter: "D",
  ok: false,
  note: "below target",
  verdict: { ok: false, title: "26 in series fits: Vmp 1,072 V at STC", detail: "27 strings on 2 inverter(s), DC/AC 0.71 (below target)." },
} as unknown as DesignOption;

function design(parts: { module?: string[]; layout?: string[]; weather?: string[]; chosen?: DesignOption | null }): DesignResult {
  const chosen = parts.chosen === undefined ? OPTION_A : parts.chosen;
  return {
    chosen_option: chosen?.key ?? null,
    options: chosen ? [chosen] : [],
    equipment: { module_notes: parts.module ?? [] },
    layout: { notes: parts.layout ?? [] },
    weather_notes: parts.weather ?? [],
    options_note: "5 of 12 combinations are inside the DC/AC target.",
    far_shading_note: "The horizon is up to 2.7° high.",
  } as unknown as DesignResult;
}

const NOTHING = { design: null, layoutNotes: null, designFailure: null, layoutFailure: null, savingFailure: null };
const NOT_KEPT = "The design could not be kept on this device: QuotaExceededError.";

describe("the notes to review", () => {
  test("none before there is a result", () => {
    expect(notesOf(NOTHING)).toEqual([]);
  });

  test("none when every check fits", () => {
    expect(notesOf({ ...NOTHING, design: design({}) })).toEqual([]);
  });

  test("the demo has one, of its module: it leads to the Array step", () => {
    expect(notesOf({ ...NOTHING, design: design({ module: [VOC] }) })).toEqual([
      {
        id: "module-0",
        title: "Voc coefficient outside the usual range",
        reason: "Usually −0.35 to −0.20 %/°C for this kind of module. Enter the datasheet's value.",
        where: "Module · Array step",
        action: { kind: "open", label: "Open Array", path: "/studio/array" },
        field: { id: "voc_coefficient_pct", label: "Voc coefficient", unit: "%/°C", value: -0.164, source: "From the module file" },
      },
    ]);
  });

  test("a value outside the usual range keeps the engine's words when no field of the app puts it right", () => {
    const other = "Cell rise 80.0 °C is outside the usual 10.00 to 40.00 °C for crystalline silicon. Check the datasheet and enter it if it differs.";
    const [note] = notesOf({ ...NOTHING, design: design({ module: [other] }) });

    expect(note?.field).toBeUndefined();
    expect(note?.title).toBe("Cell rise outside the usual range");
    expect(note?.reason).toBe("Usually 10.00 to 40.00 °C for this kind of module. Enter the datasheet's value.");
  });

  test("a value entered in the note is the document's, the user's from now on; the same value leaves the document as it is", () => {
    const document = { voc_coefficient_pct: null } as unknown as Project;

    expect(withNoteValue(document, "voc_coefficient_pct", -0.164)).toEqual({ voc_coefficient_pct: -0.164 } as unknown as Project);
    const entered = withNoteValue(document, "voc_coefficient_pct", -0.164);
    expect(withNoteValue(entered, "voc_coefficient_pct", -0.164)).toBe(entered);
  });

  test("Keep says the value that stays", () => {
    expect(keepWordsOf({ id: "voc_coefficient_pct", label: "Voc coefficient", unit: "%/°C", value: -0.164, source: "From the module file" })).toBe("Keep −0.164");
  });

  test("a note of the layout leads to the Array lens, one of the weather to Performance", () => {
    const notes = notesOf({ ...NOTHING, design: design({ layout: [UNIT_GAP], weather: [NO_BEAM] }) });

    expect(notes.map((note) => [note.id, note.title, note.where, note.action])).toEqual([
      ["layout-0", "Unit gap", "Layout · Array step", { kind: "open", label: "Open Array", path: "/studio/array" }],
      ["weather-0", "weather.csv", "Weather · Performance", { kind: "open", label: "Open Performance", path: "/performance" }],
    ]);
  });

  test("the notes of a layout that is newer than the design are those that count", () => {
    const notes = notesOf({ ...NOTHING, design: design({ layout: [UNIT_GAP] }), layoutNotes: [] });

    expect(notes).toEqual([]);
  });

  test("the notes of the layout are there before a design is", () => {
    const notes = notesOf({ ...NOTHING, layoutNotes: [UNIT_GAP] });

    expect(notes.map((note) => note.title)).toEqual(["Unit gap"]);
  });

  test("the chosen option, when its DC/AC is not in target: in the words of the engine", () => {
    const notes = notesOf({ ...NOTHING, design: design({ chosen: OPTION_D }) });

    expect(notes).toEqual([
      {
        id: "option",
        title: "Below the DC/AC target",
        reason: "27 strings on 2 inverter(s), DC/AC 0.71 (below target).",
        where: "Option D · Strings step",
        action: { kind: "open", label: "Open Strings", path: "/studio/strings" },
      },
    ]);
  });

  test("what explains is no note to review", () => {
    const notes = notesOf({ ...NOTHING, design: design({}) });

    expect(notes.map((note) => note.reason).join(" ")).not.toContain("combinations");
    expect(notes.map((note) => note.reason).join(" ")).not.toContain("horizon");
  });

  test("a run that failed, after the notes of the design: the last result is shown, and it can be tried again", () => {
    const notes = notesOf({ ...NOTHING, design: design({ module: [VOC] }), designFailure: UNREACHABLE });

    expect(notes.map((note) => note.id)).toEqual(["module-0", "design-failed"]);
    expect(notes[1]).toEqual({
      id: "design-failed",
      title: "Energy not updated",
      reason: "The server could not be reached. Check your connection, then try again.",
      where: "Showing the last result",
      action: { kind: "try-again", label: "Try again" },
    });
  });

  test("a run that failed before any came: there is no result", () => {
    const [note] = notesOf({ ...NOTHING, designFailure: UNREACHABLE });

    expect(note).toMatchObject({ title: "Energy not computed", where: "There is no result yet" });
  });

  test("a layout that failed", () => {
    const notes = notesOf({ ...NOTHING, design: design({}), layoutFailure: UNREACHABLE });

    expect(notes).toEqual([
      {
        id: "layout-failed",
        title: "Layout not updated",
        reason: "The server could not be reached. Check your connection, then try again.",
        where: "Showing the last positions",
        action: { kind: "try-again", label: "Try again" },
      },
    ]);
  });

  test("a design the device refused to keep, after the notes of the design: the words of the device, and it can be tried again", () => {
    const notes = notesOf({ ...NOTHING, design: design({ module: [VOC] }), savingFailure: NOT_KEPT });

    expect(notes.map((note) => note.id)).toEqual(["module-0", "not-saved"]);
    expect(notes[1]).toEqual({
      id: "not-saved",
      title: "Not saved",
      reason: NOT_KEPT,
      where: "This design · on this device",
      action: { kind: "try-again", label: "Try again" },
    });
  });

  test("every note has a name of its own", () => {
    const notes = notesOf({
      design: design({ module: [VOC, NO_SIZE], layout: [UNIT_GAP], weather: [NO_BEAM, HOURS], chosen: OPTION_D }),
      layoutNotes: null,
      designFailure: UNREACHABLE,
      layoutFailure: UNREACHABLE,
      savingFailure: NOT_KEPT,
    });

    expect(notes).toHaveLength(9);
    expect(new Set(notes.map((note) => note.id)).size).toBe(9);
  });
});

describe("the list of notes", () => {
  test("its title is the count the chip shows", () => {
    expect(reviewTitleOf(1)).toBe("1 to review");
    expect(reviewTitleOf(3)).toBe("3 to review");
    expect(reviewTitleOf(0)).toBe("Notes to review");
  });

  test("a line under it when a value is outside the usual range: each note says how to fix it", () => {
    const notes = notesOf({ ...NOTHING, design: design({ module: [VOC] }) });

    expect(introOf(notes)).toBe("Values outside the usual range. Each one says how to fix it.");
    expect(introOf(notesOf({ ...NOTHING, layoutNotes: [UNIT_GAP] }))).toBeNull();
  });
});

describe("the title of a note: what it is about", () => {
  test.each([
    [VOC, "Voc coefficient"],
    [UNIT_GAP, "Unit gap"],
    [NO_SIZE, "insolation.PAN"],
    [NO_BEAM, "weather.csv"],
    [HOURS, "weather.csv"],
    ["3 strings are longer than the inverter allows.", "3 strings"],
  ])("%s", (reason, subject) => {
    expect(subjectOf(reason, "Module")).toBe(subject);
  });

  test("a minus sign before a number belongs to the number", () => {
    expect(subjectOf("Voc coefficient −0.164 %/°C is outside the usual.", "Module")).toBe("Voc coefficient");
  });

  test.each([
    ["Check the datasheet.", "no number and no verb that is known"],
    ["The coefficient of the open-circuit voltage of this module 0.2 is low.", "more than four words"],
    ["", "nothing"],
  ])("'%s' is named by where it came from: %s", (reason) => {
    expect(subjectOf(reason, "Module")).toBe("Module");
  });
});

describe("the words of the DC/AC mark", () => {
  test.each([
    [{ ok: true, note: "" }, "In target"],
    [{ ok: false, note: "below target" }, "Below the DC/AC target"],
    [{ ok: false, note: "above target" }, "Above the DC/AC target"],
    [{ ok: false, note: "heavy clipping" }, "Heavy clipping"],
    [{ ok: false, note: "" }, "Outside the DC/AC target"],
  ])("%o: %s", (option, words) => {
    expect(wordsOfTheTarget(option)).toBe(words);
  });
});

describe("a minus sign in display text", () => {
  test("before a number it is the true one; the words stay", () => {
    expect(withTrueMinus(VOC)).toBe(VOC_SHOWN);
    expect(withTrueMinus("-2.22 % (-0.5 to -0.1)")).toBe("−2.22 % (−0.5 to −0.1)");
  });

  test("a hyphen in a word or between numbers stays", () => {
    expect(withTrueMinus("east-west units, 600-1500 V, INA-144MHC-TF-560")).toBe("east-west units, 600-1500 V, INA-144MHC-TF-560");
  });
});
