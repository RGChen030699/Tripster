import type { ItineraryStore, StoredItineraryItem } from "@/lib/itinerary/types";

export class InMemoryItineraryStore implements ItineraryStore {
  async add(item: StoredItineraryItem): Promise<void> {
    void item;
  }

  async listByTrip(tripId: string): Promise<StoredItineraryItem[]> {
    void tripId;
    return [];
  }

  async findBySuggestion(tripId: string, suggestionId: string): Promise<StoredItineraryItem | null> {
    void tripId;
    void suggestionId;
    return null;
  }
}
