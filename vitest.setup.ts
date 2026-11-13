import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach } from "vitest";

import { disconnectPrisma } from "@/lib/db";

afterEach(() => {
  if (typeof document !== "undefined") {
    cleanup();
  }
});

afterAll(async () => {
  await disconnectPrisma();
});
