import { beforeEach, describe, expect, it } from "vitest";

import { resetDatabase } from "@/lib/db";
import { seedUser } from "@/lib/testing/parents";
import { InMemoryTripStore, PrismaTripStore } from "@/lib/trips/trip-store";
import type { StoredTrip } from "@/lib/trips/types";

const trip: StoredTrip = {
  id: "trip-1",
  name: "Lisbon week",
  destination: "Lisbon",
  startDate: "2026-11-01",
  endDate: "2026-11-05",
};

describe("InMemoryTripStore", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("stores a trip and records the creator as the organizer", async () => {
    const store = new InMemoryTripStore();

    await store.createWithOrganizer(trip, "user-1");

    await expect(store.listForUser("user-1")).resolves.toEqual([trip]);
    await expect(store.findById(trip.id)).resolves.toEqual(trip);
    await expect(store.findMembership(trip.id, "user-1")).resolves.toEqual({
      tripId: trip.id,
      userId: "user-1",
      role: "organizer",
    });
  });

  it("adds a member who can then see the trip", async () => {
    const store = new InMemoryTripStore();

    await store.createWithOrganizer(trip, "user-1");
    await store.addMember(trip.id, "user-2");

    await expect(store.findMembership(trip.id, "user-2")).resolves.toEqual({
      tripId: trip.id,
      userId: "user-2",
      role: "member",
    });
    await expect(store.listForUser("user-2")).resolves.toEqual([trip]);
    await expect(store.membersOf(trip.id)).resolves.toEqual([
      { tripId: trip.id, userId: "user-1", role: "organizer" },
      { tripId: trip.id, userId: "user-2", role: "member" },
    ]);
  });

  it("keeps a trip when a new store instance is created", async () => {
    await seedUser("user-1");
    const first = new PrismaTripStore();
    const second = new PrismaTripStore();

    await first.createWithOrganizer(trip, "user-1");

    await expect(second.listForUser("user-1")).resolves.toEqual([trip]);
    await expect(second.findMembership(trip.id, "user-1")).resolves.toEqual({
      tripId: trip.id,
      userId: "user-1",
      role: "organizer",
    });
  });
});
