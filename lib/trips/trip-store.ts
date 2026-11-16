import { getPrisma } from "@/lib/db";
import type { StoredMembership, StoredTrip, TripRole, TripStore } from "@/lib/trips/types";

export class InMemoryTripStore implements TripStore {
  private readonly trips = new Map<string, StoredTrip>();
  private readonly memberships = new Map<string, StoredMembership>();

  async addMember(tripId: string, userId: string): Promise<void> {
    const key = membershipKey(tripId, userId);
    if (this.memberships.has(key)) {
      return;
    }
    this.memberships.set(key, { tripId, userId, role: "member" });
  }

  async createWithOrganizer(trip: StoredTrip, organizerId: string): Promise<void> {
    const stored = cloneTrip(trip);
    this.trips.set(stored.id, stored);
    this.memberships.set(membershipKey(stored.id, organizerId), {
      tripId: stored.id,
      userId: organizerId,
      role: "organizer",
    });
  }

  async findById(id: string): Promise<StoredTrip | null> {
    const trip = this.trips.get(id);
    return trip ? cloneTrip(trip) : null;
  }

  async listForUser(userId: string): Promise<StoredTrip[]> {
    const trips: StoredTrip[] = [];
    for (const membership of this.memberships.values()) {
      if (membership.userId !== userId) {
        continue;
      }
      const trip = this.trips.get(membership.tripId);
      if (trip) {
        trips.push(cloneTrip(trip));
      }
    }
    return trips;
  }

  async findMembership(tripId: string, userId: string): Promise<StoredMembership | null> {
    const membership = this.memberships.get(membershipKey(tripId, userId));
    return membership ? cloneMembership(membership) : null;
  }

  async membersOf(tripId: string): Promise<StoredMembership[]> {
    const members: StoredMembership[] = [];
    for (const membership of this.memberships.values()) {
      if (membership.tripId === tripId) {
        members.push(cloneMembership(membership));
      }
    }
    return members;
  }
}

function membershipKey(tripId: string, userId: string): string {
  return `${tripId}\u0000${userId}`;
}

function cloneTrip(trip: StoredTrip): StoredTrip {
  return {
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
  };
}

function cloneMembership(membership: StoredMembership): StoredMembership {
  return {
    tripId: membership.tripId,
    userId: membership.userId,
    role: membership.role,
  };
}

export class PrismaTripStore implements TripStore {
  async addMember(tripId: string, userId: string): Promise<void> {
    const existing = await getPrisma().membership.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (existing) {
      return;
    }
    await getPrisma().membership.create({ data: { tripId, userId, role: "member" } });
  }

  async createWithOrganizer(trip: StoredTrip, organizerId: string): Promise<void> {
    const prisma = getPrisma();
    await prisma.$transaction(async (tx) => {
      await tx.trip.create({
        data: {
          id: trip.id,
          name: trip.name,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
        },
      });
      await tx.membership.create({
        data: { tripId: trip.id, userId: organizerId, role: "organizer" },
      });
    });
  }

  async findById(id: string): Promise<StoredTrip | null> {
    const trip = await getPrisma().trip.findUnique({ where: { id } });
    return trip ? toTrip(trip) : null;
  }

  async listForUser(userId: string): Promise<StoredTrip[]> {
    const memberships = await getPrisma().membership.findMany({
      where: { userId },
      orderBy: { trip: { createdAt: "asc" } },
      include: { trip: true },
    });
    return memberships.map((membership) => toTrip(membership.trip));
  }

  async findMembership(tripId: string, userId: string): Promise<StoredMembership | null> {
    const membership = await getPrisma().membership.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    return membership ? toMembership(membership) : null;
  }

  async membersOf(tripId: string): Promise<StoredMembership[]> {
    const memberships = await getPrisma().membership.findMany({
      where: { tripId },
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    });
    return memberships.map(toMembership);
  }
}

function toTrip(trip: {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
}): StoredTrip {
  return {
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
  };
}

function toMembership(membership: { tripId: string; userId: string; role: string }): StoredMembership {
  return {
    tripId: membership.tripId,
    userId: membership.userId,
    role: membership.role as TripRole,
  };
}
