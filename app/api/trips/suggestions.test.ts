import { beforeEach, describe, expect, it } from "vitest";

import { POST as register } from "@/app/api/auth/register/route";
import { POST as addMember } from "@/app/api/trips/[id]/members/route";
import { GET as listSuggestions, POST as createSuggestion } from "@/app/api/trips/[id]/suggestions/route";
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

describe("suggestion routes", () => {
  beforeEach(async () => {
    await resetAuthService();
    await resetTripService();
    await resetSuggestionService();
  });

  it("rejects an unauthenticated suggestion", async () => {
    const response = await createSuggestion(
      jsonRequest("/api/trips/trip-1/suggestions", SUGGESTION),
      { params: Promise.resolve({ id: "trip-1" }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
  });

  it("lets a member create a suggestion that other members can list", async () => {
    const ada = await registerUser("ada@example.com");
    const bryce = await registerUser("bryce@example.com");
    const tripId = await createLisbon(ada);
    const added = await addMember(
      jsonRequest(`/api/trips/${tripId}/members`, { email: "bryce@example.com" }, ada),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(added.status).toBe(201);

    const response = await createSuggestion(
      jsonRequest(`/api/trips/${tripId}/suggestions`, SUGGESTION, ada),
      { params: Promise.resolve({ id: tripId }) },
    );

    expect(response.status).toBe(201);
    const body = (await response.json()) as { suggestion: { id: string; authorEmail: string } };
    expect(body.suggestion).toMatchObject({
      ...SUGGESTION,
      authorEmail: "ada@example.com",
    });

    const listed = await listSuggestions(
      new Request(`http://localhost/api/trips/${tripId}/suggestions`, {
        headers: { cookie: bryce },
      }),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(listed.status).toBe(200);
    await expect(listed.json()).resolves.toMatchObject({
      suggestions: [{ id: body.suggestion.id, authorEmail: "ada@example.com", name: "Pastel de nata" }],
    });
  });

  it("rejects an unknown category", async () => {
    const ada = await registerUser("ada@example.com");
    const tripId = await createLisbon(ada);
    const response = await createSuggestion(
      jsonRequest(`/api/trips/${tripId}/suggestions`, { ...SUGGESTION, category: "hotel" }, ada),
      { params: Promise.resolve({ id: tripId }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Choose a category: lodging, activity, place to visit, or restaurant.",
    });
  });

  it("does not reveal suggestions to someone outside the trip", async () => {
    const ada = await registerUser("ada@example.com");
    const bryce = await registerUser("bryce@example.com");
    const tripId = await createLisbon(ada);
    const created = await createSuggestion(
      jsonRequest(`/api/trips/${tripId}/suggestions`, SUGGESTION, ada),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(created.status).toBe(201);

    const hiddenList = await listSuggestions(
      new Request(`http://localhost/api/trips/${tripId}/suggestions`, {
        headers: { cookie: bryce },
      }),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(hiddenList.status).toBe(404);
    const listText = JSON.stringify(await hiddenList.json());
    expect(listText).toBe(JSON.stringify({ error: "Trip not found." }));
    expect(listText).not.toContain("Pastel");
    expect(listText).not.toContain("Lisbon");

    const hiddenCreate = await createSuggestion(
      jsonRequest(`/api/trips/${tripId}/suggestions`, SUGGESTION, bryce),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(hiddenCreate.status).toBe(404);
    const createText = JSON.stringify(await hiddenCreate.json());
    expect(createText).not.toContain("Pastel");
    expect(createText).not.toContain("Lisbon");
  });
});
