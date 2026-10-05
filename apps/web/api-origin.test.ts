import { describe, expect, test } from "bun:test";

import { apiOrigin } from "./api-origin";

describe("the API's address, read when the web app is built", () => {
  test("here it is the API's port on this machine, 4701 unless the stack says another", () => {
    expect(apiOrigin({})).toBe("http://127.0.0.1:4701");
    expect(apiOrigin({ ROOFTOP_API_PORT: "4711" })).toBe("http://127.0.0.1:4711");
  });

  test("a port that is not one is refused in words", () => {
    expect(() => apiOrigin({ ROOFTOP_API_PORT: "http" })).toThrow('ROOFTOP_API_PORT must be a port number, got "http".');
    expect(() => apiOrigin({ ROOFTOP_API_PORT: "70000" })).toThrow("ROOFTOP_API_PORT must be a port number");
  });

  test("deployed it is the address the environment names, without a slash at its end", () => {
    const url = "https://abc123.lambda-url.ap-south-1.on.aws";
    expect(apiOrigin({ ROOFTOP_API_ORIGIN: url })).toBe(url);
    expect(apiOrigin({ ROOFTOP_API_ORIGIN: ` ${url}/ ` })).toBe(url);
    expect(apiOrigin({ ROOFTOP_API_ORIGIN: url, ROOFTOP_API_PORT: "4711" })).toBe(url);
  });

  test("an address that is not an https origin is refused in words", () => {
    for (const bad of ["abc123.lambda-url.ap-south-1.on.aws", "http://abc123.on.aws", "https://abc123.on.aws/v1", "https://abc123.on.aws/?a=1"]) {
      expect(() => apiOrigin({ ROOFTOP_API_ORIGIN: bad })).toThrow("ROOFTOP_API_ORIGIN must be an https origin");
    }
  });

  test("a build on Vercel without an address stops, instead of shipping a site whose API is this machine", () => {
    expect(() => apiOrigin({ VERCEL: "1" })).toThrow("ROOFTOP_API_ORIGIN is not set");
    expect(apiOrigin({ VERCEL: "1", ROOFTOP_API_ORIGIN: "https://abc123.on.aws" })).toBe("https://abc123.on.aws");
  });
});
