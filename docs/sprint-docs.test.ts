import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("sprint agile docs", () => {
  it("includes dated Sprint 1 and Sprint 2 retrospectives", () => {
    const sprint1 = readFileSync(
      join(process.cwd(), "docs/sprint-1-retrospective.md"),
      "utf8",
    );
    const sprint2 = readFileSync(
      join(process.cwd(), "docs/sprint-2-retrospective.md"),
      "utf8",
    );

    expect(sprint1).toContain("# Sprint 1 retrospective");
    expect(sprint1).toContain("Written:** November 10, 2026");
    expect(sprint1).toContain("never Adds to the itinerary");
    expect(sprint2).toContain("# Sprint 2 retrospective");
    expect(sprint2).toContain("Written:** November 15, 2026");
    expect(sprint2).toContain("equal splits that total exactly in cents");
  });

  it("documents post-hoc estimates for issues #1–#10 with an explicit add date", () => {
    const estimates = readFileSync(
      join(process.cwd(), "docs/sprint-estimates.md"),
      "utf8",
    );

    expect(estimates).toContain("# Sprint story estimates");
    expect(estimates).toContain("November 16, 2026");
    expect(estimates).toContain("not** recorded during original Sprint");
    for (const issue of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      expect(estimates).toContain(`issues/${issue}`);
    }
  });
});
