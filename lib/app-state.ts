import { AuthService } from "@/lib/auth/auth-service";
import { createConsoleLogger } from "@/lib/auth/logger";
import { PrismaSessionStore } from "@/lib/auth/session-store";
import { PrismaUserStore } from "@/lib/auth/user-store";
import { resetDatabase } from "@/lib/db";
import { ExpenseService } from "@/lib/expenses/expense-service";
import { PrismaExpenseStore } from "@/lib/expenses/expense-store";
import { PrismaItineraryStore } from "@/lib/itinerary/itinerary-store";
import { SuggestionService } from "@/lib/suggestions/suggestion-service";
import { PrismaSuggestionStore } from "@/lib/suggestions/suggestion-store";
import { PrismaVoteStore } from "@/lib/suggestions/vote-store";
import { TripService } from "@/lib/trips/trip-service";
import { PrismaTripStore } from "@/lib/trips/trip-store";

const APP_STATE_KEY = "__tripsterAppState";

type AppState = {
  auth: AuthService;
  trips: TripService;
  suggestions: SuggestionService;
  expenses: ExpenseService;
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

export function getExpenseService(): ExpenseService {
  return getAppState().expenses;
}

export async function resetAppState(): Promise<void> {
  await resetDatabase();
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
  const users = new PrismaUserStore();
  const tripStore = new PrismaTripStore();
  const logger = createConsoleLogger();
  return {
    auth: new AuthService(users, new PrismaSessionStore(), logger),
    trips: new TripService(tripStore, users, logger),
    suggestions: new SuggestionService(
      new PrismaSuggestionStore(),
      new PrismaVoteStore(),
      new PrismaItineraryStore(),
      tripStore,
      users,
      logger,
    ),
    expenses: new ExpenseService(new PrismaExpenseStore(), tripStore, users, logger),
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
  const candidate = value as { auth?: unknown; trips?: unknown; suggestions?: unknown; expenses?: unknown };
  return (
    isAuthService(candidate.auth) &&
    isTripService(candidate.trips) &&
    isSuggestionService(candidate.suggestions) &&
    isExpenseService(candidate.expenses)
  );
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

function isExpenseService(value: unknown): value is ExpenseService {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as { recordExpense?: unknown; listExpenses?: unknown; listBalances?: unknown };
  return (
    typeof candidate.recordExpense === "function" &&
    typeof candidate.listExpenses === "function" &&
    typeof candidate.listBalances === "function"
  );
}

function isSuggestionService(value: unknown): value is SuggestionService {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as {
    createSuggestion?: unknown;
    listSuggestions?: unknown;
    vote?: unknown;
    listItinerary?: unknown;
    addToItinerary?: unknown;
    updateSuggestion?: unknown;
    removeSuggestion?: unknown;
    scheduleItinerary?: unknown;
    removeItineraryItem?: unknown;
  };
  return (
    typeof candidate.createSuggestion === "function" &&
    typeof candidate.listSuggestions === "function" &&
    typeof candidate.vote === "function" &&
    typeof candidate.listItinerary === "function" &&
    typeof candidate.addToItinerary === "function" &&
    typeof candidate.updateSuggestion === "function" &&
    typeof candidate.removeSuggestion === "function" &&
    typeof candidate.scheduleItinerary === "function" &&
    typeof candidate.removeItineraryItem === "function"
  );
}
