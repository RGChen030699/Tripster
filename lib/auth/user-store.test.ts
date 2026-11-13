import { beforeEach, describe, expect, it } from "vitest";

import type { StoredUser } from "@/lib/auth/types";
import { DuplicateEmailError, InMemoryUserStore, PrismaUserStore } from "@/lib/auth/user-store";
import { resetDatabase } from "@/lib/db";

const user: StoredUser = {
  id: "user-1",
  email: "ada@example.com",
  passwordHash: "hashed-secret",
};

describe("InMemoryUserStore", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("stores a user and returns that user from the same instance", async () => {
    const store = new InMemoryUserStore();

    await store.create(user);

    await expect(store.findByEmail(user.email)).resolves.toEqual(user);
    await expect(store.findById(user.id)).resolves.toEqual(user);
  });

  it("keeps a user when a new store instance is created", async () => {
    const first = new PrismaUserStore();
    const second = new PrismaUserStore();

    await first.create(user);

    await expect(second.findByEmail(user.email)).resolves.toEqual(user);
    await expect(second.findById(user.id)).resolves.toEqual(user);
  });

  it("rejects a second create for the same email", async () => {
    const store = new InMemoryUserStore();

    await store.create(user);

    await expect(
      store.create({ ...user, id: "user-2", passwordHash: "other-hash" }),
    ).rejects.toBeInstanceOf(DuplicateEmailError);
  });
});
