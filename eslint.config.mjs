import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "artifacts/**",
    "out/**",
    "build/**",
    "playwright-report/**",
    "src/generated/**",
    "test-results/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
