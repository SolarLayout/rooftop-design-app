import { describe, expect, test } from "bun:test";
import { base64Of, libraryFileOf } from "./library-file";

describe("a file of the library, as the API takes it", () => {
  test("its bytes go as base64, so that a file in latin-1 reaches the reader as it is", () => {
    const bytes = new Uint8Array([0x4d, 0x6f, 0x64, 0x65, 0x6c, 0x3d, 0x96, 0xe9]);
    expect(base64Of(bytes)).toBe(Buffer.from(bytes).toString("base64"));
  });

  test("a large file is encoded whole", () => {
    const bytes = new Uint8Array(200_000).map((_, index) => index % 251);
    expect(base64Of(bytes)).toBe(Buffer.from(bytes).toString("base64"));
  });

  test("is fetched from beside the catalog and named by its file", async () => {
    const asked: string[] = [];
    const file = await libraryFileOf("modules", "Heliene_144HC-560.PAN", async (url) => {
      asked.push(url);
      return new Response(new Uint8Array([65, 66]));
    });
    expect(asked).toEqual(["/equipment/modules/Heliene_144HC-560.PAN"]);
    expect(file).toEqual({ name: "Heliene_144HC-560.PAN", base64: "QUI=" });
  });

  test("a file that is not there says so", async () => {
    const missing = libraryFileOf("inverters", "Gone.OND", async () => new Response("", { status: 404 }));
    await expect(missing).rejects.toThrow("Gone.OND could not be loaded from the app's library (HTTP 404). Try again.");
  });
});
