import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const databaseUser = process.env.USER ?? "USERNAME";
const testDatabaseUrl =
  process.env.DATABASE_URL_TEST ?? `postgresql://${databaseUser}@localhost:5432/tripster_test`;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
    fileParallelism: false,
    maxWorkers: 1,
    env: {
      DATABASE_URL: testDatabaseUrl,
    },
  },
});
