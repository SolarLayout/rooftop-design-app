// The API as functions. The browser reaches it under /api, which Next forwards (next.config.ts).
// Every function throws ApiError when the API refuses, fails or cannot be reached, and the error of
// the signal itself when the caller gave the request up.
import { fileNameOf } from "./download";
import { ApiError, detailOf, errorOf } from "./errors";
import { readEvents } from "./events";
import type {
  DesignEvent,
  DesignProgress,
  DesignResult,
  EquipmentFile,
  ExportKind,
  Health,
  ImportedRoof,
  InverterResponse,
  LayoutResponse,
  ModuleResponse,
  OutlineOnMap,
  Project,
  ProjectRequest,
  ReportPages,
  RoofFile,
  RoofOnMap,
  RoofRequest,
  SunRequest,
  SunResponse,
  WeatherRequest,
  WeatherResponse,
} from "./types";

export type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export type ApiOptions = { base?: string; fetch?: Fetch };
export type CallOptions = { signal?: AbortSignal };
export type RunOptions = CallOptions & { onProgress?: (progress: DesignProgress) => void };
/** The day of the reader, YYYY-MM-DD: the report prints it (plan/phase-09-plan.md, decision 2). Without it the API prints its own today. */
export type ExportOptions = CallOptions & { day?: string };
export type ExportedFile = { name: string; blob: Blob };
export type Api = ReturnType<typeof createApi>;

const JSON_TYPE = "application/json";
const EVENT_STREAM = "text/event-stream";
const RUN_CUT_SHORT = "The design run ended before its result arrived. Run it again.";
const FILE_NAMES: Record<ExportKind, string> = {
  pdf: "rooftop-design-report.pdf",
  dxf: "rooftop-design-layout.dxf",
  kmz: "rooftop-design.kmz",
  csv: "rooftop-design-hourly.csv",
  sld: "rooftop-design-single-line-diagram.png",
  rtd: "rooftop-design.rtd",
  zip: "rooftop-design.zip",
};

export function createApi({ base = "/api", fetch: fetcher = globalThis.fetch }: ApiOptions = {}) {
  async function ask(path: string, accept: string, body: unknown, signal?: AbortSignal): Promise<Response> {
    const init: RequestInit =
      body === undefined
        ? { method: "GET", headers: { accept }, signal, cache: "no-store" }
        : { method: "POST", headers: { accept, "content-type": JSON_TYPE }, body: JSON.stringify(body), signal };
    let response: Response;
    try {
      response = await fetcher(`${base}${path}`, init);
    } catch (cause) {
      if (signal?.aborted) throw cause;
      throw ApiError.unreachable(cause);
    }
    if (!response.ok) throw await errorOf(response);
    return response;
  }

  async function json<Answer>(path: string, body?: unknown, options: CallOptions = {}): Promise<Answer> {
    const response = await ask(path, JSON_TYPE, body, options.signal);
    try {
      return (await response.json()) as Answer;
    } catch (cause) {
      if (options.signal?.aborted) throw cause;
      throw ApiError.unexpected(response.status, cause);
    }
  }

  /** The query of a file or of the pages: the reader's day, when given. */
  const dayQuery = (day: string | undefined) => (day === undefined ? "" : `?${new URLSearchParams({ day })}`);

  /**
   * A call made once more when the answer was not the API's: a proxy in front of it (the web app's rewrite) has failed a
   * request now and then with a bare "Internal Server Error" while the API had answered 200. Only for a call that can be
   * made twice without harm: the exports.
   */
  async function onceMore<Answer>(call: () => Promise<Answer>): Promise<Answer> {
    try {
      return await call();
    } catch (error) {
      if (error instanceof ApiError && error.code === "unexpected_answer") return call();
      throw error;
    }
  }

  return {
    getHealth: (options?: CallOptions) => json<Health>("/health", undefined, options),
    getDemo: (options?: CallOptions) => json<Project>("/demo", undefined, options),
    parseModule: (file: EquipmentFile, options?: CallOptions) => json<ModuleResponse>("/equipment/module", file, options),
    parseInverter: (file: EquipmentFile, options?: CallOptions) =>
      json<InverterResponse>("/equipment/inverter", file, options),
    importRoof: (file: RoofFile, options?: CallOptions) => json<ImportedRoof>("/roof/import", file, options),
    /** A new design from a roof outlined on the map, in local metres through the projection of the API. */
    roofFromMap: (drawn: OutlineOnMap, options?: CallOptions) => json<Project>("/roof/from-map", drawn, options),
    /** Where a roof and its obstacles are on the map. */
    roofOnMap: (roof: RoofRequest, options?: CallOptions) => json<RoofOnMap>("/roof/on-map", roof, options),
    computeLayout: (project: ProjectRequest, options?: CallOptions) => json<LayoutResponse>("/layout", project, options),
    computeSun: (request: SunRequest, options?: CallOptions) => json<SunResponse>("/sun", request, options),
    loadWeather: (request: WeatherRequest, options?: CallOptions) => json<WeatherResponse>("/weather", request, options),

    /** Runs the whole design. *onProgress* hears every step on the way; the result is what comes back. */
    async runDesign(project: ProjectRequest, { signal, onProgress }: RunOptions = {}): Promise<DesignResult> {
      const response = await ask("/design", EVENT_STREAM, project, signal);
      const isStream = response.headers.get("content-type")?.startsWith(EVENT_STREAM) ?? false;
      if (!isStream || !response.body) throw ApiError.unexpected(response.status);
      for await (const { data } of readEvents(response.body)) {
        const event = designEvent(data, response.status);
        if (event.type === "result") return event.result;
        if (event.type === "error") throw ApiError.of(response.status, event.error);
        onProgress?.(event);
      }
      throw new ApiError(response.status, "run_cut_short", RUN_CUT_SHORT, null);
    },

    /** A file of the design, for the option the project has chosen; the project file needs none. */
    async exportDesign(kind: ExportKind, project: ProjectRequest, { day, signal }: ExportOptions = {}): Promise<ExportedFile> {
      const response = await onceMore(() => ask(`/export/${kind}${dayQuery(day)}`, "*/*", project, signal));
      const name = fileNameOf(response.headers.get("content-disposition"), FILE_NAMES[kind]);
      return { name, blob: await response.blob() };
    },

    /**
     * The pages of the report as images, each with its title and size, as the PDF of the same day prints them
     * (plan/phase-09-plan.md, decision 5). Needs the chosen option, as the PDF does.
     */
    reportPages: (project: ProjectRequest, { day, signal }: ExportOptions = {}) =>
      onceMore(() => json<ReportPages>(`/export/report-pages${dayQuery(day)}`, project, { signal })),
  };
}

/** One event of a design run, read from its data. */
function designEvent(data: string, status: number): DesignEvent {
  let value: unknown;
  try {
    value = JSON.parse(data);
  } catch (cause) {
    throw ApiError.unexpected(status, cause);
  }
  if (isRecord(value)) {
    if (value.type === "progress" && typeof value.step === "string" && typeof value.fraction === "number") {
      return { type: "progress", step: value.step, fraction: value.fraction };
    }
    if (value.type === "result" && isRecord(value.result)) {
      return { type: "result", result: value.result as DesignResult };
    }
    const detail = value.type === "error" ? detailOf(value) : null;
    if (detail) return { type: "error", error: detail };
  }
  throw ApiError.unexpected(status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** The API of the app this page came from. */
export const api: Api = createApi();
