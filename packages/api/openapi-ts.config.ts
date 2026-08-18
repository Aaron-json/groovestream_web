import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  // Override with `npm run gen-api -- --input <file-or-url>`.
  input: "http://localhost:8081/openapi.json",
  output: "src/generated",
  plugins: [
    "@hey-api/typescript",
    {
      name: "@hey-api/client-fetch",
      runtimeConfigPath: "./src/client-config.ts",
      throwOnError: true,
    },
    {
      name: "@hey-api/sdk",
      paramsStructure: "grouped",
      responseStyle: "data",
      operations: "flat",
    },
  ],
});
