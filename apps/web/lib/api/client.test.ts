import { describe, expect, test } from "bun:test";
import { createApi } from "./client";
import { ApiError } from "./errors";
import type { DesignProgress, DesignResult, Project } from "./types";

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };

/** Stands in for fetch: answers what the test gives it, and keeps what was asked. */
function server(answer: (call: Call) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    init?.signal?.throwIfAborted();
    const call: Call = {
      url: String(input),
      method: init?.method ?? "GET",
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);
    return answer(call);
  };
  return { calls, api: createApi({ fetch: fetcher }) };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function events(...items: { event: string; data: unknown }[]): Response {
  const text = items.map((item) => `event: ${item.event}\ndata: ${JSON.stringify(item.data)}\n\n`).join("");
  return new Response(text, { status: 200, headers: { "content-type": "text/event-stream; charset=utf-8" } });
}

const PROJECT = { roof: { outline: [[0, 0], [30, 0], [30, 14]], lat: 18.52, lon: 73.86 } } as unknown as Project;
const RESULT = { options: [], chosen_option: null } as unknown as DesignResult;
const REFUSED = { error: { code: "weather_not_loaded", message: "Load the weather first.", field: "weather_json" } };

describe("the calls that answer with JSON", () => {
  test("health and demo are read from under /api", async () => {
    const { api, calls } = server((call) => json(call.url.endsWith("/health") ? { status: "ok", version: "0.1.0", commit: null } : PROJECT));

    expect(await api.getHealth()).toEqual({ status: "ok", version: "0.1.0", commit: null });
    expect(await api.getDemo()).toEqual(PROJECT);
    expect(calls.map((call) => [call.method, call.url])).toEqual([
      ["GET", "/api/health"],
      ["GET", "/api/demo"],
    ]);
  });

  test.each([
    ["parseModule", "/api/equipment/module", { name: "a.PAN", text: "x" }],
    ["parseInverter", "/api/equipment/inverter", { name: "a.OND", text: "x" }],
    ["importRoof", "/api/roof/import", { name: "roof.kmz", base64: "AAAA" }],
    ["roofFromMap", "/api/roof/from-map", { outline: [[73.86, 18.52], [73.861, 18.52], [73.861, 18.521]], roof_type: "flat_tilted" }],
    ["roofOnMap", "/api/roof/on-map", PROJECT.roof],
    ["computeLayout", "/api/layout", PROJECT],
    ["computeSun", "/api/sun", { lat: 18.52, lon: 73.86, doy: 355 }],
    ["loadWeather", "/api/weather", { source: "pvgis", lat: 18.52, lon: 73.86 }],
    ["openProject", "/api/project/open", { name: "Pune-demo-roof.rtd", text: '{"format": 2}' }],
  ] as const)("%s posts its request as JSON to %s and hands out the answer", async (name, url, request) => {
    const { api, calls } = server(() => json({ answered: name }));

    const answer = await (api[name] as (body: unknown) => Promise<unknown>)(request);

    expect(answer).toEqual({ answered: name });
    expect(calls).toEqual([
      { url, method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: request },
    ]);
  });

  test("a request that is refused is thrown as the error of the API", async () => {
    const { api } = server(() => json(REFUSED, 422));

    const thrown = await api.computeLayout(PROJECT).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ApiError);
    expect(thrown).toMatchObject({ status: 422, code: "weather_not_loaded", field: "weather_json" });
  });

  test("an API that cannot be reached is told as such", async () => {
    const { api } = server(() => {
      throw new TypeError("fetch failed");
    });

    const thrown = await api.getHealth().catch((error: unknown) => error);

    expect(thrown).toMatchObject({ code: "api_unreachable", status: null });
  });

  test("a request that was given up is thrown as it is, not as a fault of the API", async () => {
    const { api, calls } = server(() => json({}));
    const controller = new AbortController();
    controller.abort();

    const thrown = await api.computeLayout(PROJECT, { signal: controller.signal }).catch((error: unknown) => error);

    expect(thrown).not.toBeInstanceOf(ApiError);
    expect((thrown as Error).name).toBe("AbortError");
    expect(calls).toEqual([]);
  });

  test("another place for the API can be given", async () => {
    const calls: string[] = [];
    const api = createApi({
      base: "http://127.0.0.1:4711",
      fetch: async (input) => {
        calls.push(String(input));
        return json({ status: "ok", version: "0.1.0", commit: null });
      },
    });

    await api.getHealth();

    expect(calls).toEqual(["http://127.0.0.1:4711/health"]);
  });
});

