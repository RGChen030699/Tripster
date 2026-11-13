import { beforeEach, describe, expect, it } from "vitest";

import { POST as register } from "@/app/api/auth/register/route";
import { GET as listItinerary } from "@/app/api/trips/[id]/itinerary/route";
import { POST as addMember } from "@/app/api/trips/[id]/members/route";
import { POST as addToItinerary } from "@/app/api/trips/[id]/suggestions/[suggestionId]/itinerary/route";
import { POST as createSuggestion } from "@/app/api/trips/[id]/suggestions/route";
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

function jsonRequest(path: string, body: unknown, cookie?: string, method = "POST"): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
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

async function suggest(cookie: string, tripId: string, name: string, category: string): Promise<string> {
  const response = await createSuggestion(
    jsonRequest(`/api/trips/${tripId}/suggestions`, { category, name }, cookie),
    { params: Promise.resolve({ id: tripId }) },
  );
  expect(response.status).toBe(201);
  const body = (await response.json()) as { suggestion: { id: string } };
  return body.suggestion.id;
}

describe("itinerary routes", () => {
  beforeEach(async () => {
    await resetAuthService();
    await resetTripService();
    await resetSuggestionService();
  });

  it("rejects an unauthenticated add", async () => {
    const response = await addToItinerary(
      jsonRequest("/api/trips/trip-1/suggestions/suggestion-1/itinerary", {}),
      { params: Promise.resolve({ id: "trip-1", suggestionId: "suggestion-1" }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
  });

  it("adds a suggestion once and ignores a Yes vote on another suggestion", async () => {
    const ada = await registerUser("ada@example.com");
    const bryce = await registerUser("bryce@example.com");
    const tripId = await createLisbon(ada);
    const addedMember = await addMember(
      jsonRequest(`/api/trips/${tripId}/members`, { email: "bryce@example.com" }, ada),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(addedMember.status).toBe(201);
    const pastelId = await suggest(ada, tripId, "Pastel de nata", "restaurant");
    const tramId = await suggest(bryce, tripId, "Tram 28", "activity");

    const voted = await vote(
      jsonRequest(`/api/trips/${tripId}/suggestions/${tramId}/votes`, { choice: "yes" }, ada),
      { params: Promise.resolve({ id: tripId, suggestionId: tramId }) },
    );
    expect(voted.status).toBe(200);

    const first = await addToItinerary(
      jsonRequest(`/api/trips/${tripId}/suggestions/${pastelId}/itinerary`, {}, bryce),
      { params: Promise.resolve({ id: tripId, suggestionId: pastelId }) },
    );
    expect(first.status).toBe(201);
    const created = (await first.json()) as { item: { id: string; suggestionId: string; unscheduled: boolean } };
    expect(created.item).toMatchObject({
      suggestionId: pastelId,
      name: "Pastel de nata",
      category: "restaurant",
      unscheduled: true,
    });
    expect(created.item).not.toHaveProperty("date");
    expect(created.item).not.toHaveProperty("time");

    const second = await addToItinerary(
      jsonRequest(`/api/trips/${tripId}/suggestions/${pastelId}/itinerary`, {}, ada),
      { params: Promise.resolve({ id: tripId, suggestionId: pastelId }) },
    );
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject({
      item: { id: created.item.id, suggestionId: pastelId },
    });

    const listed = await listItinerary(
      new Request(`http://localhost/api/trips/${tripId}/itinerary`, { headers: { cookie: ada } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(listed.status).toBe(200);
    const body = (await listed.json()) as { items: { suggestionId: string }[] };
    expect(body.items.map((item) => item.suggestionId)).toEqual([pastelId]);
  });

  it("does not let a non-member add or read the itinerary", async () => {
    const ada = await registerUser("ada@example.com");
    const bryce = await registerUser("bryce@example.com");
    const tripId = await createLisbon(ada);
    const pastelId = await suggest(ada, tripId, "Pastel de nata", "restaurant");

    const hiddenAdd = await addToItinerary(
      jsonRequest(`/api/trips/${tripId}/suggestions/${pastelId}/itinerary`, {}, bryce),
      { params: Promise.resolve({ id: tripId, suggestionId: pastelId }) },
    );
    expect(hiddenAdd.status).toBe(404);
    const addText = JSON.stringify(await hiddenAdd.json());
    expect(addText).toBe(JSON.stringify({ error: "Trip not found." }));
    expect(addText).not.toContain("Pastel");
    expect(addText).not.toContain("Lisbon");

    const hiddenList = await listItinerary(
      new Request(`http://localhost/api/trips/${tripId}/itinerary`, { headers: { cookie: bryce } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(hiddenList.status).toBe(404);
    expect(JSON.stringify(await hiddenList.json())).not.toContain("Pastel");
  });
});
