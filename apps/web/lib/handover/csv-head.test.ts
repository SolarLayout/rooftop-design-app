import { describe, expect, test } from "bun:test";
import { csvHeadOf, hourlyFailedOf, SHOWN_ROWS } from "./csv-head";

// The hourly data's preview (plan/phase-09-plan.md, step 20, decision 8; the board "Handover, previews"): the header and the
// first rows of the CSV as the file holds them, parsed from its first lines; the caption counts the rows of the whole file.

/** The demo's CSV as the engine writes it (export_csv_bytes): a header line, 8,760 hours, "\n" after each line. */
const HEAD = [
  "time_utc_hour_start,ghi_w_m2,poa_eff_w_m2,t_cell_c,p_dc_kw,p_ac_kw",
  "2019-01-01 00:00:00+00:00,0.0,0.0,19.96,0.0,-0.005",
  "2019-01-01 01:00:00+00:00,0.0,0.0,20.7,0.0,-0.005",
  "2019-01-01 02:00:00+00:00,138.55,332.973,29.521,78.296,76.881",
  "2019-01-01 03:00:00+00:00,353.2,555.32,35.663,186.308,182.107",
  "2019-01-01 04:00:00+00:00,550.4,758.813,41.348,256.188,249.583",
  "2019-01-01 05:00:00+00:00,698.85,892.624,45.339,298.205,270.889",
  "2019-01-01 06:00:00+00:00,784.0,956.222,47.624,317.455,270.889",
  "2019-01-01 07:00:00+00:00,793.35,933.882,47.821,310.069,270.889",
];
const hour = (index: number) => `2019-01-01 ${String(index % 24).padStart(2, "0")}:00:00+00:00,1.0,2.0,3.0,4.0,5.0`;
const DEMO = [...HEAD, ...Array.from({ length: 8760 - 8 }, (_, index) => hour(index + 8))].join("\n") + "\n";

describe("the demo's CSV", () => {
  test("the header's six columns, the first eight rows cell for cell as the file holds them, the count of the file's rows", () => {
    const head = csvHeadOf(DEMO);

    expect(SHOWN_ROWS).toBe(8);
    expect(head.header).toEqual(["time_utc_hour_start", "ghi_w_m2", "poa_eff_w_m2", "t_cell_c", "p_dc_kw", "p_ac_kw"]);
    expect(head.rows).toEqual(HEAD.slice(1).map((line) => line.split(",")));
    expect(head.rows[0]).toEqual(["2019-01-01 00:00:00+00:00", "0.0", "0.0", "19.96", "0.0", "-0.005"]);
    expect(head.count).toBe(8760);
    expect(head.caption).toBe("The first 8 of 8,760 rows");
  });

  test("the header is not a row: a file with a header alone has no rows", () => {
    const head = csvHeadOf(HEAD[0]! + "\n");

    expect(head.header).toHaveLength(6);
    expect(head.rows).toEqual([]);
    expect(head.count).toBe(0);
    expect(head.caption).toBe("The first 0 of 0 rows");
  });
});

describe("files of other shapes", () => {
  test("fewer rows than are shown: all of them, and the caption counts them", () => {
    const head = csvHeadOf(HEAD.slice(0, 4).join("\n") + "\n");

    expect(head.rows).toHaveLength(3);
    expect(head.caption).toBe("The first 3 of 3 rows");
  });

  test("without the newline at the end, and with Windows line ends, the same", () => {
    expect(csvHeadOf(HEAD.join("\n"))).toEqual(csvHeadOf(HEAD.join("\r\n") + "\r\n"));
    expect(csvHeadOf(HEAD.join("\n")).count).toBe(8);
  });

  test("an empty file: nothing, said as nothing", () => {
    expect(csvHeadOf("")).toEqual({ header: [], rows: [], count: 0, caption: "The first 0 of 0 rows" });
  });
});

describe("the CSV that did not come", () => {
  test("what did not happen, the API's words, Try again", () => {
    expect(hourlyFailedOf("Choose a stringing option first.")).toEqual({
      title: "The hourly data was not made",
      detail: "There is no preview yet",
      action: "Try again",
      message: "Choose a stringing option first.",
    });
  });
});
