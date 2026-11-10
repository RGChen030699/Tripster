import { beforeEach, describe, expect, it } from "vitest";

import { POST as register } from "@/app/api/auth/register/route";
import { POST as addMember } from "@/app/api/trips/[id]/members/route";
import { GET as getTrip } from "@/app/api/trips/[id]/route";
import { GET as listTrips, POST as createTrip } from "@/app/api/trips/route";
import { resetAuthService } from "@/lib/auth/container";
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

describe("trip member routes", () => {
  beforeEach(() => {
    resetAuthService();
    resetTripService();
  });

  it("rejects an unauthenticated request to add a member", async () => {
    const response = await addMember(
      jsonRequest("/api/trips/trip-1/members", { email: "bryce@example.com" }),
      { params: Promise.resolve({ id: "trip-1" }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
  });

  it("lets the organizer add an existing email and that person sees the trip", async () => {
    const ada = await registerUser("ada@example.com");
    const bryce = await registerUser("bryce@example.com");
    const tripId = await createLisbon(ada);

    const response = await addMember(
      jsonRequest(`/api/trips/${tripId}/members`, { email: "  Bryce@Example.com " }, ada),
      { params: Promise.resolve({ id: tripId }) },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      member: { email: "bryce@example.com", role: "member" },
    });

    const listed = await listTrips(
      new Request("http://localhost/api/trips", { headers: { cookie: bryce } }),
    );
    expect(listed.status).toBe(200);
    const listText = JSON.stringify(await listed.json());
    expect(listText).toContain(tripId);
    expect(listText).toContain("Lisbon");

    const details = await getTrip(
      new Request(`http://localhost/api/trips/${tripId}`, { headers: { cookie: bryce } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(details.status).toBe(200);
    await expect(details.json()).resolves.toMatchObject({
      trip: {
        members: [
          { email: "ada@example.com", role: "organizer" },
          { email: "bryce@example.com", role: "member" },
        ],
      },
    });
  });

  it("rejects an unknown email and a duplicate member", async () => {
    const ada = await registerUser("ada@example.com");
    const tripId = await createLisbon(ada);

    const unknown = await addMember(
      jsonRequest(`/api/trips/${tripId}/members`, { email: "missing@example.com" }, ada),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(unknown.status).toBe(404);
    await expect(unknown.json()).resolves.toEqual({
      error: "No account uses that email address.",
    });

    const invalid = await addMember(
      jsonRequest(`/api/trips/${tripId}/members`, { email: "not-an-email" }, ada),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toEqual({ error: "Enter a valid email address." });

    const added = await addMember(
      jsonRequest(`/api/trips/${tripId}/members`, { email: "ada@example.com" }, ada),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(added.status).toBe(409);
    await expect(added.json()).resolves.toEqual({
      error: "That person is already on this trip.",
    });
  });

  it("rejects a member who is not the organizer", async () => {
    const ada = await registerUser("ada@example.com");
    const bryce = await registerUser("bryce@example.com");
    await registerUser("cara@example.com");
    const tripId = await createLisbon(ada);

    const added = await addMember(
      jsonRequest(`/api/trips/${tripId}/members`, { email: "bryce@example.com" }, ada),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(added.status).toBe(201);

    const denied = await addMember(
      jsonRequest(`/api/trips/${tripId}/members`, { email: "cara@example.com" }, bryce),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(denied.status).toBe(403);
    await expect(denied.json()).resolves.toEqual({
      error: "Only the organizer can add members.",
    });
  });

  it("does not reveal trip details to someone who is not a member", async () => {
    const ada = await registerUser("ada@example.com");
    const bryce = await registerUser("bryce@example.com");
    const tripId = await createLisbon(ada);

    const hidden = await addMember(
      jsonRequest(`/api/trips/${tripId}/members`, { email: "ada@example.com" }, bryce),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(hidden.status).toBe(404);
    const text = JSON.stringify(await hidden.json());
    expect(text).toBe(JSON.stringify({ error: "Trip not found." }));
    expect(text).not.toContain("Lisbon");

    const listed = await listTrips(
      new Request("http://localhost/api/trips", { headers: { cookie: bryce } }),
    );
    expect(JSON.stringify(await listed.json())).not.toContain("Lisbon");

    const details = await getTrip(
      new Request(`http://localhost/api/trips/${tripId}`, { headers: { cookie: bryce } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(details.status).toBe(404);
    expect(JSON.stringify(await details.json())).not.toContain("Lisbon");
  });
});
