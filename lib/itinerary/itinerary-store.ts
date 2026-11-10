import type { ItineraryStore, StoredItineraryItem } from "@/lib/itinerary/types";

export class InMemoryItineraryStore implements ItineraryStore {
  private readonly items = new Map<string, StoredItineraryItem>();

  async add(item: StoredItineraryItem): Promise<void> {
    this.items.set(item.id, cloneItem(item));
  }

  async listByTrip(tripId: string): Promise<StoredItineraryItem[]> {
    const listed: StoredItineraryItem[] = [];
    for (const item of this.items.values()) {
      if (item.tripId === tripId) {
        listed.push(cloneItem(item));
      }
    }
    return listed;
  }

  async findBySuggestion(tripId: string, suggestionId: string): Promise<StoredItineraryItem | null> {
    for (const item of this.items.values()) {
      if (item.tripId === tripId && item.suggestionId === suggestionId) {
        return cloneItem(item);
      }
    }
    return null;
  }
}

function cloneItem(item: StoredItineraryItem): StoredItineraryItem {
  return { id: item.id, tripId: item.tripId, suggestionId: item.suggestionId };
}
