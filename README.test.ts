import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("README", () => {
  it("explains the product, setup, environment, tests, and deployment without secrets", () => {
    const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");

    expect(readme).toContain("## Product");
    expect(readme).toContain("## Local setup");
    expect(readme).toContain("## Environment variables");
    expect(readme).toContain("## Tests");
    expect(readme).toContain("## Deployment");
    expect(readme).toContain("/api/openapi");
    expect(readme).not.toContain("correct-horse");
    expect(readme).not.toContain("passwordHash");
    expect(readme).not.toContain("postgres://");
  });
});
