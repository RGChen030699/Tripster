import { describe, expect, it } from "vitest";

import { InMemoryUserStore } from "@/lib/auth/user-store";
import { InMemoryItineraryStore } from "@/lib/itinerary/itinerary-store";
import { SuggestionService } from "@/lib/suggestions/suggestion-service";
import { InMemorySuggestionStore } from "@/lib/suggestions/suggestion-store";
import { InMemoryVoteStore } from "@/lib/suggestions/vote-store";
import { TripService } from "@/lib/trips/trip-service";
import { InMemoryTripStore } from "@/lib/trips/trip-store";

const TRIP = {
  name: "Lisbon week",
  destination: "Lisbon",
  startDate: "2026-11-01",
  endDate: "2026-11-05",
};

const SUGGESTION = {
  category: "restaurant",
  name: "  Pastel de nata  ",
  description: " A bakery stop ",
  address: " Rua da Prata ",
  link: " https://example.com/nata ",
};

async function setup() {
  const users = new InMemoryUserStore();
  await users.create({ id: "user-1", email: "ada@example.com", passwordHash: "hashed-secret" });
  await users.create({ id: "user-2", email: "bryce@example.com", passwordHash: "hashed-secret" });
  const trips = new InMemoryTripStore();
  const tripService = new TripService(trips, users, { info() {}, error() {} });
  const created = await tripService.createTrip("user-1", TRIP);
  if (!created.ok) {
    throw new Error("trip setup failed");
  }
  await tripService.addMember("user-1", created.trip.id, "bryce@example.com");
  const messages: string[] = [];
  const service = new SuggestionService(
    new InMemorySuggestionStore(),
    new InMemoryVoteStore(),
    new InMemoryItineraryStore(),
    trips,
    users,
    {
    info(message: string) {
      messages.push(message);
    },
    error(message: string) {
      messages.push(message);
    },
  });
  return { service, tripId: created.trip.id, messages };
}

