import type { StoredSuggestion, SuggestionStore } from "@/lib/suggestions/types";

export class InMemorySuggestionStore implements SuggestionStore {
  async create(suggestion: StoredSuggestion): Promise<void> {
    void suggestion;
  }

  async listByTrip(tripId: string): Promise<StoredSuggestion[]> {
    void tripId;
    return [];
  }

  async findById(id: string): Promise<StoredSuggestion | null> {
    void id;
    return null;
  }
}
