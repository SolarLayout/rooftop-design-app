import { describe, expect, test } from "bun:test";
import { ApiError, errorOf, UNREACHABLE_MESSAGE } from "./errors";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("errorOf", () => {
  test("keeps the code, the message and the field of the API", async () => {
    const response = json(422, {
      error: { code: "weather_not_loaded", message: "Load the PVGIS TMY weather first.", field: "weather_json" },
    });

    const error = await errorOf(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(422);
    expect(error.code).toBe("weather_not_loaded");
    expect(error.message).toBe("Load the PVGIS TMY weather first.");
    expect(error.field).toBe("weather_json");
    expect(error.name).toBe("ApiError");
  });

  test("an error without a field has none", async () => {
    const error = await errorOf(json(502, { error: { code: "weather_source_failed", message: "Try again.", field: null } }));
    expect(error.field).toBeNull();
  });

  test.each([
    ["a page of a proxy", new Response("<html>Bad gateway</html>", { status: 502 })],
    ["no body", new Response(null, { status: 500 })],
    ["JSON of another shape", json(500, { detail: "no" })],
    ["an error without a message", json(500, { error: { code: "x" } })],
  ])("%s is told as a fault of the server, with its status", async (_, response) => {
    const error = await errorOf(response);

    expect(error.code).toBe("unexpected_answer");
    expect(error.status).toBe(response.status);
    expect(error.message).toBe(
      `The server answered ${response.status} in a form that cannot be read. Try again; if it fails again, report it.`,
    );
    expect(error.field).toBeNull();
  });
});

describe("ApiError", () => {
  test("an API that cannot be reached has its own code and no status", () => {
    const error = ApiError.unreachable(new TypeError("fetch failed"));

    expect(error.code).toBe("api_unreachable");
    expect(error.status).toBeNull();
    expect(error.message).toBe(UNREACHABLE_MESSAGE);
    expect(error.cause).toBeInstanceOf(TypeError);
  });
});
