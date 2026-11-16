import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("docs/database-schema.md", () => {
  it("documents the Neon PostgreSQL ER diagram and Prisma relationship", () => {
    const doc = readFileSync(join(process.cwd(), "docs/database-schema.md"), "utf8");

    expect(doc).toContain("# Tripster database schema");
    expect(doc).toContain("```mermaid");
    expect(doc).toContain("erDiagram");
    expect(doc).toContain("User");
    expect(doc).toContain("Trip");
    expect(doc).toContain("Membership");
    expect(doc).toContain("Suggestion");
    expect(doc).toContain("Vote");
    expect(doc).toContain("ItineraryItem");
    expect(doc).toContain("Expense");
    expect(doc).toContain("ExpenseParticipant");
    expect(doc).toContain("Neon");
    expect(doc).toContain("Prisma");
    expect(doc).toContain("prisma/schema.prisma");
  });
});
