import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/openapi/route";

describe("GET /api/openapi", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("serves the OpenAPI document outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    const body = (await response.json()) as { openapi: string; paths: Record<string, unknown> };
    expect(body.openapi).toBe("3.1.0");
    expect(body.paths["/api/trips"]).toBeTruthy();
    expect(body.paths["/api/trips/{tripId}/expenses"]).toBeTruthy();
  });

  it("does not serve the document in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await GET();

    expect(response.status).toBe(404);
  });
});
