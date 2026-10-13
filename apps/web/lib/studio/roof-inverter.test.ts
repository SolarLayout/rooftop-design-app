import { describe, expect, test } from "bun:test";
import type { BelowTarget, DesignResult, Inverter, Project, RoofInverter } from "../api";
import { belowTargetOf, inverterSetByOf, withTheRoofsInverter } from "./roof-inverter";
import { wordOf } from "./set-by";

const WAAREE = { manufacturer: "Waaree Energies Ltd.", model: "3P-136K (75-136 kW)", pnom_kw: 136, n_mppt: 10, source: "Waaree_3P-136K_75-136kW.OND" } as Inverter;
const ROOFS = (inUse: boolean, more: Partial<RoofInverter> = {}): RoofInverter => ({ file: "Waaree_3P-136K_75-136kW.OND", inverter: WAAREE, n_series: 18, n_strings: 16, n_inverters: 1, dcac: 1.2283, in_use: inUse, ...more });
const BELOW: BelowTarget = {
  title: "No option within the DC/AC target",
  message: "This inverter's 275 kW is more than the roof's 167.04 kWp can fill: the best option reaches 0.61, and the target is 1.10 to 1.30.",
  ac_kw_from: 128.49,
  ac_kw_to: 151.85,
};
const designWith = (roof: RoofInverter | null, below: BelowTarget | null = null) => ({ roof_inverter: roof, below_target: below }) as DesignResult;
const DOCUMENT = { ond_text: "PVObject_=pvGInverter", ond_path: "Fronius_Tauro.OND", inverter_by: "user", imax_mppt_override: 60 } as Project;

describe("the inverter for the roof, chosen by the app (D118)", () => {
  test("handing the inverter back to the app leaves the user's file and their current per MPPT", () => {
    expect(withTheRoofsInverter(DOCUMENT)).toEqual({ ...DOCUMENT, ond_text: "", ond_path: "", inverter_by: "app", imax_mppt_override: null });
  });

  test("an inverter the app set is the same document handed back", () => {
    const theApps = withTheRoofsInverter(DOCUMENT);
    expect(withTheRoofsInverter(theApps)).toBe(theApps);
  });

  test("who set it: Chosen for this roof while the run used the roof's; Default when none fits; Yours for a file of the user's", () => {
    const theApps = { ond_text: "", inverter_by: "app" } as Project;

    expect(wordOf(inverterSetByOf(theApps, designWith(ROOFS(true))))).toBe("Chosen for this roof");
    expect(wordOf(inverterSetByOf(theApps, designWith(null)))).toBe("Default");
    expect(wordOf(inverterSetByOf(theApps, null))).toBe("Default");
    expect(wordOf(inverterSetByOf(DOCUMENT, designWith(ROOFS(false))))).toBe("Yours");
  });
});

describe("no option within the DC/AC target (D118; V2 · 5, the problem at the step's head)", () => {
  test("nothing to say while an option reaches the target", () => {
    expect(belowTargetOf(designWith(ROOFS(true)))).toBeNull();
    expect(belowTargetOf(null)).toBeNull();
  });

  test("the cause, the inverter for the roof as the remedy and the step's primary, and Choose another inverter", () => {
    expect(belowTargetOf(designWith(ROOFS(false), BELOW))).toEqual({
      problem: {
        title: "No option within the DC/AC target",
        cause: BELOW.message,
        remedy: "Waaree 3P-136K (75-136 kW) reaches 1.23 on this roof.",
        actions: [{ id: "choose-inverter", label: "Choose another inverter" }],
        details: null,
      },
      primary: { label: "Use Waaree 3P-136K (75-136 kW)", line: "18 × 16 · 1 inverter · DC/AC ratio 1.23" },
      kw: [128.49, 151.85],
    });
  });

  test("on several inverters the remedy says how many", () => {
    const two = belowTargetOf(designWith(ROOFS(false, { n_inverters: 2, dcac: 1.11 }), BELOW));

    expect(two?.problem.remedy).toBe("2 × Waaree 3P-136K (75-136 kW) reach 1.11 on this roof.");
    expect(two?.primary?.line).toBe("18 × 16 · 2 inverters · DC/AC ratio 1.11");
  });

  test("with no inverter of the range for the roof, the power that suits it, and no primary", () => {
    expect(belowTargetOf(designWith(null, BELOW))).toMatchObject({
      problem: { remedy: "Choose an inverter of 128 to 152 kW.", actions: [{ id: "choose-inverter", label: "Choose another inverter" }] },
      primary: null,
    });
  });
});
