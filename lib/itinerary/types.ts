import type { SuggestionCategory } from "@/lib/suggestions/types";

export type StoredItineraryItem = {
  id: string;
  tripId: string;
  suggestionId: string;
};

export type ItineraryItemView = {
  id: string;
  suggestionId: string;
  name: string;
  category: SuggestionCategory;
  unscheduled: true;
};

export type ItineraryListResult =
  | { ok: true; items: ItineraryItemView[] }
  | { ok: false; status: number; error: string };

export interface ItineraryStore {
  listByTrip(tripId: string): Promise<StoredItineraryItem[]>;
  findBySuggestion(tripId: string, suggestionId: string): Promise<StoredItineraryItem | null>;
}
