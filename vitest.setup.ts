import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach } from "vitest";

import { disconnectPrisma } from "@/lib/db";

process.env.JWT_SECRET ??= "tripster-test-jwt-secret";

afterEach(() => {
  if (typeof document !== "undefined") {
    cleanup();
  }
});

afterAll(async () => {
  await disconnectPrisma();
});