describe("runDesign", () => {
  const FITTING: DesignProgress = { type: "progress", step: "Fitting modules on the roof", fraction: 0 };
  const SHADING: DesignProgress = { type: "progress", step: "Computing hourly shading for every module", fraction: 0.01 };

  test("tells the progress on the way and hands out the result", async () => {
    const { api, calls } = server(() =>
      events(
        { event: "progress", data: FITTING },
        { event: "progress", data: SHADING },
        { event: "result", data: { type: "result", result: RESULT } },
      ),
    );
    const heard: DesignProgress[] = [];

    const result = await api.runDesign(PROJECT, { onProgress: (progress) => heard.push(progress) });

    expect(result).toEqual(RESULT);
    expect(heard).toEqual([FITTING, SHADING]);
    expect(calls).toEqual([
      {
        url: "/api/design",
        method: "POST",
        headers: { accept: "text/event-stream", "content-type": "application/json" },
        body: PROJECT,
      },
    ]);
  });

  test("runs without a listener", async () => {
    const { api } = server(() => events({ event: "progress", data: FITTING }, { event: "result", data: { type: "result", result: RESULT } }));

    expect(await api.runDesign(PROJECT)).toEqual(RESULT);
  });

  test("a project that is refused before the run is thrown as the error of the API", async () => {
    const { api } = server(() => json(REFUSED, 422));

    const thrown = await api.runDesign(PROJECT).catch((error: unknown) => error);

    expect(thrown).toMatchObject({ status: 422, code: "weather_not_loaded", field: "weather_json" });
  });

  test("a fault in the run is thrown with what was told before it", async () => {
    const failed = { type: "error", error: { code: "internal_error", message: "The server could not finish.", field: null } };
    const { api } = server(() => events({ event: "progress", data: FITTING }, { event: "error", data: failed }));
    const heard: DesignProgress[] = [];

    const thrown = await api.runDesign(PROJECT, { onProgress: (progress) => heard.push(progress) }).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ApiError);
    expect(thrown).toMatchObject({ status: 200, code: "internal_error", message: "The server could not finish." });
    expect(heard).toEqual([FITTING]);
  });

  test("a stream that ends without a result is a fault", async () => {
    const { api } = server(() => events({ event: "progress", data: FITTING }));

    const thrown = await api.runDesign(PROJECT).catch((error: unknown) => error);

    expect(thrown).toMatchObject({
      code: "run_cut_short",
      message: "The design run ended before its result arrived. Run it again.",
    });
  });

  test.each([
    ["an answer that is no stream", () => json({ ok: true })],
    ["an event that is no JSON", () => new Response("event: result\ndata: {half\n\n", { headers: { "content-type": "text/event-stream" } })],
    ["an event of a kind it does not know", () => events({ event: "result", data: { type: "surprise" } })],
  ])("%s is told as an answer that cannot be read", async (_, answer) => {
    const { api } = server(answer);

    const thrown = await api.runDesign(PROJECT).catch((error: unknown) => error);

    expect(thrown).toMatchObject({ code: "unexpected_answer", field: null });
  });
});

