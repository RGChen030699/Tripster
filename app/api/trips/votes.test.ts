import { beforeEach, describe, expect, it } from "vitest";

import { POST as register } from "@/app/api/auth/register/route";
import { GET as listItinerary } from "@/app/api/trips/[id]/itinerary/route";
import { POST as addMember } from "@/app/api/trips/[id]/members/route";
import { POST as createSuggestion } from "@/app/api/trips/[id]/suggestions/route";
import { GET as listSuggestions } from "@/app/api/trips/[id]/suggestions/route";
import { POST as vote } from "@/app/api/trips/[id]/suggestions/[suggestionId]/votes/route";
import { POST as createTrip } from "@/app/api/trips/route";
import { resetAuthService } from "@/lib/auth/container";
import { resetSuggestionService } from "@/lib/suggestions/container";
import { resetTripService } from "@/lib/trips/container";

const PASSWORD = "correct-horse";
const TRIP = {
  name: "Lisbon week",
  destination: "Lisbon",
  startDate: "2026-11-01",
  endDate: "2026-11-05",
};
const SUGGESTION = {
  category: "restaurant",
  name: "Pastel de nata",
  description: "A bakery stop",
  address: "Rua da Prata",
  link: "https://example.com/nata",
};

function jsonRequest(path: string, body: unknown, cookie?: string, method = "POST"): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

async function registerUser(email: string): Promise<string> {
  const response = await register(
    jsonRequest("/api/auth/register", { email, password: PASSWORD }),
  );
  return response.headers.get("set-cookie")?.split(";")[0] ?? "";
}

async function createLisbon(cookie: string): Promise<string> {
  const response = await createTrip(jsonRequest("/api/trips", TRIP, cookie));
  expect(response.status).toBe(201);
  const body = (await response.json()) as { trip: { id: string } };
  return body.trip.id;
}

async function suggest(cookie: string, tripId: string): Promise<string> {
  const response = await createSuggestion(
    jsonRequest(`/api/trips/${tripId}/suggestions`, SUGGESTION, cookie),
    { params: Promise.resolve({ id: tripId }) },
  );
  expect(response.status).toBe(201);
  const body = (await response.json()) as { suggestion: { id: string } };
  return body.suggestion.id;
}

describe("vote routes", () => {
  beforeEach(async () => {
    await resetAuthService();
    await resetTripService();
    await resetSuggestionService();
  });

  it("rejects an unauthenticated vote", async () => {
    const response = await vote(
      jsonRequest("/api/trips/trip-1/suggestions/suggestion-1/votes", { choice: "yes" }),
      { params: Promise.resolve({ id: "trip-1", suggestionId: "suggestion-1" }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
  });

  it("replaces a member's vote, shows totals, and leaves the itinerary empty", async () => {
    const ada = await registerUser("ada@example.com");
    const bryce = await registerUser("bryce@example.com");
    const tripId = await createLisbon(ada);
    const added = await addMember(
      jsonRequest(`/api/trips/${tripId}/members`, { email: "bryce@example.com" }, ada),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(added.status).toBe(201);
    const suggestionId = await suggest(ada, tripId);

    const first = await vote(
      jsonRequest(`/api/trips/${tripId}/suggestions/${suggestionId}/votes`, { choice: "yes" }, ada),
      { params: Promise.resolve({ id: tripId, suggestionId }) },
    );
    expect(first.status).toBe(200);
    await expect(first.json()).resolves.toEqual({
      vote: { choice: "yes" },
      votes: { yes: 1, maybe: 0, no: 0 },
    });

    const changed = await vote(
      jsonRequest(`/api/trips/${tripId}/suggestions/${suggestionId}/votes`, { choice: "maybe" }, ada),
      { params: Promise.resolve({ id: tripId, suggestionId }) },
    );
    expect(changed.status).toBe(200);
    await expect(changed.json()).resolves.toEqual({
      vote: { choice: "maybe" },
      votes: { yes: 0, maybe: 1, no: 0 },
    });

    const other = await vote(
      jsonRequest(`/api/trips/${tripId}/suggestions/${suggestionId}/votes`, { choice: "yes" }, bryce),
      { params: Promise.resolve({ id: tripId, suggestionId }) },
    );
    expect(other.status).toBe(200);

    const listed = await listSuggestions(
      new Request(`http://localhost/api/trips/${tripId}/suggestions`, { headers: { cookie: ada } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(listed.status).toBe(200);
    await expect(listed.json()).resolves.toMatchObject({
      suggestions: [{ myVote: "maybe", votes: { yes: 1, maybe: 1, no: 0 } }],
    });

    const itinerary = await listItinerary(
      new Request(`http://localhost/api/trips/${tripId}/itinerary`, { headers: { cookie: ada } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(itinerary.status).toBe(200);
    await expect(itinerary.json()).resolves.toEqual({ items: [] });
  });

  it("does not let a non-member vote or read totals", async () => {
    const ada = await registerUser("ada@example.com");
    const bryce = await registerUser("bryce@example.com");
    const tripId = await createLisbon(ada);
    const suggestionId = await suggest(ada, tripId);

    const hiddenVote = await vote(
      jsonRequest(`/api/trips/${tripId}/suggestions/${suggestionId}/votes`, { choice: "yes" }, bryce),
      { params: Promise.resolve({ id: tripId, suggestionId }) },
    );
    expect(hiddenVote.status).toBe(404);
    const voteText = JSON.stringify(await hiddenVote.json());
    expect(voteText).toBe(JSON.stringify({ error: "Trip not found." }));
    expect(voteText).not.toContain("Pastel");
    expect(voteText).not.toContain("Lisbon");

    const hiddenList = await listSuggestions(
      new Request(`http://localhost/api/trips/${tripId}/suggestions`, { headers: { cookie: bryce } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(hiddenList.status).toBe(404);
    expect(JSON.stringify(await hiddenList.json())).not.toContain("yes");

    const hiddenItinerary = await listItinerary(
      new Request(`http://localhost/api/trips/${tripId}/itinerary`, { headers: { cookie: bryce } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(hiddenItinerary.status).toBe(404);
    expect(JSON.stringify(await hiddenItinerary.json())).not.toContain("Lisbon");
  });
});
