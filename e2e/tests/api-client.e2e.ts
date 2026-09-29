import { createApi } from "../../apps/web/lib/api/client";
import { ApiError } from "../../apps/web/lib/api/errors";
import type { DesignProgress, Project, ProjectRequest } from "../../apps/web/lib/api/types";
import { expect, test } from "../fixtures";

// The client of the web app against the real API, through the /api rewrite of the web app under test.
// No page is opened: what is tested is the client, as the pages will call it.

/** The demo on a roof of 30 x 14 m with one tank: a run takes a second or two. */
function small(demo: Project, systemVoltage: Project["system_voltage"]): ProjectRequest {
  return {
    ...demo,
    name: "Small roof",
    system_voltage: systemVoltage,
    roof: {
      ...demo.roof,
      outline: [
        [0, 0],
        [30, 0],
        [30, 14],
        [0, 14],
      ],
      obstacles: [{ name: "Tank", kind: "cylinder", x: 8, y: 7, diameter: 2, height: 2 }],
    },
  };
}

test.describe("the client of the API", () => {
  test.describe.configure({ mode: "serial" });

  test("runs a design, hears its progress and gets the options", async ({ baseURL }) => {
    const api = createApi({ base: `${baseURL}/api` });
    const heard: DesignProgress[] = [];

    const demo = await api.getDemo();
    const result = await api.runDesign(small(demo, 1500), { onProgress: (progress) => heard.push(progress) });

    expect(result.readouts.positions).toBeGreaterThan(0);
    expect(result.options.length).toBeGreaterThan(0);
    expect(result.chosen_option).toBe(result.options[0]?.key);
    expect(result.no_options).toBeNull();
    const steps = heard.map((progress) => progress.step).filter((step, n, all) => step !== all[n - 1]);
    expect(steps).toEqual([
      "Fitting modules on the roof",
      "Computing hourly shading for every module",
      "Applying the losses",
      "Sizing strings and simulating the options",
    ]);
    const fractions = heard.map((progress) => progress.fraction);
    expect(fractions).toEqual([...fractions].sort((a, b) => a - b));
    expect(fractions.at(-1)).toBe(1);
  });

  test("without a system voltage the result says what it waits for", async ({ baseURL }) => {
    const api = createApi({ base: `${baseURL}/api` });

    const result = await api.runDesign(small(await api.getDemo(), null));

    expect(result.options).toEqual([]);
    expect(result.chosen_option).toBeNull();
    expect(result.no_options).toEqual({
      code: "system_voltage_missing",
      title: "Choose a system voltage to size the strings",
      message: "600, 1000 or 1500 V. Nothing is sized until you choose.",
    });
  });

  test("a project that cannot be run is thrown as the error of the API", async ({ baseURL }) => {
    const api = createApi({ base: `${baseURL}/api` });
    const project = { ...small(await api.getDemo(), 1500), weather_json: null };

    const thrown = await api.runDesign(project).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ApiError);
    expect(thrown).toMatchObject({ status: 422, code: "weather_not_loaded", field: "weather_json" });
  });

  test("exports the hours of the chosen option as a file with its name", async ({ baseURL }) => {
    const api = createApi({ base: `${baseURL}/api` });
    const project = small(await api.getDemo(), 1500);
    const result = await api.runDesign(project);

    const file = await api.exportDesign("csv", { ...project, chosen_option: result.chosen_option ?? "" });

    expect(file.name).toBe("Small-roof-hourly.csv");
    const lines = (await file.blob.text()).trimEnd().split("\n");
    expect(lines[0]).toBe("time_utc_hour_start,ghi_w_m2,poa_eff_w_m2,t_cell_c,p_dc_kw,p_ac_kw");
    expect(lines).toHaveLength(8761);
  });
});
