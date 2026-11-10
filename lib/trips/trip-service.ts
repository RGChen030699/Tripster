import type { Logger, UserStore } from "@/lib/auth/types";
import type {
  CreateTripResult,
  TripDetailsResult,
  TripListResult,
  TripStore,
} from "@/lib/trips/types";

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
    _userId: string,
    _input: {
      name: unknown;
      destination: unknown;
      startDate: unknown;
      endDate: unknown;
    },
  ): Promise<CreateTripResult> {
    this.logger.error("Not implemented");
    return { ok: false, status: 501, error: "Not implemented" };
  }

  async listTrips(_userId: string): Promise<TripListResult> {
    return { ok: true, trips: [] };
  }

  async getTrip(_userId: string, _tripId: string): Promise<TripDetailsResult> {
    return { ok: false, status: 501, error: "Not implemented" };
  }
}
