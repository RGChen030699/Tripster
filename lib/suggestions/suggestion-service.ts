import { randomUUID } from "node:crypto";

import type { Logger, UserStore } from "@/lib/auth/types";
import type { TripStore } from "@/lib/trips/types";
import type {
  AddItineraryResult,
  ItineraryItemView,
  ItineraryListResult,
  ItineraryStore,
} from "@/lib/itinerary/types";
import type {
  CreateSuggestionResult,
  RemoveSuggestionResult,
  StoredVote,
  SuggestionListResult,
  UpdateSuggestionResult,
  SuggestionStore,
  SuggestionView,
  VoteResult,
  VoteStore,
  VoteTotals,
} from "@/lib/suggestions/types";
import { parseSuggestionInput, parseVoteChoice } from "@/lib/suggestions/validation";

const TRIP_NOT_FOUND = "Trip not found.";
const SUGGESTION_NOT_FOUND = "Suggestion not found.";

export class SuggestionService {
  private readonly suggestions: SuggestionStore;
  private readonly votes: VoteStore;
  private readonly itinerary: ItineraryStore;
  private readonly trips: TripStore;
  private readonly users: UserStore;
  private readonly logger: Logger;

  constructor(
    suggestions: SuggestionStore,
    votes: VoteStore,
    itinerary: ItineraryStore,
    trips: TripStore,
    users: UserStore,
    logger: Logger,
  ) {
    this.suggestions = suggestions;
    this.votes = votes;
    this.itinerary = itinerary;
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
        votes: { yes: 0, maybe: 0, no: 0 },
        myVote: null,
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
      const recorded = await this.votes.listBySuggestion(suggestion.id);
      const mine = recorded.find((vote) => vote.userId === userId);
      suggestions.push({
        id: suggestion.id,
        category: suggestion.category,
        name: suggestion.name,
        description: suggestion.description,
        address: suggestion.address,
        link: suggestion.link,
        authorEmail: author.email,
        votes: countVotes(recorded),
        myVote: mine?.choice ?? null,
      });
    }
    return { ok: true, suggestions };
  }

  async vote(
    userId: string,
    tripId: string,
    suggestionId: string,
    choice: unknown,
  ): Promise<VoteResult> {
    const membership = await this.trips.findMembership(tripId, userId);
    if (!membership) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }
    const suggestion = await this.suggestions.findById(suggestionId);
    if (!suggestion || suggestion.tripId !== tripId) {
      return { ok: false, status: 404, error: SUGGESTION_NOT_FOUND };
    }
    const parsed = parseVoteChoice(choice);
    if (!parsed.ok) {
      return parsed;
    }

    await this.votes.set({ suggestionId, userId, choice: parsed.choice });
    this.logger.info("vote recorded");
    return {
      ok: true,
      vote: { choice: parsed.choice },
      votes: countVotes(await this.votes.listBySuggestion(suggestionId)),
    };
  }

  async listItinerary(userId: string, tripId: string): Promise<ItineraryListResult> {
    const membership = await this.trips.findMembership(tripId, userId);
    if (!membership) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }

    const stored = await this.itinerary.listByTrip(tripId);
    const items: ItineraryItemView[] = [];
    for (const item of stored) {
      const suggestion = await this.suggestions.findById(item.suggestionId);
      if (!suggestion || suggestion.tripId !== tripId) {
        continue;
      }
      items.push({
        id: item.id,
        suggestionId: item.suggestionId,
        name: suggestion.name,
        category: suggestion.category,
        unscheduled: true,
      });
    }
    return { ok: true, items };
  }

  async addToItinerary(
    userId: string,
    tripId: string,
    suggestionId: string,
  ): Promise<AddItineraryResult> {
    const membership = await this.trips.findMembership(tripId, userId);
    if (!membership) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }
    const suggestion = await this.suggestions.findById(suggestionId);
    if (!suggestion || suggestion.tripId !== tripId) {
      return { ok: false, status: 404, error: SUGGESTION_NOT_FOUND };
    }

    const existing = await this.itinerary.findBySuggestion(tripId, suggestionId);
    if (existing) {
      return { ok: true, created: false, item: toItineraryView(existing, suggestion) };
    }

    const item = { id: randomUUID(), tripId, suggestionId };
    await this.itinerary.add(item);
    this.logger.info("itinerary item added");
    return { ok: true, created: true, item: toItineraryView(item, suggestion) };
  }

  async updateSuggestion(
    userId: string,
    tripId: string,
    suggestionId: string,
    input: {
      category: unknown;
      name: unknown;
      description: unknown;
      address: unknown;
      link: unknown;
    },
  ): Promise<UpdateSuggestionResult> {
    void userId;
    void tripId;
    void suggestionId;
    void input;
    return { ok: false, status: 501, error: "Not implemented." };
  }

  async removeSuggestion(
    userId: string,
    tripId: string,
    suggestionId: string,
  ): Promise<RemoveSuggestionResult> {
    void userId;
    void tripId;
    void suggestionId;
    return { ok: false, status: 501, error: "Not implemented." };
  }
}

function toItineraryView(
  item: { id: string; suggestionId: string },
  suggestion: { name: string; category: ItineraryItemView["category"] },
): ItineraryItemView {
  return {
    id: item.id,
    suggestionId: item.suggestionId,
    name: suggestion.name,
    category: suggestion.category,
    unscheduled: true,
  };
}

function countVotes(votes: StoredVote[]): VoteTotals {
  const totals: VoteTotals = { yes: 0, maybe: 0, no: 0 };
  for (const vote of votes) {
    totals[vote.choice] += 1;
  }
  return totals;
}
