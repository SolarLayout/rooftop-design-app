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

    /** A file of the design, for the option the project has chosen. */
    async exportDesign(kind: ExportKind, project: ProjectRequest, options: CallOptions = {}): Promise<ExportedFile> {
      const response = await ask(`/export/${kind}`, "*/*", project, options.signal);
      const name = fileNameOf(response.headers.get("content-disposition"), FILE_NAMES[kind]);
      return { name, blob: await response.blob() };
    },
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
