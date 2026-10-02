import { describe, expect, test } from "bun:test";
import type { Project } from "../api";
import { partsOfAnEdit } from "./edit-parts";

const DOCUMENT = {
  name: "Pune demo roof",
  roof: { lat: 18.52, lon: 73.86, roof_type: "flat_tilted", albedo: 0.2 },
  array: { tilt_deg: 15 },
  pan_text: "",
  pan_path: "",
  ond_text: "",
  system_voltage: 1500,
  chosen_option: "29x22x1",
  custom: null,
  ac_cable_m: 30,
} as unknown as Project;

const changed = (change: Partial<Project>) => ({ ...DOCUMENT, ...change }) as Project;

describe("what an edit changes (plan/phase-07-plan.md, decision 2)", () => {
  test("the roof, the array and the module ask for the layout and the run", () => {
    for (const change of [{ roof: { ...DOCUMENT.roof, lat: 18.53 } }, { array: { ...DOCUMENT.array } }, { pan_text: "PVObject_=pvModule" }, { pan_path: "other.PAN" }]) {
      expect(partsOfAnEdit(DOCUMENT, changed(change as Partial<Project>))).toEqual({ layout: true, run: true });
    }
  });

  test("the voltage, the inverter, the temperatures, the custom option and the cable ask for the run alone", () => {
    const changes: Partial<Project>[] = [
      { system_voltage: 1000 },
      { ond_text: "PVObject_=pvGInverter" },
      { t_min_override: 5 },
      { cell_rise_c: 30 },
      { imax_mppt_override: 60 },
      { custom: [26, 24, 1] },
      { ac_cable_m: 40 },
    ];
    for (const change of changes) expect(partsOfAnEdit(DOCUMENT, changed(change))).toEqual({ layout: false, run: true });
  });

  test("the roof's albedo asks for the run and not the layout: the layout does not read it (plan/phase-08-plan.md, decision 7)", () => {
    expect(partsOfAnEdit(DOCUMENT, changed({ roof: { ...DOCUMENT.roof, albedo: 0.3 } }))).toEqual({ layout: false, run: true });
  });

  test("the albedo with another field of the roof is a change of the roof", () => {
    expect(partsOfAnEdit(DOCUMENT, changed({ roof: { ...DOCUMENT.roof, albedo: 0.3, parapet_h: 1.2 } as Project["roof"] }))).toEqual({ layout: true, run: true });
  });

  test("the chosen option alone asks for nothing: the run's answer already holds every option", () => {
    expect(partsOfAnEdit(DOCUMENT, changed({ chosen_option: "26x24x1" }))).toEqual({ layout: false, run: false });
  });

  test("a field that is there in one document and not in the other is a change", () => {
    const without = { ...DOCUMENT } as Record<string, unknown>;
    delete without.ac_cable_m;
    expect(partsOfAnEdit(DOCUMENT, without as Project)).toEqual({ layout: false, run: true });
  });

  test("the chosen option with another field is a change of that field", () => {
    expect(partsOfAnEdit(DOCUMENT, changed({ chosen_option: "custom", custom: [26, 24, 1] }))).toEqual({ layout: false, run: true });
  });

  test("the same document asks for nothing", () => {
    expect(partsOfAnEdit(DOCUMENT, DOCUMENT)).toEqual({ layout: false, run: false });
  });
});
