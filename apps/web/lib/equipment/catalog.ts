// The catalog of the app's library of PVsyst files (D75; docs/equipment-library.md): what the equipment picker lists of
// each PAN and OND file, written by the engine's readers (`bun equipment:catalog`) and served beside the files.

export type ModuleEntry = {
  file: string;
  sha256: string;
  /** The maker as the file states it; `makerOf` gives the name people know it by. */
  maker: string;
  model: string;
  /** Where the file's numbers come from (DataSource=): "TUV SUD"; empty when the file does not say. */
  data_source: string;
  wp: number;
  efficiency_pct: number;
  length_m: number;
  width_m: number;
  /** Null for a module with one face. */
  bifaciality: number | null;
};

export type InverterEntry = {
  file: string;
  sha256: string;
  maker: string;
  model: string;
  data_source: string;
  ac_kw: number;
  mppt: number;
  vmpp_min_v: number;
  vmpp_max_v: number;
  vdc_max_v: number;
  /** Its maker calls the file preliminary. */
  preliminary: boolean;
};

export type Catalog = { modules: ModuleEntry[]; inverters: InverterEntry[] };
export type Kind = keyof Catalog;

export const CATALOG_URL = "/equipment/catalog.json";

/** Where a file of the library is served. */
export function fileUrlOf(kind: Kind, file: string): string {
  return `/equipment/${kind}/${encodeURIComponent(file)}`;
}

type Shape = Record<string, "string" | "number" | "boolean" | "number|null">;
const MODULE: Shape = {
  file: "string", sha256: "string", maker: "string", model: "string", data_source: "string",
  wp: "number", efficiency_pct: "number", length_m: "number", width_m: "number", bifaciality: "number|null",
};
const INVERTER: Shape = {
  file: "string", sha256: "string", maker: "string", model: "string", data_source: "string",
  ac_kw: "number", mppt: "number", vmpp_min_v: "number", vmpp_max_v: "number", vdc_max_v: "number", preliminary: "boolean",
};

function wrong(where: string): Error {
  return new Error(`The equipment catalog is not as expected (${where}). Write it again with \`bun equipment:catalog\`.`);
}

function entriesOf<Entry>(value: unknown, kind: Kind, shape: Shape): Entry[] {
  if (!Array.isArray(value)) throw wrong(kind);
  value.forEach((entry: unknown, index) => {
    if (typeof entry !== "object" || entry === null) throw wrong(`${kind}[${index}]`);
    for (const [key, type] of Object.entries(shape)) {
      const field = (entry as Record<string, unknown>)[key];
      const fits = type === "number|null" ? field === null || typeof field === "number" : typeof field === type;
      if (!fits) throw wrong(`${kind}[${index}].${key}`);
    }
  });
  return value as Entry[];
}

/** The catalog from what the server gave, every entry checked against its shape. */
export function catalogFrom(value: unknown): Catalog {
  if (typeof value !== "object" || value === null) throw wrong("not an object");
  const { modules, inverters } = value as Record<string, unknown>;
  return { modules: entriesOf<ModuleEntry>(modules, "modules", MODULE), inverters: entriesOf<InverterEntry>(inverters, "inverters", INVERTER) };
}

type Fetch = (url: string) => Promise<Response>;

/** A loader of the catalog that fetches it once for all who ask; a fetch that failed is tried again on the next ask. */
export function loaderOf(fetcher: Fetch): () => Promise<Catalog> {
  let pending: Promise<Catalog> | null = null;
  return () => {
    pending ??= fetcher(CATALOG_URL)
      .then(async (response) => {
        if (!response.ok) throw new Error(`The equipment library did not load. Details: HTTP ${response.status}`);
        return catalogFrom(await response.json());
      })
      .catch((error: unknown) => {
        pending = null;
        throw error;
      });
    return pending;
  };
}
