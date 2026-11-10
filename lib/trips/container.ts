import { createConsoleLogger } from "@/lib/auth/logger";
import { InMemoryUserStore } from "@/lib/auth/user-store";
import { TripService } from "@/lib/trips/trip-service";
import { InMemoryTripStore } from "@/lib/trips/trip-store";

export function getTripService(): TripService {
  return new TripService(new InMemoryTripStore(), new InMemoryUserStore(), createConsoleLogger());
}

export function resetTripService(): void {}
