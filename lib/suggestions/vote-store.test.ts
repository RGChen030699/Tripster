import { beforeEach, describe, expect, it } from "vitest";

import { resetDatabase } from "@/lib/db";
import { seedSuggestion, seedTrip, seedUser } from "@/lib/testing/parents";
import { InMemoryVoteStore, PrismaVoteStore } from "@/lib/suggestions/vote-store";

describe("InMemoryVoteStore", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("keeps one current vote per person and suggestion", async () => {
    const store = new InMemoryVoteStore();

    await store.set({ suggestionId: "suggestion-1", userId: "user-1", choice: "yes" });
    await store.set({ suggestionId: "suggestion-1", userId: "user-1", choice: "maybe" });
    await store.set({ suggestionId: "suggestion-1", userId: "user-2", choice: "no" });
    await store.set({ suggestionId: "suggestion-2", userId: "user-1", choice: "yes" });

    await expect(store.listBySuggestion("suggestion-1")).resolves.toEqual([
      { suggestionId: "suggestion-1", userId: "user-1", choice: "maybe" },
      { suggestionId: "suggestion-1", userId: "user-2", choice: "no" },
    ]);
  });

  it("keeps a vote when a new store instance is created", async () => {
    await seedUser("user-1");
    await seedTrip();
    await seedSuggestion();
    const first = new PrismaVoteStore();
    const second = new PrismaVoteStore();

    await first.set({ suggestionId: "suggestion-1", userId: "user-1", choice: "yes" });

    await expect(second.listBySuggestion("suggestion-1")).resolves.toEqual([
      { suggestionId: "suggestion-1", userId: "user-1", choice: "yes" },
    ]);
  });
});
