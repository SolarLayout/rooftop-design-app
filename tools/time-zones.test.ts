import { describe, expect, test } from "bun:test";
import { timeZoneTable } from "./time-zones";

const ZONE_TAB = [
  "# tzdb timezone descriptions",
  "IN\t+2232+08822\tAsia/Kolkata",
  "US\t+404251-0740023\tAmerica/New_York\tEastern (most areas)",
  "",
].join("\n");

describe("the table of time zones", () => {
  test("names each zone's country, under its own name and the browser's, sorted", () => {
    const browserNames: Record<string, string> = { "Asia/Kolkata": "Asia/Calcutta" };

    const table = timeZoneTable(ZONE_TAB, (zone) => browserNames[zone] ?? zone);

    expect(table).toEqual([
      ["America/New_York", "US"],
      ["Asia/Calcutta", "IN"],
      ["Asia/Kolkata", "IN"],
    ]);
  });

  test("refuses a line it cannot read, naming it", () => {
    expect(() => timeZoneTable("IN only", (zone) => zone)).toThrow('zone.tab has a line without a country and a zone: "IN only"');
  });
});
