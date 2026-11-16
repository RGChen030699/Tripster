import { randomUUID } from "node:crypto";

import type { Logger, UserStore } from "@/lib/auth/types";
import type {
  AddMemberResult,
  CreateTripResult,
  DeleteTripResult,
  RemoveMemberResult,
  StoredTrip,
  TripDetails,
  TripDetailsResult,
  TripListResult,
  TripMemberView,
  TripRole,
  TripStore,
  TripSummary,
  UpdateMemberRoleResult,
  UpdateTripResult,
} from "@/lib/trips/types";
import { parseMemberEmail, parseTripInput } from "@/lib/trips/validation";

const TRIP_NOT_FOUND = "Trip not found.";
const UNKNOWN_EMAIL = "No account uses that email address.";
const ALREADY_MEMBER = "That person is already invited to this trip.";
const ORGANIZER_ONLY = "Only the organizer can invite members.";
const ORGANIZER_MANAGE = "Only the organizer can manage this trip.";
const ORGANIZER_ROLE = "Only the organizer can change member roles.";
const ORGANIZER_REMOVE = "Only the organizer can remove members.";
const NOT_A_MEMBER = "That person is not on this trip.";
const LAST_ORGANIZER = "Keep at least one organizer on the trip.";

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

  async addMember(userId: string, tripId: string, email: unknown): Promise<AddMemberResult> {
    const trip = await this.trips.findById(tripId);
    const membership = trip ? await this.trips.findMembership(tripId, userId) : null;
    if (!trip || !membership) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }
    if (membership.role !== "organizer") {
      return { ok: false, status: 403, error: ORGANIZER_ONLY };
    }

    const parsed = parseMemberEmail(email);
    if (!parsed.ok) {
      return parsed;
    }
    const user = await this.users.findByEmail(parsed.email);
    if (!user) {
      return { ok: false, status: 404, error: UNKNOWN_EMAIL };
    }
    const existing = await this.trips.findMembership(tripId, user.id);
    if (existing) {
      return { ok: false, status: 409, error: ALREADY_MEMBER };
    }

    await this.trips.addMember(tripId, user.id);
    this.logger.info("member added");
    return { ok: true, member: { email: user.email, role: "member" } };
  }

  async updateTrip(
    userId: string,
    tripId: string,
    input: {
      name: unknown;
      destination: unknown;
      startDate: unknown;
      endDate: unknown;
    },
  ): Promise<UpdateTripResult> {
    const access = await this.requireOrganizer(userId, tripId, ORGANIZER_MANAGE);
    if (!access.ok) {
      return access;
    }
    const parsed = parseTripInput(input);
    if (!parsed.ok) {
      return parsed;
    }
    const updated: StoredTrip = {
      id: tripId,
      name: parsed.name,
      destination: parsed.destination,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
    };
    await this.trips.updateTrip(updated);
    this.logger.info("trip updated");
    return this.getTrip(userId, tripId);
  }

  async deleteTrip(userId: string, tripId: string): Promise<DeleteTripResult> {
    const access = await this.requireOrganizer(userId, tripId, ORGANIZER_MANAGE);
    if (!access.ok) {
      return access;
    }
    await this.trips.deleteTrip(tripId);
    this.logger.info("trip deleted");
    return { ok: true };
  }

  async setMemberRole(
    userId: string,
    tripId: string,
    email: unknown,
    role: unknown,
  ): Promise<UpdateMemberRoleResult> {
    const access = await this.requireOrganizer(userId, tripId, ORGANIZER_ROLE);
    if (!access.ok) {
      return access;
    }
    const parsed = parseMemberEmail(email);
    if (!parsed.ok) {
      return parsed;
    }
    const nextRole = parseTripRole(role);
    if (!nextRole.ok) {
      return nextRole;
    }
    const user = await this.users.findByEmail(parsed.email);
    if (!user) {
      return { ok: false, status: 404, error: UNKNOWN_EMAIL };
    }
    const membership = await this.trips.findMembership(tripId, user.id);
    if (!membership) {
      return { ok: false, status: 404, error: NOT_A_MEMBER };
    }
    if (membership.role === "organizer" && nextRole.role === "member") {
      const organizers = await this.organizerCount(tripId);
      if (organizers <= 1) {
        return { ok: false, status: 400, error: LAST_ORGANIZER };
      }
    }
    await this.trips.setMemberRole(tripId, user.id, nextRole.role);
    this.logger.info("member role updated");
    return { ok: true, member: { email: user.email, role: nextRole.role } };
  }

  async removeMember(userId: string, tripId: string, email: unknown): Promise<RemoveMemberResult> {
    const access = await this.requireOrganizer(userId, tripId, ORGANIZER_REMOVE);
    if (!access.ok) {
      return access;
    }
    const parsed = parseMemberEmail(email);
    if (!parsed.ok) {
      return parsed;
    }
    const user = await this.users.findByEmail(parsed.email);
    if (!user) {
      return { ok: false, status: 404, error: UNKNOWN_EMAIL };
    }
    const membership = await this.trips.findMembership(tripId, user.id);
    if (!membership) {
      return { ok: false, status: 404, error: NOT_A_MEMBER };
    }
    if (membership.role === "organizer") {
      const organizers = await this.organizerCount(tripId);
      if (organizers <= 1) {
        return { ok: false, status: 400, error: LAST_ORGANIZER };
      }
    }
    await this.trips.removeMember(tripId, user.id);
    this.logger.info("member removed");
    return { ok: true };
  }

  private async organizerCount(tripId: string): Promise<number> {
    const members = await this.trips.membersOf(tripId);
    return members.filter((member) => member.role === "organizer").length;
  }

  private async requireOrganizer(
    userId: string,
    tripId: string,
    organizerError: string,
  ): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
    const trip = await this.trips.findById(tripId);
    const membership = trip ? await this.trips.findMembership(tripId, userId) : null;
    if (!trip || !membership) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }
    if (membership.role !== "organizer") {
      return { ok: false, status: 403, error: organizerError };
    }
    return { ok: true };
  }
}

function parseTripRole(
  role: unknown,
): { ok: true; role: TripRole } | { ok: false; status: 400; error: string } {
  if (role === "organizer" || role === "member") {
    return { ok: true, role };
  }
  return { ok: false, status: 400, error: "Choose organizer or member." };
}
