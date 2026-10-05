import type { NextConfig } from "next";

import { apiOrigin } from "./api-origin";

// tools/dev.ts sets ROOFTOP_API_PORT and ROOFTOP_DIST_DIR when it starts the app, so that the dev stack and the test
// stack can run side by side; a deployed build reads ROOFTOP_API_ORIGIN instead (api-origin.ts). Without them (next
// build, next typegen, a bare `next dev`) the defaults apply.
//   ROOFTOP_DIST_DIR   Next's build directory; one per running stack, because Next locks it
function distDir(): string {
  const directory = process.env.ROOFTOP_DIST_DIR ?? ".next";
  if (!/^\.next[\w-]*$/.test(directory)) {
    throw new Error(`ROOFTOP_DIST_DIR must be a directory name like ".next" or ".next-test", got "${directory}".`);
  }
  return directory;
}

// The browser only ever talks to the web origin; /api/* is forwarded to the API, so there is no CORS.
const API_ORIGIN = apiOrigin(process.env);

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
  // On Vercel the rewrite is the CDN's, not this server's, and this setting plays no part: the CDN waits 120 s for the
  // first byte, then as long as a byte comes every 120 s (plan/phase-12-plan.md).
  experimental: { proxyTimeout: 120_000 },

  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/:path*` }];
  },
};

export default nextConfig;
