import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

const PASSWORD = "correct-horse";

describe("password hashing", () => {
  it("stores a hash that is not the plaintext password", async () => {
    const hash = await hashPassword(PASSWORD);

    expect(hash).not.toBe(PASSWORD);
    expect(hash).not.toContain(PASSWORD);
  });

  it("verifies the password that was hashed", async () => {
    const hash = await hashPassword(PASSWORD);

    await expect(verifyPassword(PASSWORD, hash)).resolves.toBe(true);
  });

  it("rejects a different password", async () => {
    const hash = await hashPassword(PASSWORD);

    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("uses a unique salt so equal passwords do not share a hash", async () => {
    const first = await hashPassword(PASSWORD);
    const second = await hashPassword(PASSWORD);

    expect(first).not.toBe(second);
  });
});
