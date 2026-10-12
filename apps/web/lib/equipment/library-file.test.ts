import { describe, expect, test } from "bun:test";
import { base64Of, libraryFileOf, MAX_EQUIPMENT_BYTES, ownFileOf } from "./library-file";

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
    await expect(missing).rejects.toThrow("Gone.OND did not load from the library. Try again. Details: HTTP 404");
  });
});

// #179, item 8: a PAN or OND file of the user's over what the API reads was refused in the framework's words
// ("base64: String should have at most 341336 characters"); it is refused in the app's, before it is sent.
describe("a file of the user's, as the API takes it", () => {
  const fileOf = (name: string, bytes: Uint8Array) => ({ name, size: bytes.length, arrayBuffer: async () => bytes.buffer as ArrayBuffer });

  test("its bytes go as base64, named by the file", async () => {
    expect(await ownFileOf(fileOf("Own.OND", new Uint8Array([65, 66])))).toEqual({ name: "Own.OND", base64: "QUI=" });
  });

  test("up to the API's limit is sent; one byte over is refused in the app's words, the file never read", async () => {
    expect(MAX_EQUIPMENT_BYTES).toBe(256_000);
    expect((await ownFileOf(fileOf("Edge.PAN", new Uint8Array(MAX_EQUIPMENT_BYTES)))).name).toBe("Edge.PAN");
    let read = false;
    const big = { name: "Huge.OND", size: MAX_EQUIPMENT_BYTES + 1, arrayBuffer: async () => ((read = true), new ArrayBuffer(0)) };
    await expect(ownFileOf(big)).rejects.toThrow("Huge.OND is over 256 KB, larger than any module or inverter file. Choose another.");
    expect(read).toBe(false);
  });
});
