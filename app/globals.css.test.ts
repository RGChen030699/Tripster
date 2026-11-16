import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("app/globals.css theme", () => {
  it("keeps sage lighter than the previous mid-green tone", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
    expect(css).toContain("--color-sage: #d5dece");
    expect(css).toContain("--color-sand: #efe7d8");
    expect(css).not.toContain("--color-sage: #a8b69f");
  });
});
