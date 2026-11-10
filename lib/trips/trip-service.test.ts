import { describe, expect, it } from "vitest";

import { InMemoryUserStore } from "@/lib/auth/user-store";
import { TripService } from "@/lib/trips/trip-service";
import { InMemoryTripStore } from "@/lib/trips/trip-store";

const VALID = {
  name: "  Lisbon week  ",
  destination: " Lisbon ",
  startDate: "2026-11-01",
  endDate: "2026-11-05",
};

async function createService() {
  const users = new InMemoryUserStore();
  await users.create({
    id: "user-1",
    email: "ada@example.com",
    passwordHash: "hashed-secret",
  });
  return new TripService(new InMemoryTripStore(), users, {
    info() {},
    error() {},
  });
}

describe("TripService", () => {
  it("creates a trip for the signed-in user and lists it for that user", async () => {
    const service = await createService();

    const created = await service.createTrip("user-1", VALID);

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    expect(created.trip).toMatchObject({
      name: "Lisbon week",
      destination: "Lisbon",
      startDate: "2026-11-01",
      endDate: "2026-11-05",
      role: "organizer",
    });

    const listed = await service.listTrips("user-1");
    expect(listed.trips).toEqual([created.trip]);
    await expect(service.listTrips("someone-else")).resolves.toEqual({ ok: true, trips: [] });
  });

  it("records the creator as an organizer member", async () => {
    const service = await createService();
    const created = await service.createTrip("user-1", VALID);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const details = await service.getTrip("user-1", created.trip.id);
    expect(details).toMatchObject({
      ok: true,
      trip: {
        role: "organizer",
        members: [{ email: "ada@example.com", role: "organizer" }],
      },
    });
  });

  it("rejects a missing name and an end date before the start date", async () => {
    const service = await createService();

    await expect(
      service.createTrip("user-1", { ...VALID, name: "   " }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Enter a trip name.",
    });

    await expect(
      service.createTrip("user-1", { ...VALID, destination: "" }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Enter a destination.",
    });

    await expect(
      service.createTrip("user-1", { ...VALID, endDate: "2026-10-31" }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "The end date cannot be earlier than the start date.",
    });
  });

  it("allows the end date to match the start date", async () => {
    const service = await createService();
    const created = await service.createTrip("user-1", {
      ...VALID,
      startDate: "2026-11-01",
      endDate: "2026-11-01",
    });

    expect(created).toMatchObject({
      ok: true,
      trip: { startDate: "2026-11-01", endDate: "2026-11-01" },
    });
  });

  it("hides a trip from someone who is not a member", async () => {
    const service = await createService();
    const created = await service.createTrip("user-1", VALID);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const hidden = await service.getTrip("someone-else", created.trip.id);
    expect(hidden).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(hidden)).not.toContain("Lisbon");
  });
});
