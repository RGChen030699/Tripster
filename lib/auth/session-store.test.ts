import { describe, expect, it } from "vitest";

import { InMemorySessionStore } from "@/lib/auth/session-store";
import type { StoredSession } from "@/lib/auth/types";

const firstSession: StoredSession = { token: "token-1", userId: "user-1" };
const secondSession: StoredSession = { token: "token-2", userId: "user-1" };

describe("InMemorySessionStore", () => {
  it("stores a session until that token is deleted", async () => {
    const store = new InMemorySessionStore();

    await store.create(firstSession);

    await expect(store.findByToken(firstSession.token)).resolves.toEqual(firstSession);

    await store.deleteByToken(firstSession.token);

    await expect(store.findByToken(firstSession.token)).resolves.toBeNull();
  });

  it("deletes only the requested session", async () => {
    const store = new InMemorySessionStore();

    await store.create(firstSession);
    await store.create(secondSession);
    await store.deleteByToken(firstSession.token);

    await expect(store.findByToken(firstSession.token)).resolves.toBeNull();
    await expect(store.findByToken(secondSession.token)).resolves.toEqual(secondSession);
  });

  it("keeps a session when a new store instance is created", async () => {
    const first = new InMemorySessionStore();
    const second = new InMemorySessionStore();

    await first.create(firstSession);

    await expect(second.findByToken(firstSession.token)).resolves.toEqual(firstSession);
  });
});
