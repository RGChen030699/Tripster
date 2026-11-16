/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
export default {
  packageManager: "npm",
  testRunner: "vitest",
  vitest: {
    configFile: "vitest.mutation.config.ts",
    // split.test.ts imports split.ts directly, so related filtering is fine.
    related: true,
  },
  mutate: [
    "lib/expenses/split.ts",
    "!lib/expenses/**/*.test.ts",
  ],
  reporters: ["clear-text", "progress", "html", "json"],
  htmlReporter: {
    fileName: "reports/mutation/index.html",
  },
  jsonReporter: {
    fileName: "reports/mutation/mutation.json",
  },
  // Informative only — do not fail CI or local scripts on score.
  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },
  tempDirName: ".stryker-tmp",
  ignorePatterns: [
    ".next",
    "e2e",
    "docs",
    "openapi",
    "reports",
    "media",
  ],
  concurrency: 2,
  timeoutMS: 60_000,
  disableTypeChecks: true,
};
