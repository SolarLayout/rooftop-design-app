import { describe, expect, test } from "bun:test";
import type { Project } from "../api";
import { projectFileViewOf } from "./project-file";
import { BEFORE_A_VOLTAGE, DEMO, DOCUMENT } from "./test-fixtures";

// The project file's preview (the board "Handover, previews", last part; plan/phase-09-plan.md, decision 9): the file's
// name as the API writes it, its size, its format, and what is embedded, from the document and the run.
const AT_REST = { document: DOCUMENT, design: DEMO, bytes: 696496, draft: null } as const;

describe("the demo at 1500 V", () => {
  test("the name, the size in KB of 1,024, the format, what is in it", () => {
    const view = projectFileViewOf(AT_REST);

    expect(view.fileName).toBe("Pune-demo-roof.rtd");
    expect(view.size).toBe("680 KB");
    expect(view.format).toBe("Format version 2");
    expect(view.contents).toEqual([
      { label: "Module file", value: "insolation-ina-144mhc-tf-560.PAN", isFileName: true },
      { label: "Inverter file", value: "wattpower-wp-330ktl-h1.OND", isFileName: true },
      { label: "Weather", value: "Typical year · 8,760 hours", isFileName: false },
      { label: "System voltage", value: "1500 V", isFileName: false },
      { label: "Chosen option", value: "A · 29 × 22 on 1 inverter", isFileName: false },
    ]);
  });

  test("a large file has a thousands separator", () => {
    expect(projectFileViewOf({ ...AT_REST, bytes: 1_234_567 }).size).toBe("1,206 KB");
  });

  test("the file's name follows the name as it is typed, as the API will write it", () => {
    expect(projectFileViewOf({ ...AT_REST, draft: "Pune demo roof, block B" }).fileName).toBe("Pune-demo-roof,-block-B.rtd");
    expect(projectFileViewOf({ ...AT_REST, draft: "   " }).fileName).toBe("Pune-demo-roof.rtd");
  });

  test("two inverters", () => {
    const view = projectFileViewOf({ ...AT_REST, design: { ...DEMO, chosen_option: "26x27x2" } });

    expect(view.contents[4]!.value).toBe("D · 26 × 27 on 2 inverters");
  });

  test("the app's sample where the document names no file", () => {
    const view = projectFileViewOf({ ...AT_REST, document: { ...DOCUMENT, pan_path: "", ond_path: "" } as Project });

    expect(view.contents[0]).toEqual({ label: "Module file", value: "The app's sample", isFileName: false });
    expect(view.contents[1]).toEqual({ label: "Inverter file", value: "The app's sample", isFileName: false });
  });
});

describe("before a voltage", () => {
  test("the API's title stands for the voltage, and there is no option yet", () => {
    const view = projectFileViewOf({ ...AT_REST, document: { ...DOCUMENT, system_voltage: null } as Project, design: BEFORE_A_VOLTAGE });

    expect(view.contents[3]!.value).toBe("Choose a system voltage to size the strings");
    expect(view.contents[4]!.value).toBe("None yet");
  });
});

describe("what is not there yet", () => {
  test("the size while the file has not come", () => {
    expect(projectFileViewOf({ ...AT_REST, bytes: null }).size).toBeNull();
  });

  test("before a run: the files of the document stand, what the run says is null", () => {
    const view = projectFileViewOf({ ...AT_REST, design: null });

    expect(view.contents.map((row) => row.value)).toEqual(["insolation-ina-144mhc-tf-560.PAN", "wattpower-wp-330ktl-h1.OND", null, "1500 V", null]);
  });
});
