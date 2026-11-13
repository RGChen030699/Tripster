import { beforeEach, describe, expect, it } from "vitest";

import { POST as register } from "@/app/api/auth/register/route";
import { GET as getTrip } from "@/app/api/trips/[id]/route";
import { GET as listTrips, POST as createTrip } from "@/app/api/trips/route";
import { resetAuthService } from "@/lib/auth/container";
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
    body: JSON.stringify(body),
  });
}

async function registerUser(email: string): Promise<string> {
  const response = await register(
    jsonRequest("/api/auth/register", { email, password: PASSWORD }),
  );
  return response.headers.get("set-cookie")?.split(";")[0] ?? "";
}

describe("trip routes", () => {
  beforeEach(async () => {
    await resetAuthService();
    await resetTripService();
  });

  it("rejects an unauthenticated create", async () => {
    const response = await createTrip(
      jsonRequest("/api/trips", {
        name: "Lisbon week",
        destination: "Lisbon",
        startDate: "2026-11-01",
        endDate: "2026-11-05",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
  });

  it("creates a trip for the signed-in user and lists it", async () => {
    const cookie = await registerUser("ada@example.com");
    const response = await createTrip(
      jsonRequest("/api/trips", {
        name: "Lisbon week",
        destination: "Lisbon",
        startDate: "2026-11-01",
        endDate: "2026-11-05",
      }, cookie),
    );

    expect(response.status).toBe(201);
    const body = (await response.json()) as { trip: { id: string; role: string; name: string } };
    expect(body.trip).toMatchObject({
      name: "Lisbon week",
      destination: "Lisbon",
      startDate: "2026-11-01",
      endDate: "2026-11-05",
      role: "organizer",
    });

    const listed = await listTrips(
      new Request("http://localhost/api/trips", { headers: { cookie } }),
    );
    expect(listed.status).toBe(200);
    const listBody = (await listed.json()) as { trips: { id: string }[] };
    expect(listBody.trips.map((trip) => trip.id)).toEqual([body.trip.id]);

    const details = await getTrip(
      new Request(`http://localhost/api/trips/${body.trip.id}`, { headers: { cookie } }),
      { params: Promise.resolve({ id: body.trip.id }) },
    );
    expect(details.status).toBe(200);
    await expect(details.json()).resolves.toMatchObject({
      trip: {
        id: body.trip.id,
        members: [{ email: "ada@example.com", role: "organizer" }],
      },
    });
  });

  it("rejects an end date before the start date", async () => {
    const cookie = await registerUser("ada@example.com");
    const response = await createTrip(
      jsonRequest("/api/trips", {
        name: "Lisbon week",
        destination: "Lisbon",
        startDate: "2026-11-05",
        endDate: "2026-11-01",
      }, cookie),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "The end date cannot be earlier than the start date.",
    });
  });

  it("does not show another user's trip details", async () => {
    const ada = await registerUser("ada@example.com");
    const created = await createTrip(
      jsonRequest("/api/trips", {
        name: "Lisbon week",
        destination: "Lisbon",
        startDate: "2026-11-01",
        endDate: "2026-11-05",
      }, ada),
    );
    expect(created.status).toBe(201);
    const trip = (await created.json()) as { trip: { id: string } };
    const bryce = await registerUser("bryce@example.com");

    const hidden = await getTrip(
      new Request(`http://localhost/api/trips/${trip.trip.id}`, { headers: { cookie: bryce } }),
      { params: Promise.resolve({ id: trip.trip.id }) },
    );
    expect(hidden.status).toBe(404);
    const text = JSON.stringify(await hidden.json());
    expect(text).not.toContain("Lisbon");

    const list = await listTrips(
      new Request("http://localhost/api/trips", { headers: { cookie: bryce } }),
    );
    const listText = JSON.stringify(await list.json());
    expect(listText).not.toContain("Lisbon");
  });
});
