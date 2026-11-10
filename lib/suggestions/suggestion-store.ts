import type { StoredSuggestion, SuggestionStore } from "@/lib/suggestions/types";

export class InMemorySuggestionStore implements SuggestionStore {
  private readonly suggestions = new Map<string, StoredSuggestion>();

  async create(suggestion: StoredSuggestion): Promise<void> {
    this.suggestions.set(suggestion.id, cloneSuggestion(suggestion));
  }

  async listByTrip(tripId: string): Promise<StoredSuggestion[]> {
    const listed: StoredSuggestion[] = [];
    for (const suggestion of this.suggestions.values()) {
      if (suggestion.tripId === tripId) {
        listed.push(cloneSuggestion(suggestion));
      }
    }
    return listed;
  }

  async findById(id: string): Promise<StoredSuggestion | null> {
    const suggestion = this.suggestions.get(id);
    return suggestion ? cloneSuggestion(suggestion) : null;
  }
}

function cloneSuggestion(suggestion: StoredSuggestion): StoredSuggestion {
  return {
    id: suggestion.id,
    tripId: suggestion.tripId,
    authorId: suggestion.authorId,
    category: suggestion.category,
    name: suggestion.name,
    description: suggestion.description,
    address: suggestion.address,
    link: suggestion.link,
  };
}
