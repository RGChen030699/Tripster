import { randomUUID } from "node:crypto";

import type { Logger, UserStore } from "@/lib/auth/types";
import type {
  CreateTripResult,
  StoredTrip,
  TripDetails,
  TripDetailsResult,
  TripListResult,
  TripMemberView,
  TripStore,
  TripSummary,
} from "@/lib/trips/types";
import { parseTripInput } from "@/lib/trips/validation";

const TRIP_NOT_FOUND = "Trip not found.";

export class TripService {
  private readonly trips: TripStore;
  private readonly users: UserStore;
  private readonly logger: Logger;

  constructor(trips: TripStore, users: UserStore, logger: Logger) {
    this.trips = trips;
    this.users = users;
    this.logger = logger;
  }

  async createTrip(
    userId: string,
    input: {
      name: unknown;
      destination: unknown;
      startDate: unknown;
      endDate: unknown;
    },
  ): Promise<CreateTripResult> {
    const parsed = parseTripInput(input);
    if (!parsed.ok) {
      return parsed;
    }

    const trip: StoredTrip = {
      id: randomUUID(),
      name: parsed.name,
      destination: parsed.destination,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
    };
    await this.trips.createWithOrganizer(trip, userId);
    this.logger.info("trip created");
    return { ok: true, trip: { ...trip, role: "organizer" } };
  }

  async listTrips(userId: string): Promise<TripListResult> {
    const stored = await this.trips.listForUser(userId);
    const trips: TripSummary[] = [];
    for (const trip of stored) {
      const membership = await this.trips.findMembership(trip.id, userId);
      trips.push({ ...trip, role: membership?.role ?? "member" });
    }
    return { ok: true, trips };
  }

  async getTrip(userId: string, tripId: string): Promise<TripDetailsResult> {
    const trip = await this.trips.findById(tripId);
    const membership = trip ? await this.trips.findMembership(tripId, userId) : null;
    if (!trip || !membership) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }

    const storedMembers = await this.trips.membersOf(tripId);
    const members: TripMemberView[] = [];
    for (const member of storedMembers) {
      const user = await this.users.findById(member.userId);
      if (!user) {
        continue;
      }
      members.push({ email: user.email, role: member.role });
    }

    const details: TripDetails = { ...trip, role: membership.role, members };
    return { ok: true, trip: details };
  }
}
