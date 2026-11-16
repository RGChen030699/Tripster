import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const document = JSON.parse(
  readFileSync(join(process.cwd(), "openapi/tripster.openapi.json"), "utf8"),
) as {
  openapi: string;
  paths: Record<string, Record<string, unknown>>;
};

const MAIN_FLOWS: Array<[string, string]> = [
  ["/api/auth/register", "post"],
  ["/api/auth/login", "post"],
  ["/api/trips", "post"],
  ["/api/trips/{tripId}/members", "post"],
  ["/api/trips/{tripId}/suggestions", "post"],
  ["/api/trips/{tripId}/suggestions/{suggestionId}/votes", "post"],
  ["/api/trips/{tripId}/suggestions/{suggestionId}/itinerary", "post"],
  ["/api/trips/{tripId}/itinerary/{itemId}", "patch"],
  ["/api/trips/{tripId}/expenses", "post"],
  ["/api/trips/{tripId}/expenses/balances", "get"],
];

describe("Tripster OpenAPI document", () => {
  it("documents trips, suggestions, votes, itinerary, and expenses with examples", () => {
    expect(document.openapi).toBe("3.1.0");
    const paths = Object.keys(document.paths);
    for (const path of [
      "/api/trips",
      "/api/trips/{tripId}",
      "/api/trips/{tripId}/suggestions",
      "/api/trips/{tripId}/suggestions/{suggestionId}/votes",
      "/api/trips/{tripId}/itinerary",
      "/api/trips/{tripId}/expenses",
      "/api/trips/{tripId}/expenses/balances",
    ]) {
      expect(paths).toContain(path);
    }
    for (const [path, method] of MAIN_FLOWS) {
      const operation = document.paths[path]?.[method];
      expect(operation, `${method.toUpperCase()} ${path}`).toBeTruthy();
      expect(JSON.stringify(operation)).toContain('"example"');
    }
    const serialized = JSON.stringify(document);
    expect(serialized).not.toContain("correct-horse");
    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("postgres://");
  });
});