describe("exportDesign", () => {
  test("hands out the file with its name and its type", async () => {
    const { api, calls } = server(
      () =>
        new Response("%PDF-1.4", {
          headers: { "content-type": "application/pdf", "content-disposition": 'attachment; filename="Pune-demo-report.pdf"' },
        }),
    );

    const file = await api.exportDesign("pdf", PROJECT);

    expect(file.name).toBe("Pune-demo-report.pdf");
    expect(file.blob.type).toBe("application/pdf");
    expect(await file.blob.text()).toBe("%PDF-1.4");
    expect(calls.map((call) => [call.method, call.url, call.body])).toEqual([["POST", "/api/export/pdf", PROJECT]]);
  });

  test.each([
    ["pdf", "rooftop-design-report.pdf"],
    ["dxf", "rooftop-design-layout.dxf"],
    ["kmz", "rooftop-design.kmz"],
    ["csv", "rooftop-design-hourly.csv"],
    ["sld", "rooftop-design-single-line-diagram.png"],
    ["rtd", "rooftop-design.rtd"],
    ["zip", "rooftop-design.zip"],
  ] as const)("a %s without a name in the answer is called %s", async (kind, name) => {
    const { api } = server(() => new Response("x"));

    expect((await api.exportDesign(kind, PROJECT)).name).toBe(name);
  });

  test("the reader's day goes with the request, as the query parameter day (plan/phase-09-plan.md, decision 2)", async () => {
    const { api, calls } = server(() => new Response("%PDF-1.4"));

    await api.exportDesign("pdf", PROJECT, { day: "2026-10-03" });
    await api.exportDesign("rtd", PROJECT);

    expect(calls.map((call) => call.url)).toEqual(["/api/export/pdf?day=2026-10-03", "/api/export/rtd"]);
  });

  test("an export that is refused is thrown as the error of the API", async () => {
    const refused = { error: { code: "no_option_chosen", message: "Choose a stringing option first.", field: "chosen_option" } };
    const { api } = server(() => json(refused, 422));

    const thrown = await api.exportDesign("csv", PROJECT).catch((error: unknown) => error);

    expect(thrown).toMatchObject({ status: 422, code: "no_option_chosen", field: "chosen_option" });
  });
});

describe("reportPages (plan/phase-09-plan.md, decision 5)", () => {
  const PAGES = { day: "2026-10-03", dpi: 150, pages: [{ number: 1, title: "Summary", width: 1753, height: 1240, png: "iVBORw0KGgo=" }] };

  test("posts the project as JSON to /export/report-pages with the reader's day, and hands out the pages", async () => {
    const { api, calls } = server(() => json(PAGES));

    const answer = await api.reportPages(PROJECT, { day: "2026-10-03" });

    expect(answer).toEqual(PAGES);
    expect(calls.map((call) => [call.method, call.url, call.body])).toEqual([["POST", "/api/export/report-pages?day=2026-10-03", PROJECT]]);
    expect(calls[0]!.headers["content-type"]).toBe("application/json");
  });

  test("without a day the API prints its own today: no query", async () => {
    const { api, calls } = server(() => json(PAGES));

    await api.reportPages(PROJECT);

    expect(calls.map((call) => call.url)).toEqual(["/api/export/report-pages"]);
  });

  test("the pages refused are thrown as the error of the API, as the PDF's are", async () => {
    const refused = { error: { code: "system_voltage_missing", message: "Choose a system voltage to size the strings", field: "system_voltage" } };
    const { api } = server(() => json(refused, 422));

    const thrown = await api.reportPages(PROJECT, { day: "2026-10-03" }).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ApiError);
    expect(thrown).toMatchObject({ status: 422, code: "system_voltage_missing", field: "system_voltage" });
  });
});

describe("an answer that is not the API's, once (a proxy in front of it failed)", () => {
  const PROXY_FAILED = () => new Response("Internal Server Error", { status: 500, headers: { "content-type": "text/plain" } });

  test("an export is asked once more and comes", async () => {
    let answered = 0;
    const { api, calls } = server(() => {
      answered += 1;
      return answered === 1 ? PROXY_FAILED() : new Response("%PDF-1.4", { headers: { "content-type": "application/pdf" } });
    });

    const file = await api.exportDesign("pdf", PROJECT);

    expect(await file.blob.text()).toBe("%PDF-1.4");
    expect(calls).toHaveLength(2);
  });

  test("the pages of the report the same; three times is the failure", async () => {
    const { api, calls } = server(PROXY_FAILED);

    const thrown = await api.reportPages(PROJECT).catch((error: unknown) => error);

    expect(thrown).toMatchObject({ code: "unexpected_answer" });
    expect(calls).toHaveLength(3);
  });

  test("a refusal of the API is not asked again", async () => {
    const { api, calls } = server(() => json({ error: { code: "no_option_chosen", message: "Choose a stringing option first.", field: "chosen_option" } }, 422));

    const thrown = await api.exportDesign("pdf", PROJECT).catch((error: unknown) => error);

    expect(thrown).toMatchObject({ code: "no_option_chosen" });
    expect(calls).toHaveLength(1);
  });
});
