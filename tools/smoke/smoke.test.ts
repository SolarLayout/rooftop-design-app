import { describe, expect, test } from "bun:test";

import { type Fetch, smoke } from "./smoke";

// The smoke against a deployed environment, run here against a fake of the site: tests never touch the network.

const BASE = "https://rooftop.staging.solarlayout.app";
const DEMO = { name: "Demo", system_voltage: 1500, chosen_option: "" };
const RESULT = { options: [{ key: "29x22x1" }, { key: "26x24x1" }] };

type Site = Record<string, (init?: RequestInit) => Response>;

function stream(events: Array<[string, unknown]>, comments = false): Response {
  const text = events.map(([name, data]) => `${comments ? ": ping\n\n" : ""}event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join("");
  return new Response(text, { headers: { "content-type": "text/event-stream; charset=utf-8" } });
}

const json = (body: unknown, status = 200) => Response.json(body, { status });

function healthySite(): Site {
  return {
    "GET /": () => new Response("<!doctype html><title>SolarLayout Rooftop</title>", { headers: { "content-type": "text/html" } }),
    "GET /api/health": () => json({ status: "ok", version: "0.1.0", commit: "8a4b246" }),
    "GET /api/demo": () => json(DEMO),
    "POST /api/design": () => stream([["progress", { step: "Fitting", fraction: 0 }], ["result", { result: RESULT }]], true),
    "POST /api/export/report-pages": () => json({ pages: ["a", "b"] }),
  };
}

function fake(site: Site, asked: Array<{ key: string; body: unknown }> = []): Fetch {
  return async (url, init) => {
    const key = `${init?.method ?? "GET"} ${new URL(String(url)).pathname}`;
    asked.push({ key, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const answer = site[key];
    return answer ? answer(init) : new Response("not found", { status: 404 });
  };
}

describe("the smoke of a deployed site", () => {
  test("a healthy site passes every step, in order", async () => {
    const checks = await smoke(BASE, { fetch: fake(healthySite()), commit: "8a4b246" });

    expect(checks.map((check) => [check.name, check.ok])).toEqual([
      ["the page", true],
      ["the API's health", true],
      ["the demo", true],
      ["the design run, streamed", true],
      ["the report's pages", true],
    ]);
  });

  test("the report is asked for the first option the run found", async () => {
    const asked: Array<{ key: string; body: unknown }> = [];
    await smoke(BASE, { fetch: fake(healthySite(), asked) });

    const report = asked.find((call) => call.key === "POST /api/export/report-pages");
    expect(report?.body).toEqual({ ...DEMO, chosen_option: "29x22x1" });
  });

  test("an API built from another commit than the one deployed fails, and says both", async () => {
    const checks = await smoke(BASE, { fetch: fake(healthySite()), commit: "f64a62b" });

    const health = checks.find((check) => check.name === "the API's health");
    expect(health?.ok).toBe(false);
    expect(health?.detail).toBe('the API was built from 8a4b246, not f64a62b');
  });

  test("a run whose stream ends without a result fails, and names the last event", async () => {
    const site = healthySite();
    site["POST /api/design"] = () => stream([["progress", { step: "Computing hourly shading for every module", fraction: 0.1 }]]);

    const checks = await smoke(BASE, { fetch: fake(site) });

    const design = checks.find((check) => check.name === "the design run, streamed");
    expect(design?.ok).toBe(false);
    expect(design?.detail).toBe('the stream ended after "progress", without a result');
  });

  test("a run that reports an error fails with the engine's words", async () => {
    const site = healthySite();
    site["POST /api/design"] = () => stream([["error", { message: "The weather could not be loaded." }]]);

    const design = (await smoke(BASE, { fetch: fake(site) })).find((check) => check.name === "the design run, streamed");
    expect(design?.detail).toBe('the run failed: {"message":"The weather could not be loaded."}');
  });

  test("an answer that is not the one expected fails with its status, and the steps that need it are not run", async () => {
    const site = healthySite();
    site["GET /api/demo"] = () => new Response("Bad gateway", { status: 502 });

    const checks = await smoke(BASE, { fetch: fake(site) });

    expect(checks.map((check) => [check.name, check.ok, check.detail])).toEqual([
      ["the page", true, expect.any(String)],
      ["the API's health", true, expect.any(String)],
      ["the demo", false, "502: Bad gateway"],
      ["the design run, streamed", false, "not run: the demo did not come"],
      ["the report's pages", false, "not run: the demo did not come"],
    ]);
  });

  test("a step that cannot reach the site at all fails with the reason", async () => {
    const failing: Fetch = async () => {
      throw new TypeError("fetch failed");
    };

    const checks = await smoke(BASE, { fetch: failing });

    expect(checks[0]).toMatchObject({ name: "the page", ok: false, detail: "fetch failed" });
  });
});
