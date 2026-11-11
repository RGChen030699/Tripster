export type TripRole = "organizer" | "member";

export type StoredTrip = {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
};

export type StoredMembership = {
  tripId: string;
  userId: string;
  role: TripRole;
};

export type TripSummary = {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  role: TripRole;
};

export type TripMemberView = {
  email: string;
  role: TripRole;
};

export type TripDetails = TripSummary & {
  members: TripMemberView[];
};

export type TripFailure = {
  ok: false;
  status: number;
  error: string;
};

export type CreateTripResult = { ok: true; trip: TripSummary } | TripFailure;

export type TripDetailsResult = { ok: true; trip: TripDetails } | TripFailure;

export type TripListResult = { ok: true; trips: TripSummary[] };

export type AddMemberResult = { ok: true; member: TripMemberView } | TripFailure;

export interface TripStore {
  createWithOrganizer(trip: StoredTrip, organizerId: string): Promise<void>;
  addMember(tripId: string, userId: string): Promise<void>;
  findById(id: string): Promise<StoredTrip | null>;
  listForUser(userId: string): Promise<StoredTrip[]>;
  findMembership(tripId: string, userId: string): Promise<StoredMembership | null>;
  membersOf(tripId: string): Promise<StoredMembership[]>;
}
