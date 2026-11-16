import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("README", () => {
  it("explains the product, setup, environment, tests, and deployment without secrets", () => {
    const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");

    expect(readme).toContain("## Product");
    expect(readme).toContain("## Shared trip state");
    expect(readme).toContain("## Local setup");
    expect(readme).toContain("## Environment variables");
    expect(readme).toContain("## Tests");
    expect(readme).toContain("## Deployment");
    expect(readme).toContain("/api/openapi");
    expect(readme).toContain("complex shared state");
    expect(readme).toContain("short polling");
    expect(readme).toContain("does not use WebSockets");
    expect(readme).toContain("docs/architecture.md");
    expect(readme).not.toContain("correct-horse");
    expect(readme).not.toContain("passwordHash");
    expect(readme).not.toContain("postgres://");
  });
});
