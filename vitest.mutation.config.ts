import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Lean Vitest config for Stryker only.
 * Mutates pure expense-split math — no DB, React, or Playwright.
 * Does not replace vitest.config.ts used by `npm test`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    environment: "node",
    include: ["lib/expenses/split.test.ts"],
    passWithNoTests: false,
    fileParallelism: false,
    maxWorkers: 1,
  },
});
