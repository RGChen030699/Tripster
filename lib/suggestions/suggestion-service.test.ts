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

  it("lets the author edit a suggestion without adding it to the itinerary", async () => {
    const { service, tripId, messages } = await setup();
    const created = await service.createSuggestion("user-1", tripId, SUGGESTION);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const edited = await service.updateSuggestion("user-1", tripId, created.suggestion.id, {
      category: "activity",
      name: "  Tram 28  ",
      description: "",
      address: " Lisbon ",
      link: "https://example.com/tram",
    });
    expect(edited).toMatchObject({
      ok: true,
      suggestion: {
        id: created.suggestion.id,
        category: "activity",
        name: "Tram 28",
        description: null,
        address: "Lisbon",
        link: "https://example.com/tram",
        authorEmail: "ada@example.com",
      },
    });
    expect(messages).toContain("suggestion updated");
    expect(messages.join(" ")).not.toContain("Tram 28");

    await expect(service.listItinerary("user-1", tripId)).resolves.toEqual({ ok: true, items: [] });
    const listed = await service.listSuggestions("user-2", tripId);
    expect(listed).toMatchObject({
      ok: true,
      suggestions: [{ id: created.suggestion.id, name: "Tram 28", category: "activity" }],
    });
  });

  it("lets the author remove a suggestion without removing its itinerary item", async () => {
    const { service, tripId } = await setup();
    const kept = await service.createSuggestion("user-1", tripId, {
      ...SUGGESTION,
      name: "Hotel",
      category: "lodging",
    });
    const created = await service.createSuggestion("user-1", tripId, SUGGESTION);
    expect(kept.ok && created.ok).toBe(true);
    if (!kept.ok || !created.ok) {
      return;
    }
    await service.vote("user-1", tripId, created.suggestion.id, "yes");
    await service.vote("user-2", tripId, kept.suggestion.id, "no");
    const added = await service.addToItinerary("user-1", tripId, created.suggestion.id);
    expect(added.ok).toBe(true);
    if (!added.ok) {
      return;
    }

    const removed = await service.removeSuggestion("user-1", tripId, created.suggestion.id);
    expect(removed).toEqual({ ok: true });

    const listed = await service.listSuggestions("user-2", tripId);
    expect(listed).toMatchObject({
      ok: true,
      suggestions: [{ id: kept.suggestion.id, votes: { yes: 0, maybe: 0, no: 1 } }],
    });
    if (listed.ok) {
      expect(listed.suggestions.map((item) => item.id)).not.toContain(created.suggestion.id);
    }

    const itinerary = await service.listItinerary("user-2", tripId);
    expect(itinerary).toMatchObject({
      ok: true,
      items: [{ id: added.item.id, suggestionId: created.suggestion.id, name: "Pastel de nata" }],
    });
  });

  it("rejects edits and removals from another member or a non-member", async () => {
    const { service, tripId } = await setup();
    const created = await service.createSuggestion("user-1", tripId, SUGGESTION);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    await expect(
      service.updateSuggestion("user-2", tripId, created.suggestion.id, SUGGESTION),
    ).resolves.toEqual({
      ok: false,
      status: 403,
      error: "Only the person who suggested this can change it.",
    });
    await expect(service.removeSuggestion("user-2", tripId, created.suggestion.id)).resolves.toEqual({
      ok: false,
      status: 403,
      error: "Only the person who suggested this can change it.",
    });

    const hidden = await service.updateSuggestion("someone-else", tripId, created.suggestion.id, SUGGESTION);
    expect(hidden).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(hidden)).not.toContain("Pastel");
    expect(JSON.stringify(hidden)).not.toContain("Lisbon");

    const hiddenRemove = await service.removeSuggestion("someone-else", tripId, created.suggestion.id);
    expect(hiddenRemove).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(hiddenRemove)).not.toContain("Pastel");
  });

  it("schedules itinerary items inside the trip and keeps unscheduled items last", async () => {
    const { service, tripId, messages } = await setup();
    const hotel = await addedItem(service, tripId, "user-1", "lodging", "Hotel");
    const tram = await addedItem(service, tripId, "user-2", "activity", "Tram 28");
    const pastel = await addedItem(service, tripId, "user-1", "restaurant", "Pastel de nata");

    const early = await service.scheduleItinerary("user-2", tripId, tram.id, {
      date: "2026-11-02",
      startTime: "09:30",
    });
    expect(early).toMatchObject({
      ok: true,
      item: {
        id: tram.id,
        name: "Tram 28",
        unscheduled: false,
        date: "2026-11-02",
        startTime: "09:30",
      },
    });
    expect(messages).toContain("itinerary item scheduled");
    expect(messages.join(" ")).not.toContain("Tram 28");

    const openDay = await service.scheduleItinerary("user-1", tripId, hotel.id, {
      date: "2026-11-01",
      startTime: "",
    });
    expect(openDay).toMatchObject({
      ok: true,
      item: { id: hotel.id, unscheduled: false, date: "2026-11-01", startTime: null },
    });

    const listed = await service.listItinerary("user-1", tripId);
    expect(listed).toMatchObject({
      ok: true,
      items: [
        { id: hotel.id, date: "2026-11-01", startTime: null, unscheduled: false },
        { id: tram.id, date: "2026-11-02", startTime: "09:30", unscheduled: false },
        { id: pastel.id, name: "Pastel de nata", unscheduled: true },
      ],
    });
    if (listed.ok) {
      expect(listed.items[2]).not.toHaveProperty("date");
      expect(listed.items[2]).not.toHaveProperty("startTime");
      expect(listed.items[2]).not.toHaveProperty("time");
    }

    const moved = await service.scheduleItinerary("user-2", tripId, tram.id, {
      date: "2026-11-05",
      startTime: "18:00",
    });
    expect(moved).toMatchObject({
      ok: true,
      item: { id: tram.id, date: "2026-11-05", startTime: "18:00" },
    });
  });

  it("rejects a schedule outside the trip range or without a valid date and time", async () => {
    const { service, tripId } = await setup();
    const hotel = await addedItem(service, tripId, "user-1", "lodging", "Hotel");

    await expect(
      service.scheduleItinerary("user-1", tripId, hotel.id, { date: "2026-10-31", startTime: "" }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Choose a date between the trip start and end.",
    });
    await expect(
      service.scheduleItinerary("user-1", tripId, hotel.id, { date: "2026-11-06", startTime: "09:00" }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Choose a date between the trip start and end.",
    });
    await expect(
      service.scheduleItinerary("user-1", tripId, hotel.id, { date: "", startTime: "09:00" }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Choose a date before adding a time.",
    });
    await expect(
      service.scheduleItinerary("user-1", tripId, hotel.id, { date: "2026-11-01", startTime: "9:30" }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Enter a time as HH:MM.",
    });

    const listed = await service.listItinerary("user-2", tripId);
    expect(listed).toMatchObject({
      ok: true,
      items: [{ id: hotel.id, unscheduled: true }],
    });
    if (listed.ok) {
      expect(listed.items[0]).not.toHaveProperty("date");
    }
  });

  it("lets a member remove an itinerary item without removing the suggestion", async () => {
    const { service, tripId, messages } = await setup();
    const hotel = await addedItem(service, tripId, "user-1", "lodging", "Hotel");
    await service.scheduleItinerary("user-1", tripId, hotel.id, { date: "2026-11-03", startTime: "" });

    const removed = await service.removeItineraryItem("user-2", tripId, hotel.id);
    expect(removed).toEqual({ ok: true });
    expect(messages).toContain("itinerary item removed");

    await expect(service.listItinerary("user-1", tripId)).resolves.toEqual({ ok: true, items: [] });
    const suggestions = await service.listSuggestions("user-2", tripId);
    expect(suggestions).toMatchObject({
      ok: true,
      suggestions: [{ name: "Hotel", category: "lodging" }],
    });

    const hidden = await service.removeItineraryItem("someone-else", tripId, hotel.id);
    expect(hidden).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(hidden)).not.toContain("Hotel");
    expect(JSON.stringify(hidden)).not.toContain("Lisbon");
  });
});

async function addedItem(
  service: SuggestionService,
  tripId: string,
  userId: string,
  category: "lodging" | "activity" | "place" | "restaurant",
  name: string,
): Promise<{ id: string }> {
  const created = await service.createSuggestion(userId, tripId, {
    category,
    name,
    description: undefined,
    address: undefined,
    link: undefined,
  });
  if (!created.ok) {
    throw new Error("suggestion setup failed");
  }
  const added = await service.addToItinerary(userId, tripId, created.suggestion.id);
  if (!added.ok) {
    throw new Error("itinerary setup failed");
  }
  return { id: added.item.id };
}
