import { beforeEach, describe, expect, it } from "vitest";

import { POST as register } from "@/app/api/auth/register/route";
import { GET as listItinerary } from "@/app/api/trips/[id]/itinerary/route";
import { POST as addMember } from "@/app/api/trips/[id]/members/route";
import { POST as addToItinerary } from "@/app/api/trips/[id]/suggestions/[suggestionId]/itinerary/route";
import { DELETE as removeSuggestion, PATCH as updateSuggestion } from "@/app/api/trips/[id]/suggestions/[suggestionId]/route";
import { GET as listSuggestions, POST as createSuggestion } from "@/app/api/trips/[id]/suggestions/route";
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
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function registerUser(email: string): Promise<string> {
  const response = await register(
    jsonRequest("/api/auth/register", { email, password: PASSWORD }),
  );
  return response.headers.get("set-cookie")?.split(";")[0] ?? "";
}

describe("suggestion edit routes", () => {
  beforeEach(() => {
    resetAuthService();
    resetTripService();
    resetSuggestionService();
  });

  it("rejects an unauthenticated edit", async () => {
    const response = await updateSuggestion(
      jsonRequest("/api/trips/trip-1/suggestions/suggestion-1", SUGGESTION, undefined, "PATCH"),
      { params: Promise.resolve({ id: "trip-1", suggestionId: "suggestion-1" }) },
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
  });

  it("lets the author edit and remove a suggestion", async () => {
    const ada = await registerUser("ada@example.com");
    const bryce = await registerUser("bryce@example.com");
    const createdTrip = await createTrip(jsonRequest("/api/trips", TRIP, ada));
    expect(createdTrip.status).toBe(201);
    const tripId = ((await createdTrip.json()) as { trip: { id: string } }).trip.id;
    expect(
      (
        await addMember(jsonRequest(`/api/trips/${tripId}/members`, { email: "bryce@example.com" }, ada), {
          params: Promise.resolve({ id: tripId }),
        })
      ).status,
    ).toBe(201);
    const created = await createSuggestion(
      jsonRequest(`/api/trips/${tripId}/suggestions`, SUGGESTION, ada),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(created.status).toBe(201);
    const suggestionId = ((await created.json()) as { suggestion: { id: string } }).suggestion.id;
    expect(
      (
        await vote(
          jsonRequest(`/api/trips/${tripId}/suggestions/${suggestionId}/votes`, { choice: "yes" }, ada),
          { params: Promise.resolve({ id: tripId, suggestionId }) },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await addToItinerary(
          jsonRequest(`/api/trips/${tripId}/suggestions/${suggestionId}/itinerary`, {}, ada),
          { params: Promise.resolve({ id: tripId, suggestionId }) },
        )
      ).status,
    ).toBe(201);

    const edited = await updateSuggestion(
      jsonRequest(
        `/api/trips/${tripId}/suggestions/${suggestionId}`,
        { ...SUGGESTION, name: "Custard tart", category: "activity" },
        ada,
        "PATCH",
      ),
      { params: Promise.resolve({ id: tripId, suggestionId }) },
    );
    expect(edited.status).toBe(200);
    await expect(edited.json()).resolves.toMatchObject({
      suggestion: { id: suggestionId, name: "Custard tart", category: "activity" },
    });

    const denied = await updateSuggestion(
      jsonRequest(`/api/trips/${tripId}/suggestions/${suggestionId}`, SUGGESTION, bryce, "PATCH"),
      { params: Promise.resolve({ id: tripId, suggestionId }) },
    );
    expect(denied.status).toBe(403);

    const removed = await removeSuggestion(
      new Request(`http://localhost/api/trips/${tripId}/suggestions/${suggestionId}`, {
        method: "DELETE",
        headers: { cookie: ada },
      }),
      { params: Promise.resolve({ id: tripId, suggestionId }) },
    );
    expect(removed.status).toBe(204);

    const listed = await listSuggestions(
      new Request(`http://localhost/api/trips/${tripId}/suggestions`, { headers: { cookie: bryce } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    const listText = JSON.stringify(await listed.json());
    expect(listText).not.toContain(suggestionId);
    expect(listText).not.toContain("Custard tart");

    const itinerary = await listItinerary(
      new Request(`http://localhost/api/trips/${tripId}/itinerary`, { headers: { cookie: bryce } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    await expect(itinerary.json()).resolves.toMatchObject({
      items: [{ suggestionId }],
    });
  });
});
