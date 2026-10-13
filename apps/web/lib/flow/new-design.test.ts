import { describe, expect, test } from "bun:test";
import type { Project } from "../api";
import { asANewDesign } from "./new-design";

describe("a new design (D118)", () => {
  test("built on Find or from a drawing, it has its inverter set by the app", () => {
    const built = { ond_text: "", ond_path: "" } as Project;

    expect(asANewDesign(built)).toEqual({ ...built, inverter_by: "app" });
  });

  test("a document with an inverter file of its own, or that says who set it, is left as it is", () => {
    const withAFile = { ond_text: "PVObject_=pvGInverter", ond_path: "Fronius_Tauro.OND" } as Project;
    const theUsers = { ond_text: "", ond_path: "", inverter_by: "user" } as Project;

    expect(asANewDesign(withAFile)).toBe(withAFile);
    expect(asANewDesign(theUsers)).toBe(theUsers);
  });
});
