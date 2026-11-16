import { beforeEach, describe, expect, it } from "vitest";

import { resetDatabase } from "@/lib/db";
import { InMemoryItineraryStore, PrismaItineraryStore } from "@/lib/itinerary/itinerary-store";
import type { StoredItineraryItem } from "@/lib/itinerary/types";
import { seedSuggestion, seedTrip, seedUser } from "@/lib/testing/parents";

const item: StoredItineraryItem = {
  id: "item-1",
  tripId: "trip-1",
  suggestionId: "suggestion-1",
};

describe("InMemoryItineraryStore", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("stores one linked item for a suggestion", async () => {
    const store = new InMemoryItineraryStore();

    await store.add(item);

    await expect(store.findBySuggestion("trip-1", "suggestion-1")).resolves.toEqual(item);
    await expect(store.listByTrip("trip-1")).resolves.toEqual([item]);
    await expect(store.listByTrip("trip-2")).resolves.toEqual([]);
  });

  it("keeps an itinerary item when a new store instance is created", async () => {
    await seedUser("user-1");
    await seedTrip(item.tripId);
    await seedSuggestion(item.suggestionId, item.tripId);
    const first = new PrismaItineraryStore();
    const second = new PrismaItineraryStore();

    await first.add(item);

    await expect(second.findBySuggestion("trip-1", "suggestion-1")).resolves.toEqual(item);
    await expect(second.findById(item.id)).resolves.toEqual(item);
  });

  it("stores a date and optional time, then removes the itinerary item", async () => {
    const store = new InMemoryItineraryStore();
    await store.add(item);

    await store.update({ ...item, date: "2026-11-02", startTime: "09:30" });

    await expect(store.findById("item-1")).resolves.toEqual({
      ...item,
      date: "2026-11-02",
      startTime: "09:30",
    });

    await store.remove("item-1");

    await expect(store.listByTrip("trip-1")).resolves.toEqual([]);
    await expect(store.findBySuggestion("trip-1", "suggestion-1")).resolves.toBeNull();
  });
});
