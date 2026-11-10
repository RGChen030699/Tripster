import { AuthService } from "@/lib/auth/auth-service";
import { createConsoleLogger } from "@/lib/auth/logger";
import { InMemorySessionStore } from "@/lib/auth/session-store";
import { InMemoryUserStore } from "@/lib/auth/user-store";
import { SuggestionService } from "@/lib/suggestions/suggestion-service";
import { InMemorySuggestionStore } from "@/lib/suggestions/suggestion-store";
import { TripService } from "@/lib/trips/trip-service";
import { InMemoryTripStore } from "@/lib/trips/trip-store";

const APP_STATE_KEY = "__tripsterAppState";

type AppState = {
  auth: AuthService;
  trips: TripService;
  suggestions: SuggestionService;
};

export function getAuthService(): AuthService {
  return getAppState().auth;
}

export function getTripService(): TripService {
  return getAppState().trips;
}

export function getSuggestionService(): SuggestionService {
  return getAppState().suggestions;
}

export function resetAppState(): void {
  writeAppState(createAppState());
}

function getAppState(): AppState {
  const existing = readAppState();
  if (existing) {
    return existing;
  }
  const created = createAppState();
  writeAppState(created);
  return created;
}

function createAppState(): AppState {
  const users = new InMemoryUserStore();
  const trips = new InMemoryTripStore();
  const logger = createConsoleLogger();
  return {
    auth: new AuthService(users, new InMemorySessionStore(), logger),
    trips: new TripService(trips, users, logger),
    suggestions: new SuggestionService(new InMemorySuggestionStore(), trips, users, logger),
  };
}

function readAppState(): AppState | undefined {
  const value = Reflect.get(globalThis, APP_STATE_KEY);
  return isAppState(value) ? value : undefined;
}

function writeAppState(state: AppState): void {
  Reflect.set(globalThis, APP_STATE_KEY, state);
}

function isAppState(value: unknown): value is AppState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as { auth?: unknown; trips?: unknown; suggestions?: unknown };
  return isAuthService(candidate.auth) && isTripService(candidate.trips) && isSuggestionService(candidate.suggestions);
}

function isAuthService(value: unknown): value is AuthService {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as {
    register?: unknown;
    login?: unknown;
    logout?: unknown;
    getSession?: unknown;
  };
  return (
    typeof candidate.register === "function" &&
    typeof candidate.login === "function" &&
    typeof candidate.logout === "function" &&
    typeof candidate.getSession === "function"
  );
}

function isTripService(value: unknown): value is TripService {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as {
    createTrip?: unknown;
    listTrips?: unknown;
    getTrip?: unknown;
    addMember?: unknown;
  };
  return (
    typeof candidate.createTrip === "function" &&
    typeof candidate.listTrips === "function" &&
    typeof candidate.getTrip === "function" &&
    typeof candidate.addMember === "function"
  );
}

function isSuggestionService(value: unknown): value is SuggestionService {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as { createSuggestion?: unknown; listSuggestions?: unknown };
  return typeof candidate.createSuggestion === "function" && typeof candidate.listSuggestions === "function";
}
