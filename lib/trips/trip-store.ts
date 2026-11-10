import type { StoredMembership, StoredTrip, TripStore } from "@/lib/trips/types";

export class InMemoryTripStore implements TripStore {
  async createWithOrganizer(_trip: StoredTrip, _organizerId: string): Promise<void> {}

  async findById(_id: string): Promise<StoredTrip | null> {
    return null;
  }

  async listForUser(_userId: string): Promise<StoredTrip[]> {
    return [];
  }

  async findMembership(_tripId: string, _userId: string): Promise<StoredMembership | null> {
    return null;
  }

  async membersOf(_tripId: string): Promise<StoredMembership[]> {
    return [];
  }
}
