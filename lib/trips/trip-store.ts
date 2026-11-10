import type { StoredMembership, StoredTrip, TripStore } from "@/lib/trips/types";

export class InMemoryTripStore implements TripStore {
  private readonly trips = new Map<string, StoredTrip>();
  private readonly memberships = new Map<string, StoredMembership>();

  async addMember(tripId: string, userId: string): Promise<void> {
    void tripId;
    void userId;
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
