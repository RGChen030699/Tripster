import type { StoredSuggestion, SuggestionStore } from "@/lib/suggestions/types";

export class InMemorySuggestionStore implements SuggestionStore {
  private readonly suggestions = new Map<string, StoredSuggestion>();

  async create(suggestion: StoredSuggestion): Promise<void> {
    this.suggestions.set(suggestion.id, cloneSuggestion(suggestion));
  }

  async update(suggestion: StoredSuggestion): Promise<void> {
    if (!this.suggestions.has(suggestion.id)) {
      return;
    }
    this.suggestions.set(suggestion.id, cloneSuggestion(suggestion));
  }

  async remove(id: string): Promise<void> {
    const existing = this.suggestions.get(id);
    if (!existing) {
      return;
    }
    this.suggestions.set(id, cloneSuggestion({ ...existing, removed: true }));
  }

  async listByTrip(tripId: string): Promise<StoredSuggestion[]> {
    const listed: StoredSuggestion[] = [];
    for (const suggestion of this.suggestions.values()) {
      if (suggestion.tripId === tripId && suggestion.removed !== true) {
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
  const stored: StoredSuggestion = {
    id: suggestion.id,
    tripId: suggestion.tripId,
    authorId: suggestion.authorId,
    category: suggestion.category,
    name: suggestion.name,
    description: suggestion.description,
    address: suggestion.address,
    link: suggestion.link,
  };
  if (suggestion.removed) {
    stored.removed = true;
  }
  return stored;
}
