import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("docs/architecture.md", () => {
  it("documents layers, auth, domains, and deployment with Mermaid diagrams", () => {
    const doc = readFileSync(join(process.cwd(), "docs/architecture.md"), "utf8");

    expect(doc).toContain("# Tripster architecture");
    expect(doc).toContain("```mermaid");
    expect(doc).toContain("Application layers");
    expect(doc).toContain("Auth and session flow");
    expect(doc).toContain("lib/auth");
    expect(doc).toContain("Prisma");
    expect(doc).toContain("PostgreSQL");
    expect(doc).toContain("explicit Add");
    expect(doc).toContain("poll");
    expect(doc).toContain("Vercel");
  });
});
