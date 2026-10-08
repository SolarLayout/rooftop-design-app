import { describe, expect, test } from "bun:test";
import type { Project } from "../api";
import { canRedo, canUndo, createProjectStore, editOf, latitudeOf, longitudeOf, nameOf, openedAtOf, projectOf, systemVoltageOf, weatherCsvOf, weatherSourceOf } from "./project-store";

// A document as the API hands it out; what the tests do not read is left out.
const DEMO = {
  name: "Pune demo roof",
  system_voltage: 1500,
  chosen_option: "",
  roof: { lat: 18.52, lon: 73.86 },
  array: { tilt_deg: 15, modules_in_tilt: 2 },
} as unknown as Project;

const WITHOUT_A_VOLTAGE = { ...DEMO, name: "New roof", system_voltage: null } as Project;

describe("the project", () => {
  test("before a design is open there is none, and nothing was edited", () => {
    const state = createProjectStore().getState();

    expect(projectOf(state)).toBeNull();
    expect(editOf(state)).toBe(0);
    expect(openedAtOf(state)).toBeNull();
  });

  test("a design that is opened is the document as it came", () => {
    const store = createProjectStore();

    store.getState().open(DEMO);

    expect(projectOf(store.getState())).toBe(DEMO);
    expect(editOf(store.getState())).toBe(1);
    expect(openedAtOf(store.getState())).toBe(1);
  });

  test("a committed edit makes a new document and counts", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);

    store.getState().commit((project) => ({ ...project, array: { ...project.array, tilt_deg: 20 } }));

    expect(projectOf(store.getState())?.array.tilt_deg).toBe(20);
    expect(DEMO.array.tilt_deg).toBe(15);
    expect(editOf(store.getState())).toBe(2);
    expect(openedAtOf(store.getState())).toBe(1);
  });

  test("an edit that changes nothing does not count", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);

    store.getState().commit((project) => project);

    expect(editOf(store.getState())).toBe(1);
  });

  test("another design that is opened counts on: results of the one before are older", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);
    store.getState().commit((project) => ({ ...project, name: "Pune, second try" }));

    store.getState().open(WITHOUT_A_VOLTAGE);

    expect(nameOf(store.getState())).toBe("New roof");
    expect(editOf(store.getState())).toBe(3);
    expect(openedAtOf(store.getState())).toBe(3);
  });

  test("an edit before a design is open is refused, and says why", () => {
    const store = createProjectStore();

    expect(() => store.getState().commit((project) => ({ ...project, name: "Too early" }))).toThrow(
      "No design is open: open one before it is edited.",
    );
  });

  test("who listens hears an edit", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);
    const heard: number[] = [];
    store.subscribe((state) => heard.push(editOf(state)));

    store.getState().commit((project) => ({ ...project, name: "Renamed" }));

    expect(heard).toEqual([2]);
  });
});

describe("what is read of the project", () => {
  test("its name and where it is", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);

    expect(nameOf(store.getState())).toBe("Pune demo roof");
    expect(latitudeOf(store.getState())).toBe(18.52);
    expect(longitudeOf(store.getState())).toBe(73.86);
  });

  test("nothing of a design that is not open", () => {
    const state = createProjectStore().getState();

    expect(nameOf(state)).toBeNull();
    expect(latitudeOf(state)).toBeNull();
    expect(longitudeOf(state)).toBeNull();
    expect(systemVoltageOf(state)).toBeNull();
    expect(weatherSourceOf(state)).toBeNull();
    expect(weatherCsvOf(state)).toBeNull();
  });

  test("its weather source and the name of its CSV file, as the document has them", () => {
    const store = createProjectStore();
    store.getState().open({ ...DEMO, weather_source: "csv", weather_csv: "pune-ghi.csv" } as Project);

    expect(weatherSourceOf(store.getState())).toBe("csv");
    expect(weatherCsvOf(store.getState())).toBe("pune-ghi.csv");
  });

  test("the system voltage is the one of the document", () => {
    const store = createProjectStore();

    store.getState().open(DEMO);
    expect(systemVoltageOf(store.getState())).toBe(1500);
  });

  test("a document without a system voltage gets none: it is for the user to choose", () => {
    const store = createProjectStore();

    store.getState().open(WITHOUT_A_VOLTAGE);
    store.getState().commit((project) => ({ ...project, array: { ...project.array, tilt_deg: 10 } }));

    expect(systemVoltageOf(store.getState())).toBeNull();
    expect(projectOf(store.getState())?.system_voltage).toBeNull();
  });

  test("a document that leaves the system voltage out gets none either", () => {
    const store = createProjectStore();
    const leftOut: Partial<Project> = { ...DEMO };
    delete leftOut.system_voltage;

    store.getState().open(leftOut as Project);

    expect(systemVoltageOf(store.getState())).toBeNull();
    expect("system_voltage" in (projectOf(store.getState()) ?? {})).toBe(false);
  });
});

