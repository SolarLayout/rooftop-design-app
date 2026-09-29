import type { NextConfig } from "next";

// The API in development. The browser only ever talks to the web origin; Next forwards /api/* to the API,
// so there is no CORS.
const API_ORIGIN = "http://127.0.0.1:4701";

const nextConfig: NextConfig = {
  // Keep this off. React Three Fiber's <Canvas> disposes its WebGL renderer on unmount (it forces a
  // context loss). Strict mode in development mounts, unmounts and mounts again on purpose, so the
  // second mount attaches to a dead canvas and the 3D scene stays blank. This is a known R3F + React 19
  // interaction and only happens in development; production never double-mounts.
  // See plan/reference/r3f-notes.md, fix 1.
  reactStrictMode: false,

  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/:path*` }];
  },
};

export default nextConfig;
