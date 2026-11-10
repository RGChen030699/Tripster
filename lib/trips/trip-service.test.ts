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

  it("lets the organizer add an existing email and that person sees the trip", async () => {
    const users = new InMemoryUserStore();
    await users.create({ id: "user-1", email: "ada@example.com", passwordHash: "hashed-secret" });
    await users.create({ id: "user-2", email: "bryce@example.com", passwordHash: "hashed-secret" });
    const messages: string[] = [];
    const service = new TripService(new InMemoryTripStore(), users, {
      info(message: string) {
        messages.push(message);
      },
      error(message: string) {
        messages.push(message);
      },
    });
    const created = await service.createTrip("user-1", VALID);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const added = await service.addMember("user-1", created.trip.id, "  Bryce@Example.com ");

    expect(added).toEqual({
      ok: true,
      member: { email: "bryce@example.com", role: "member" },
    });
    expect(messages.join(" ")).not.toContain("bryce@example.com");
    expect(messages).toContain("member added");

    await expect(service.listTrips("user-2")).resolves.toEqual({
      ok: true,
      trips: [{ ...created.trip, role: "member" }],
    });
    const details = await service.getTrip("user-2", created.trip.id);
    expect(details).toMatchObject({
      ok: true,
      trip: {
        destination: "Lisbon",
        role: "member",
        members: [
          { email: "ada@example.com", role: "organizer" },
          { email: "bryce@example.com", role: "member" },
        ],
      },
    });
  });

  it("rejects an unknown email, a duplicate member, and a non-organizer", async () => {
    const users = new InMemoryUserStore();
    await users.create({ id: "user-1", email: "ada@example.com", passwordHash: "hashed-secret" });
    await users.create({ id: "user-2", email: "bryce@example.com", passwordHash: "hashed-secret" });
    await users.create({ id: "user-3", email: "cara@example.com", passwordHash: "hashed-secret" });
    const trips = new InMemoryTripStore();
    const service = new TripService(trips, users, { info() {}, error() {} });
    const created = await service.createTrip("user-1", VALID);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    await expect(service.addMember("user-1", created.trip.id, "missing@example.com")).resolves.toEqual({
      ok: false,
      status: 404,
      error: "No account uses that email address.",
    });

    await expect(service.addMember("user-1", created.trip.id, "not-an-email")).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Enter a valid email address.",
    });

    const added = await service.addMember("user-1", created.trip.id, "bryce@example.com");
    expect(added.ok).toBe(true);
    await expect(service.addMember("user-1", created.trip.id, "bryce@example.com")).resolves.toEqual({
      ok: false,
      status: 409,
      error: "That person is already on this trip.",
    });
    await expect(service.addMember("user-1", created.trip.id, "ada@example.com")).resolves.toEqual({
      ok: false,
      status: 409,
      error: "That person is already on this trip.",
    });

    await trips.addMember(created.trip.id, "user-2");
    const denied = await service.addMember("user-2", created.trip.id, "cara@example.com");
    expect(denied).toEqual({
      ok: false,
      status: 403,
      error: "Only the organizer can add members.",
    });
    expect(JSON.stringify(denied)).not.toContain("Lisbon");

    const hidden = await service.addMember("someone-else", created.trip.id, "cara@example.com");
    expect(hidden).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(hidden)).not.toContain("Lisbon");
    expect(JSON.stringify(hidden)).not.toContain("cara@example.com");
  });
});
