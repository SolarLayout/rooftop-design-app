import type { NextConfig } from "next";

// tools/dev.ts sets these two when it starts the app, so that the dev stack and the test stack can run
// side by side. Without them (next build, next typegen, a bare `next dev`) the defaults apply.
//   ROOFTOP_API_PORT   port of the API that /api/* is forwarded to
//   ROOFTOP_DIST_DIR   Next's build directory; one per running stack, because Next locks it
function apiPort(): number {
  const text = process.env.ROOFTOP_API_PORT ?? "4701";
  const port = Number(text);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`ROOFTOP_API_PORT must be a port number, got "${text}".`);
  }
  return port;
}

function distDir(): string {
  const directory = process.env.ROOFTOP_DIST_DIR ?? ".next";
  if (!/^\.next[\w-]*$/.test(directory)) {
    throw new Error(`ROOFTOP_DIST_DIR must be a directory name like ".next" or ".next-test", got "${directory}".`);
  }
  return directory;
}

// The browser only ever talks to the web origin; Next forwards /api/* to the API, so there is no CORS.
// 127.0.0.1 and not localhost: uvicorn listens on IPv4 only.
const API_ORIGIN = `http://127.0.0.1:${apiPort()}`;

const nextConfig: NextConfig = {
  // Keep this off. React Three Fiber's <Canvas> disposes its WebGL renderer on unmount (it forces a
  // context loss). Strict mode in development mounts, unmounts and mounts again on purpose, so the
  // second mount attaches to a dead canvas and the 3D scene stays blank. This is a known R3F + React 19
  // interaction and only happens in development; production never double-mounts.
  // See plan/reference/r3f-notes.md, fix 1.
  reactStrictMode: false,

  distDir: distDir(),

  // The rewrite's proxy gives an answer 120 s, not Next's 30: under the load of the browser tests the report's pages
  // took 33 s at the median and 75 s at most at the API (serial drawing), and the proxy's timeout came back as a bare
  // "Internal Server Error" (socket hang up) while the API answered 200 (session 14, 2026-10-04). The browser tests
  // wait 90 s for such an answer; a design run of a roof at the limit of 30,000 m² is well under this too.
  experimental: { proxyTimeout: 120_000 },

  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/:path*` }];
  },
};

export default nextConfig;
