import { describe, expect, test } from "bun:test";
import type { Project } from "../api";
import { createProjectStore, editOf, latitudeOf, longitudeOf, nameOf, openedAtOf, projectOf, systemVoltageOf } from "./project-store";

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
