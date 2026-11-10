import { randomUUID } from "node:crypto";

import type { Logger, UserStore } from "@/lib/auth/types";
import type { TripStore } from "@/lib/trips/types";
import type {
  CreateSuggestionResult,
  SuggestionListResult,
  SuggestionStore,
  SuggestionView,
} from "@/lib/suggestions/types";
import { parseSuggestionInput } from "@/lib/suggestions/validation";

const TRIP_NOT_FOUND = "Trip not found.";

export class SuggestionService {
  private readonly suggestions: SuggestionStore;
  private readonly trips: TripStore;
  private readonly users: UserStore;
  private readonly logger: Logger;

  constructor(suggestions: SuggestionStore, trips: TripStore, users: UserStore, logger: Logger) {
    this.suggestions = suggestions;
    this.trips = trips;
    this.users = users;
    this.logger = logger;
  }

  async createSuggestion(
    userId: string,
    tripId: string,
    input: {
      category: unknown;
      name: unknown;
      description: unknown;
      address: unknown;
      link: unknown;
    },
  ): Promise<CreateSuggestionResult> {
    const membership = await this.trips.findMembership(tripId, userId);
    if (!membership) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }

    const parsed = parseSuggestionInput(input);
    if (!parsed.ok) {
      return parsed;
    }

    const author = await this.users.findById(userId);
    if (!author) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }

    const stored = {
      id: randomUUID(),
      tripId,
      authorId: userId,
      category: parsed.category,
      name: parsed.name,
      description: parsed.description,
      address: parsed.address,
      link: parsed.link,
    };
    await this.suggestions.create(stored);
    this.logger.info("suggestion created");
    return {
      ok: true,
      suggestion: {
        id: stored.id,
        category: stored.category,
        name: stored.name,
        description: stored.description,
        address: stored.address,
        link: stored.link,
        authorEmail: author.email,
      },
    };
  }

  async listSuggestions(userId: string, tripId: string): Promise<SuggestionListResult> {
    const membership = await this.trips.findMembership(tripId, userId);
    if (!membership) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }

    const stored = await this.suggestions.listByTrip(tripId);
    const suggestions: SuggestionView[] = [];
    for (const suggestion of stored) {
      const author = await this.users.findById(suggestion.authorId);
      if (!author) {
        continue;
      }
      suggestions.push({
        id: suggestion.id,
        category: suggestion.category,
        name: suggestion.name,
        description: suggestion.description,
        address: suggestion.address,
        link: suggestion.link,
        authorEmail: author.email,
      });
    }
    return { ok: true, suggestions };
  }
}
