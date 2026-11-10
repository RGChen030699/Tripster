import { describe, expect, it } from "vitest";

import { InMemorySuggestionStore } from "@/lib/suggestions/suggestion-store";
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
  it("stores a suggestion for its trip", async () => {
    const store = new InMemorySuggestionStore();

    await store.create(suggestion);

    await expect(store.findById(suggestion.id)).resolves.toEqual(suggestion);
    await expect(store.listByTrip("trip-1")).resolves.toEqual([suggestion]);
    await expect(store.listByTrip("trip-2")).resolves.toEqual([]);
  });

  it("does not share suggestions across store instances", async () => {
    const first = new InMemorySuggestionStore();
    const second = new InMemorySuggestionStore();

    await first.create(suggestion);

    await expect(second.findById(suggestion.id)).resolves.toBeNull();
    await expect(first.findById(suggestion.id)).resolves.toEqual(suggestion);
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
