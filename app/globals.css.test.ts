import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("app/globals.css theme", () => {
  it("uses the approved sage swatch", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
    expect(css).toContain("--color-sage: #a7b39e");
    expect(css).toContain("--color-sand: #efe7d8");
  });
});