// Undo and redo of committed edits (plan/phase-05-plan.md, step 18, decision 11): the documents of the
// last fifty edits are kept; an undo or a redo is an edit like any other, so the layout follows it.
describe("undo and redo", () => {
  const tilt = (degrees: number) => (project: Project) => ({ ...project, array: { ...project.array, tilt_deg: degrees } });

  test("nothing to undo or redo before an edit", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);

    expect(canUndo(store.getState())).toBe(false);
    expect(canRedo(store.getState())).toBe(false);
    store.getState().undo();
    expect(editOf(store.getState())).toBe(1);
  });

  test("undo gives the document of before, and counts as an edit; redo the one after", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);
    store.getState().commit(tilt(20));
    store.getState().commit(tilt(25));

    store.getState().undo();
    expect(projectOf(store.getState())?.array.tilt_deg).toBe(20);
    expect(editOf(store.getState())).toBe(4);
    expect(canRedo(store.getState())).toBe(true);

    store.getState().undo();
    expect(projectOf(store.getState())).toBe(DEMO);
    expect(canUndo(store.getState())).toBe(false);

    store.getState().redo();
    expect(projectOf(store.getState())?.array.tilt_deg).toBe(20);
    expect(editOf(store.getState())).toBe(6);
  });

  test("a new edit after an undo drops what could be redone", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);
    store.getState().commit(tilt(20));
    store.getState().undo();

    store.getState().commit(tilt(30));

    expect(canRedo(store.getState())).toBe(false);
    store.getState().undo();
    expect(projectOf(store.getState())).toBe(DEMO);
  });

  test("another design opened starts afresh", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);
    store.getState().commit(tilt(20));

    store.getState().open(WITHOUT_A_VOLTAGE);

    expect(canUndo(store.getState())).toBe(false);
  });

  test("fifty edits are kept, the oldest forgotten", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);
    for (let degrees = 1; degrees <= 60; degrees += 1) store.getState().commit(tilt(degrees));

    for (let n = 0; n < 50; n += 1) store.getState().undo();

    expect(projectOf(store.getState())?.array.tilt_deg).toBe(10);
    expect(canUndo(store.getState())).toBe(false);
  });
});

// An amendment (plan/phase-08-plan.md, decision 11): what belongs to the document of an edit and the user did not
// do, the weather the flow loaded for it. It counts no edit and is no step of undo.
describe("an amendment of the edit that is current", () => {
  const weather = { label: "PVGIS TMY" } as unknown as Project["weather_json"];
  const withWeather = (project: Project) => ({ ...project, weather_json: weather });

  test("replaces the document while the edit is the current one, and gives the document back", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);

    const amended = store.getState().amend(1, withWeather);

    expect(amended).toBe(projectOf(store.getState()));
    expect(projectOf(store.getState())?.weather_json).toBe(weather);
    expect(DEMO.weather_json).toBeUndefined();
  });

  test("counts no edit, and is no step of undo: an undo goes back to the document before the edit", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);
    store.getState().commit((project) => ({ ...project, name: "Renamed" }));

    store.getState().amend(2, withWeather);

    expect(editOf(store.getState())).toBe(2);
    expect(canUndo(store.getState())).toBe(true);
    store.getState().undo();
    expect(projectOf(store.getState())).toBe(DEMO);
    expect(canRedo(store.getState())).toBe(true);
    store.getState().redo();
    expect(projectOf(store.getState())?.weather_json).toBe(weather);
  });

  test("does nothing once another edit is current, and says so with null", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);
    store.getState().commit((project) => ({ ...project, name: "Renamed" }));

    expect(store.getState().amend(1, withWeather)).toBeNull();

    expect(projectOf(store.getState())?.weather_json).toBeUndefined();
    expect(editOf(store.getState())).toBe(2);
  });

  test("does nothing before a design is open", () => {
    const store = createProjectStore();

    expect(store.getState().amend(0, withWeather)).toBeNull();
    expect(projectOf(store.getState())).toBeNull();
  });

  test("a change that changes nothing leaves the document as it was", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);

    expect(store.getState().amend(1, (project) => project)).toBe(DEMO);
    expect(projectOf(store.getState())).toBe(DEMO);
  });

  test("who listens hears it, with the edit unchanged", () => {
    const store = createProjectStore();
    store.getState().open(DEMO);
    const heard: number[] = [];
    store.subscribe((state) => heard.push(editOf(state)));

    store.getState().amend(1, withWeather);

    expect(heard).toEqual([1]);
  });
});

describe("the system voltage of a design opened without one (D87)", () => {
  test("is the one of the user's country, set by the app, as part of the opening", () => {
    const store = createProjectStore({ voltageOfANewDesign: () => 600 });

    store.getState().open(WITHOUT_A_VOLTAGE);

    expect(projectOf(store.getState())).toEqual({ ...WITHOUT_A_VOLTAGE, system_voltage: 600, system_voltage_by: "app" });
    expect(editOf(store.getState())).toBe(1);
    expect(canUndo(store.getState())).toBe(false);
  });

  test("leaves a design's own voltage as it is, whoever set it", () => {
    const store = createProjectStore({ voltageOfANewDesign: () => 600 });

    store.getState().open(DEMO);

    expect(projectOf(store.getState())).toBe(DEMO);
  });

  test("is asked when the design is opened, so the country known by then is the one used", () => {
    let volts: 600 | 1000 = 1000;
    const store = createProjectStore({ voltageOfANewDesign: () => volts });
    volts = 600;

    store.getState().open(WITHOUT_A_VOLTAGE);

    expect(systemVoltageOf(store.getState())).toBe(600);
  });
});
