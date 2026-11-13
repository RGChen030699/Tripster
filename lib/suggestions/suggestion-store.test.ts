import { beforeEach, describe, expect, it } from "vitest";

import { resetDatabase } from "@/lib/db";
import { seedTrip, seedUser } from "@/lib/testing/parents";
import { InMemorySuggestionStore, PrismaSuggestionStore } from "@/lib/suggestions/suggestion-store";
import type { StoredSuggestion } from "@/lib/suggestions/types";

const suggestion: StoredSuggestion = {
  id: "suggestion-1",
  tripId: "trip-1",
  authorId: "user-1",
  category: "restaurant",
  name: "Pastel de nata",
  description: "A bakery stop",
  address: "Rua da Prata",
  link: "https://example.com/nata",
};

describe("InMemorySuggestionStore", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("stores a suggestion for its trip", async () => {
    const store = new InMemorySuggestionStore();

    await store.create(suggestion);

    await expect(store.findById(suggestion.id)).resolves.toEqual(suggestion);
    await expect(store.listByTrip("trip-1")).resolves.toEqual([suggestion]);
    await expect(store.listByTrip("trip-2")).resolves.toEqual([]);
  });

  it("keeps a suggestion when a new store instance is created", async () => {
    await seedUser(suggestion.authorId);
    await seedTrip(suggestion.tripId);
    const first = new PrismaSuggestionStore();
    const second = new PrismaSuggestionStore();

    await first.create(suggestion);

    await expect(second.findById(suggestion.id)).resolves.toEqual(suggestion);
    await expect(second.listByTrip("trip-1")).resolves.toEqual([suggestion]);
  });

  it("updates a suggestion and hides a removed one from the trip list", async () => {
    const store = new InMemorySuggestionStore();
    await store.create(suggestion);

    await store.update({ ...suggestion, name: "Custard tart", category: "activity" });
    await expect(store.findById(suggestion.id)).resolves.toMatchObject({
      name: "Custard tart",
      category: "activity",
    });

    await store.remove(suggestion.id);
    await expect(store.listByTrip("trip-1")).resolves.toEqual([]);
    await expect(store.findById(suggestion.id)).resolves.toMatchObject({
      name: "Custard tart",
      removed: true,
    });
  });
});
