import { describe, expect, test } from "bun:test";
import { catalogFrom, CATALOG_URL, fileUrlOf, loaderOf, type Catalog } from "./catalog";

const MODULE = {
  file: "Heliene_144HC-560.PAN", sha256: "a", maker: "Heliene Inc", model: "144HC-560", data_source: "Manufacturer",
  wp: 560, efficiency_pct: 21.67, length_m: 2.279, width_m: 1.134, bifaciality: 0.8,
};
const INVERTER = {
  file: "Solis_S5-GC125K-HV.OND", sha256: "b", maker: "Ginlong Technologies", model: "S5-GC125K-HV", data_source: "",
  ac_kw: 125, mppt: 10, vmpp_min_v: 180, vmpp_max_v: 1000, vdc_max_v: 1100, preliminary: false,
};
const CATALOG: Catalog = { modules: [MODULE], inverters: [INVERTER] };

describe("the catalog of the library", () => {
  test("is read from what the server gives", () => {
    expect(catalogFrom({ modules: [MODULE], inverters: [INVERTER] })).toEqual(CATALOG);
  });

  test("anything else is refused, saying what is wrong", () => {
    expect(() => catalogFrom({ modules: [] })).toThrow("The equipment catalog is not as expected");
    expect(() => catalogFrom({ modules: [{ ...MODULE, wp: "560" }], inverters: [] })).toThrow("modules[0]");
    expect(() => catalogFrom(null)).toThrow("not as expected");
  });

  test("a file of the library is served beside the catalog", () => {
    expect(CATALOG_URL).toBe("/equipment/catalog.json");
    expect(fileUrlOf("modules", "Heliene_144HC-560.PAN")).toBe("/equipment/modules/Heliene_144HC-560.PAN");
    expect(fileUrlOf("inverters", "A B.OND")).toBe("/equipment/inverters/A%20B.OND");
  });
});

describe("the catalog is fetched once", () => {
  test("by every one that asks, the first answer kept", async () => {
    let asked = 0;
    const load = loaderOf(async (url) => {
      asked += 1;
      expect(url).toBe(CATALOG_URL);
      return new Response(JSON.stringify(CATALOG));
    });

    const [first, second] = await Promise.all([load(), load()]);

    expect(first).toEqual(CATALOG);
    expect(second).toBe(first);
    expect(asked).toBe(1);
  });

  test("a failed fetch says so and is tried again on the next ask", async () => {
    let asked = 0;
    const load = loaderOf(async () => {
      asked += 1;
      return asked === 1 ? new Response("gone", { status: 404 }) : new Response(JSON.stringify(CATALOG));
    });

    await expect(load()).rejects.toThrow("The equipment library did not load. Details: HTTP 404");
    expect(await load()).toEqual(CATALOG);
  });
});
