import { randomUUID } from "node:crypto";

import type { Logger, UserStore } from "@/lib/auth/types";
import { compareItineraryItems } from "@/lib/itinerary/order";
import type { StoredItineraryItem } from "@/lib/itinerary/types";
import type { TripStore } from "@/lib/trips/types";
import type {
  AddItineraryResult,
  ItineraryItemView,
  ItineraryListResult,
  ItineraryStore,
  RemoveItineraryItemResult,
  ScheduleItineraryResult,
} from "@/lib/itinerary/types";
import type {
  CreateSuggestionResult,
  RemoveSuggestionResult,
  StoredSuggestion,
  StoredVote,
  SuggestionFailure,
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
    if (!suggestion || suggestion.tripId !== tripId || suggestion.removed) {
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
      items.push(toItineraryView(item, suggestion));
    }
    items.sort(compareItineraryItems);
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
    if (!suggestion || suggestion.tripId !== tripId || suggestion.removed) {
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

  async scheduleItinerary(
    userId: string,
    tripId: string,
    itemId: string,
    input: { date: unknown; startTime: unknown },
  ): Promise<ScheduleItineraryResult> {
    const access = await this.itemAccess(userId, tripId, itemId);
    if (!access.ok) {
      return access;
    }
    const parsed = parseSchedule(input);
    if (!parsed.ok) {
      return parsed;
    }
    const trip = await this.trips.findById(tripId);
    if (!trip) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }
    if (parsed.date < trip.startDate || parsed.date > trip.endDate) {
      return { ok: false, status: 400, error: "Choose a date between the trip start and end." };
    }
    const next = { ...access.item, date: parsed.date, startTime: parsed.startTime };
    await this.itinerary.update(next);
    this.logger.info("itinerary item scheduled");
    const suggestion = await this.suggestions.findById(next.suggestionId);
    if (!suggestion) {
      return { ok: false, status: 404, error: "Itinerary item not found." };
    }
    return { ok: true, item: toItineraryView(next, suggestion) };
  }

  async removeItineraryItem(
    userId: string,
    tripId: string,
    itemId: string,
  ): Promise<RemoveItineraryItemResult> {
    const access = await this.itemAccess(userId, tripId, itemId);
    if (!access.ok) {
      return access;
    }
    await this.itinerary.remove(itemId);
    this.logger.info("itinerary item removed");
    return { ok: true };
  }

  private async itemAccess(
    userId: string,
    tripId: string,
    itemId: string,
  ): Promise<{ ok: true; item: StoredItineraryItem } | { ok: false; status: number; error: string }> {
    const membership = await this.trips.findMembership(tripId, userId);
    if (!membership) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }
    const item = await this.itinerary.findById(itemId);
    if (!item || item.tripId !== tripId) {
      return { ok: false, status: 404, error: "Itinerary item not found." };
    }
    return { ok: true, item };
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
    const access = await this.authorAccess(userId, tripId, suggestionId);
    if (!access.ok) {
      return access;
    }
    const parsed = parseSuggestionInput(input);
    if (!parsed.ok) {
      return parsed;
    }
    const next = {
      ...access.suggestion,
      category: parsed.category,
      name: parsed.name,
      description: parsed.description,
      address: parsed.address,
      link: parsed.link,
    };
    await this.suggestions.update(next);
    this.logger.info("suggestion updated");
    const suggestion = await this.present(next, userId);
    return suggestion ? { ok: true, suggestion } : { ok: false, status: 404, error: TRIP_NOT_FOUND };
  }

  async removeSuggestion(
    userId: string,
    tripId: string,
    suggestionId: string,
  ): Promise<RemoveSuggestionResult> {
    const access = await this.authorAccess(userId, tripId, suggestionId);
    if (!access.ok) {
      return access;
    }
    await this.suggestions.remove(suggestionId);
    this.logger.info("suggestion removed");
    return { ok: true };
  }

  private async authorAccess(
    userId: string,
    tripId: string,
    suggestionId: string,
  ): Promise<{ ok: true; suggestion: StoredSuggestion } | SuggestionFailure> {
    const membership = await this.trips.findMembership(tripId, userId);
    if (!membership) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }
    const suggestion = await this.suggestions.findById(suggestionId);
    if (!suggestion || suggestion.tripId !== tripId || suggestion.removed) {
      return { ok: false, status: 404, error: SUGGESTION_NOT_FOUND };
    }
    if (suggestion.authorId !== userId) {
      return {
        ok: false,
        status: 403,
        error: "Only the person who suggested this can change it.",
      };
    }
    return { ok: true, suggestion };
  }

  private async present(suggestion: StoredSuggestion, userId: string): Promise<SuggestionView | null> {
    const author = await this.users.findById(suggestion.authorId);
    if (!author) {
      return null;
    }
    const recorded = await this.votes.listBySuggestion(suggestion.id);
    const mine = recorded.find((vote) => vote.userId === userId);
    return {
      id: suggestion.id,
      category: suggestion.category,
      name: suggestion.name,
      description: suggestion.description,
      address: suggestion.address,
      link: suggestion.link,
      authorEmail: author.email,
      votes: countVotes(recorded),
      myVote: mine?.choice ?? null,
    };
  }
}

function toItineraryView(
  item: StoredItineraryItem,
  suggestion: { name: string; category: ItineraryItemView["category"] },
): ItineraryItemView {
  const view: ItineraryItemView = {
    id: item.id,
    suggestionId: item.suggestionId,
    name: suggestion.name,
    category: suggestion.category,
    unscheduled: item.date === undefined,
  };
  if (item.date) {
    view.date = item.date;
    view.startTime = item.startTime ?? null;
  }
  return view;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const CLOCK_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function parseSchedule(input: {
  date: unknown;
  startTime: unknown;
}): { ok: true; date: string; startTime: string | null } | { ok: false; status: 400; error: string } {
  const date = typeof input.date === "string" ? input.date.trim() : "";
  const startTime = typeof input.startTime === "string" ? input.startTime.trim() : "";
  if (!date && startTime) {
    return { ok: false, status: 400, error: "Choose a date before adding a time." };
  }
  if (!isCalendarDate(date)) {
    return { ok: false, status: 400, error: "Enter a valid date." };
  }
  if (startTime && !CLOCK_TIME.test(startTime)) {
    return { ok: false, status: 400, error: "Enter a time as HH:MM." };
  }
  return { ok: true, date, startTime: startTime || null };
}

function isCalendarDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function countVotes(votes: StoredVote[]): VoteTotals {
  const totals: VoteTotals = { yes: 0, maybe: 0, no: 0 };
  for (const vote of votes) {
    totals[vote.choice] += 1;
  }
  return totals;
}
