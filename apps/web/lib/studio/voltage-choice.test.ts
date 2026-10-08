import { describe, expect, test } from "bun:test";
import type { Project } from "../api";
import { withVoltageChosen } from "./voltage-choice";

const SET_BY_THE_APP = { name: "New roof", system_voltage: 1000, system_voltage_by: "app" } as unknown as Project;

describe("a system voltage chosen in the lens", () => {
  test("is the user's, whatever set it before", () => {
    expect(withVoltageChosen(SET_BY_THE_APP, 1500)).toEqual({ ...SET_BY_THE_APP, system_voltage: 1500, system_voltage_by: "user" });
  });

  test("makes the app's value the user's when the user presses it", () => {
    expect(withVoltageChosen(SET_BY_THE_APP, 1000)).toEqual({ ...SET_BY_THE_APP, system_voltage_by: "user" });
  });

  test("changes nothing when it is the user's already", () => {
    const yours = { ...SET_BY_THE_APP, system_voltage_by: "user" } as Project;

    expect(withVoltageChosen(yours, 1000)).toBe(yours);
  });
});
