import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // public/maplibre-gl holds the worker of MapLibre as the package ships it (tools/vendor-maplibre.ts).
  globalIgnores([".next/**", ".next-test/**", "out/**", "build/**", "next-env.d.ts", "public/**"]),
]);

export default eslintConfig;