describe("SuggestionService", () => {
  it("lets a member add a categorized suggestion that other members can see", async () => {
    const { service, tripId, messages } = await setup();

    const created = await service.createSuggestion("user-1", tripId, SUGGESTION);

    expect(created).toMatchObject({
      ok: true,
      suggestion: {
        category: "restaurant",
        name: "Pastel de nata",
        description: "A bakery stop",
        address: "Rua da Prata",
        link: "https://example.com/nata",
        authorEmail: "ada@example.com",
      },
    });
    expect(messages.join(" ")).not.toContain("Pastel de nata");
    expect(messages).toContain("suggestion created");
    if (!created.ok) {
      return;
    }

    const listed = await service.listSuggestions("user-2", tripId);
    expect(listed).toMatchObject({
      ok: true,
      suggestions: [created.suggestion],
    });
  });

  it("accepts each category and stores omitted details as empty", async () => {
    const { service, tripId } = await setup();

    for (const category of ["lodging", "activity", "place", "restaurant"] as const) {
      const created = await service.createSuggestion("user-1", tripId, {
        category,
        name: category,
        description: "   ",
        address: undefined,
        link: "",
      });
      expect(created).toMatchObject({
        ok: true,
        suggestion: {
          category,
          name: category,
          description: null,
          address: null,
          link: null,
          authorEmail: "ada@example.com",
        },
      });
    }
  });

  it("rejects a missing name, an unknown category, and a bad link", async () => {
    const { service, tripId } = await setup();

    await expect(
      service.createSuggestion("user-1", tripId, { ...SUGGESTION, name: "  " }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Enter a suggestion name.",
    });

    await expect(
      service.createSuggestion("user-1", tripId, { ...SUGGESTION, category: "hotel" }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Choose a category: lodging, activity, place to visit, or restaurant.",
    });

    await expect(
      service.createSuggestion("user-1", tripId, { ...SUGGESTION, link: "notaurl" }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Enter a valid link.",
    });
  });

  it("hides suggestions from someone who is not a member", async () => {
    const { service, tripId } = await setup();
    const created = await service.createSuggestion("user-1", tripId, SUGGESTION);
    expect(created.ok).toBe(true);

    const hiddenCreate = await service.createSuggestion("someone-else", tripId, SUGGESTION);
    expect(hiddenCreate).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(hiddenCreate)).not.toContain("Pastel");
    expect(JSON.stringify(hiddenCreate)).not.toContain("Lisbon");

    const hiddenList = await service.listSuggestions("someone-else", tripId);
    expect(hiddenList).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(hiddenList)).not.toContain("Pastel");
    expect(JSON.stringify(hiddenList)).not.toContain("Lisbon");
  });

  it("keeps one current vote per member and does not create an itinerary item", async () => {
    const { service, tripId, messages } = await setup();
    const created = await service.createSuggestion("user-1", tripId, SUGGESTION);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const yes = await service.vote("user-1", tripId, created.suggestion.id, "yes");
    expect(yes).toEqual({
      ok: true,
      vote: { choice: "yes" },
      votes: { yes: 1, maybe: 0, no: 0 },
    });

    const changed = await service.vote("user-1", tripId, created.suggestion.id, "maybe");
    expect(changed).toEqual({
      ok: true,
      vote: { choice: "maybe" },
      votes: { yes: 0, maybe: 1, no: 0 },
    });

    const other = await service.vote("user-2", tripId, created.suggestion.id, "no");
    expect(other).toMatchObject({
      ok: true,
      votes: { yes: 0, maybe: 1, no: 1 },
    });

    const ada = await service.listSuggestions("user-1", tripId);
    expect(ada).toMatchObject({
      ok: true,
      suggestions: [{ id: created.suggestion.id, myVote: "maybe", votes: { yes: 0, maybe: 1, no: 1 } }],
    });
    const bryce = await service.listSuggestions("user-2", tripId);
    expect(bryce).toMatchObject({
      ok: true,
      suggestions: [{ myVote: "no" }],
    });

    await expect(service.listItinerary("user-1", tripId)).resolves.toEqual({ ok: true, items: [] });
    expect(messages).toContain("vote recorded");
    expect(messages.join(" ")).not.toContain("ada@example.com");
  });

  it("rejects a bad choice, a missing suggestion, and a non-member", async () => {
    const { service, tripId } = await setup();
    const created = await service.createSuggestion("user-1", tripId, SUGGESTION);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    await expect(service.vote("user-1", tripId, created.suggestion.id, "absolutely")).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Choose Yes, Maybe, or No.",
    });

    const missing = await service.vote("user-1", tripId, "missing-suggestion", "yes");
    expect(missing).toEqual({ ok: false, status: 404, error: "Suggestion not found." });
    expect(JSON.stringify(missing)).not.toContain("Pastel");

    const hidden = await service.vote("someone-else", tripId, created.suggestion.id, "yes");
    expect(hidden).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(hidden)).not.toContain("Pastel");
    expect(JSON.stringify(hidden)).not.toContain("Lisbon");

    const hiddenItinerary = await service.listItinerary("someone-else", tripId);
    expect(hiddenItinerary).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(hiddenItinerary)).not.toContain("Pastel");
    expect(JSON.stringify(hiddenItinerary)).not.toContain("Lisbon");
  });

  it("adds a suggestion once and leaves a voted suggestion off the itinerary", async () => {
    const { service, tripId, messages } = await setup();
    const addedSuggestion = await service.createSuggestion("user-1", tripId, SUGGESTION);
    const votedOnly = await service.createSuggestion("user-2", tripId, {
      category: "activity",
      name: "Tram 28",
      description: undefined,
      address: undefined,
      link: undefined,
    });
    expect(addedSuggestion.ok).toBe(true);
    expect(votedOnly.ok).toBe(true);
    if (!addedSuggestion.ok || !votedOnly.ok) {
      return;
    }

    const voted = await service.vote("user-1", tripId, votedOnly.suggestion.id, "yes");
    expect(voted.ok).toBe(true);
    const beforeAdd = await service.listItinerary("user-2", tripId);
    expect(beforeAdd).toEqual({ ok: true, items: [] });

    const created = await service.addToItinerary("user-2", tripId, addedSuggestion.suggestion.id);
    expect(created).toMatchObject({
      ok: true,
      created: true,
      item: {
        suggestionId: addedSuggestion.suggestion.id,
        name: "Pastel de nata",
        category: "restaurant",
        unscheduled: true,
      },
    });
    if (!created.ok) {
      return;
    }
    expect(created.item).not.toHaveProperty("date");
    expect(created.item).not.toHaveProperty("time");
    expect(messages).toContain("itinerary item added");
    expect(messages.join(" ")).not.toContain("Pastel de nata");

    const again = await service.addToItinerary("user-1", tripId, addedSuggestion.suggestion.id);
    expect(again).toMatchObject({
      ok: true,
      created: false,
      item: { id: created.item.id, suggestionId: addedSuggestion.suggestion.id },
    });

    const listed = await service.listItinerary("user-1", tripId);
    expect(listed).toEqual({
      ok: true,
      items: [
        {
          id: created.item.id,
          suggestionId: addedSuggestion.suggestion.id,
          name: "Pastel de nata",
          category: "restaurant",
          unscheduled: true,
        },
      ],
    });
    if (listed.ok) {
      expect(listed.items.map((item) => item.suggestionId)).not.toContain(votedOnly.suggestion.id);
    }
  });

  it("does not let someone outside the trip add or read the itinerary", async () => {
    const { service, tripId } = await setup();
    const created = await service.createSuggestion("user-1", tripId, SUGGESTION);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const hidden = await service.addToItinerary("someone-else", tripId, created.suggestion.id);
    expect(hidden).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(hidden)).not.toContain("Pastel");
    expect(JSON.stringify(hidden)).not.toContain("Lisbon");

    const listed = await service.listItinerary("someone-else", tripId);
    expect(listed).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(listed)).not.toContain("Pastel");
  });
});
