import { beforeEach, describe, expect, it } from "vitest";

import { POST as register } from "@/app/api/auth/register/route";
import { PATCH as scheduleItem, DELETE as removeItem } from "@/app/api/trips/[id]/itinerary/[itemId]/route";
import { GET as listItinerary } from "@/app/api/trips/[id]/itinerary/route";
import { POST as addMember } from "@/app/api/trips/[id]/members/route";
import { GET as listSuggestions, POST as createSuggestion } from "@/app/api/trips/[id]/suggestions/route";
import { POST as addToItinerary } from "@/app/api/trips/[id]/suggestions/[suggestionId]/itinerary/route";
import { POST as createTrip } from "@/app/api/trips/route";
import { resetAuthService } from "@/lib/auth/container";
import { resetSuggestionService } from "@/lib/suggestions/container";
import { resetTripService } from "@/lib/trips/container";

const PASSWORD = "correct-horse";

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
  const response = await register(jsonRequest("/api/auth/register", { email, password: PASSWORD }));
  return response.headers.get("set-cookie")?.split(";")[0] ?? "";
}

describe("itinerary schedule routes", () => {
  beforeEach(async () => {
    await resetAuthService();
    await resetTripService();
    await resetSuggestionService();
  });

  it("rejects an unauthenticated schedule", async () => {
    const response = await scheduleItem(
      jsonRequest("/api/trips/trip-1/itinerary/item-1", { date: "2026-11-02", startTime: "" }, undefined, "PATCH"),
      { params: Promise.resolve({ id: "trip-1", itemId: "item-1" }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
  });

  it("schedules an item for a member and leaves the suggestion in place after removal", async () => {
    const ada = await registerUser("ada@example.com");
    const bryce = await registerUser("bryce@example.com");
    const createdTrip = await createTrip(
      jsonRequest(
        "/api/trips",
        {
          name: "Lisbon week",
          destination: "Lisbon",
          startDate: "2026-11-01",
          endDate: "2026-11-05",
        },
        ada,
      ),
    );
    const tripId = ((await createdTrip.json()) as { trip: { id: string } }).trip.id;
    await addMember(jsonRequest(`/api/trips/${tripId}/members`, { email: "bryce@example.com" }, ada), {
      params: Promise.resolve({ id: tripId }),
    });
    const suggested = await createSuggestion(
      jsonRequest(`/api/trips/${tripId}/suggestions`, { category: "activity", name: "Tram 28" }, ada),
      { params: Promise.resolve({ id: tripId }) },
    );
    const suggestionId = ((await suggested.json()) as { suggestion: { id: string } }).suggestion.id;
    const added = await addToItinerary(
      jsonRequest(`/api/trips/${tripId}/suggestions/${suggestionId}/itinerary`, {}, bryce),
      { params: Promise.resolve({ id: tripId, suggestionId }) },
    );
    expect(added.status).toBe(201);
    const itemId = ((await added.json()) as { item: { id: string } }).item.id;

    const scheduled = await scheduleItem(
      jsonRequest(
        `/api/trips/${tripId}/itinerary/${itemId}`,
        { date: "2026-11-02", startTime: "09:30" },
        bryce,
        "PATCH",
      ),
      { params: Promise.resolve({ id: tripId, itemId }) },
    );
    expect(scheduled.status).toBe(200);
    await expect(scheduled.json()).resolves.toMatchObject({
      item: { id: itemId, date: "2026-11-02", startTime: "09:30", unscheduled: false },
    });

    const outsider = await scheduleItem(
      jsonRequest(
        `/api/trips/${tripId}/itinerary/${itemId}`,
        { date: "2026-11-03", startTime: "" },
        "tripster_session=someone",
        "PATCH",
      ),
      { params: Promise.resolve({ id: tripId, itemId }) },
    );
    expect(outsider.status).toBe(401);

    const removed = await removeItem(
      new Request(`http://localhost/api/trips/${tripId}/itinerary/${itemId}`, {
        method: "DELETE",
        headers: { cookie: ada },
      }),
      { params: Promise.resolve({ id: tripId, itemId }) },
    );
    expect(removed.status).toBe(204);

    const listed = await listItinerary(
      new Request(`http://localhost/api/trips/${tripId}/itinerary`, { headers: { cookie: bryce } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    await expect(listed.json()).resolves.toEqual({ items: [] });

    const suggestions = await listSuggestions(
      new Request(`http://localhost/api/trips/${tripId}/suggestions`, { headers: { cookie: ada } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    const suggestionBody = (await suggestions.json()) as { suggestions: Array<{ id: string }> };
    expect(suggestionBody.suggestions.map((suggestion) => suggestion.id)).toContain(suggestionId);
  });
});
