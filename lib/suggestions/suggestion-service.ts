import type { Logger, UserStore } from "@/lib/auth/types";
import type { TripStore } from "@/lib/trips/types";
import type {
  CreateSuggestionResult,
  SuggestionListResult,
  SuggestionStore,
} from "@/lib/suggestions/types";

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
    void userId;
    void tripId;
    void input;
    void this.suggestions;
    void this.trips;
    void this.users;
    void this.logger;
    return { ok: false, status: 501, error: "Not implemented." };
  }

  async listSuggestions(userId: string, tripId: string): Promise<SuggestionListResult> {
    void userId;
    void tripId;
    return { ok: false, status: 501, error: "Not implemented." };
  }
}
