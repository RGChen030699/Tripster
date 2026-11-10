import { describe, expect, it } from "vitest";

import { InMemoryItineraryStore } from "@/lib/itinerary/itinerary-store";
import type { StoredItineraryItem } from "@/lib/itinerary/types";

const item: StoredItineraryItem = {
  id: "item-1",
  tripId: "trip-1",
  suggestionId: "suggestion-1",
};

describe("InMemoryItineraryStore", () => {
  it("stores one linked item for a suggestion", async () => {
    const store = new InMemoryItineraryStore();

    await store.add(item);

    await expect(store.findBySuggestion("trip-1", "suggestion-1")).resolves.toEqual(item);
    await expect(store.listByTrip("trip-1")).resolves.toEqual([item]);
    await expect(store.listByTrip("trip-2")).resolves.toEqual([]);
  });

  it("does not share items across store instances", async () => {
    const first = new InMemoryItineraryStore();
    const second = new InMemoryItineraryStore();

    await first.add(item);

    await expect(second.findBySuggestion("trip-1", "suggestion-1")).resolves.toBeNull();
    await expect(first.findBySuggestion("trip-1", "suggestion-1")).resolves.toEqual(item);
  });
});
