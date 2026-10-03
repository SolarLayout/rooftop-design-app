import { describe, expect, test } from "bun:test";
import type { DownloadsState } from "../handover/downloads-store";
import { shouldWarnBeforeLeaving } from "./leaving";

// The warning before leaving (plan/phase-10-plan.md, step 6): the browser asks before the page is left while a file of
// Handover is on its way, since the download would be lost; at rest, or after a failure, it asks nothing.

const downloads = (parts: Partial<Pick<DownloadsState, "byItem" | "all" | "pagesStatus">>): DownloadsState =>
  ({ byItem: {}, all: { status: "idle" }, pagesStatus: { status: "idle" }, ...parts }) as DownloadsState;

describe("whether to warn before leaving", () => {
  test("nothing on its way: no", () => {
    expect(shouldWarnBeforeLeaving(downloads({}))).toBe(false);
    expect(shouldWarnBeforeLeaving(downloads({ byItem: { report: { status: "idle" }, "cad-layout": { status: "failed", message: "Refused." } } }))).toBe(false);
  });

  test("a file of an item on its way: yes", () => {
    expect(shouldWarnBeforeLeaving(downloads({ byItem: { report: { status: "idle" }, "hourly-data": { status: "on-its-way" } } }))).toBe(true);
  });

  test("Download all on its way: yes", () => {
    expect(shouldWarnBeforeLeaving(downloads({ all: { status: "on-its-way" } }))).toBe(true);
  });

  test("the pages of the report on their way are a preview, not a download: no", () => {
    expect(shouldWarnBeforeLeaving(downloads({ pagesStatus: { status: "on-its-way" } }))).toBe(false);
  });
});
