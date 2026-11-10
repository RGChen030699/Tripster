import type { SuggestionCategory } from "@/lib/suggestions/types";

export type StoredItineraryItem = {
  id: string;
  tripId: string;
  suggestionId: string;
  date?: string;
  startTime?: string | null;
};

export type ItineraryItemView = {
  id: string;
  suggestionId: string;
  name: string;
  category: SuggestionCategory;
  unscheduled: boolean;
  date?: string;
  startTime?: string | null;
};

export type ScheduleItineraryResult =
  | { ok: true; item: ItineraryItemView }
  | { ok: false; status: number; error: string };

export type RemoveItineraryItemResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export type ItineraryListResult =
  | { ok: true; items: ItineraryItemView[] }
  | { ok: false; status: number; error: string };

export type AddItineraryResult =
  | { ok: true; created: boolean; item: ItineraryItemView }
  | { ok: false; status: number; error: string };

export interface ItineraryStore {
  add(item: StoredItineraryItem): Promise<void>;
  update(item: StoredItineraryItem): Promise<void>;
  remove(id: string): Promise<void>;
  listByTrip(tripId: string): Promise<StoredItineraryItem[]>;
  findById(id: string): Promise<StoredItineraryItem | null>;
  findBySuggestion(tripId: string, suggestionId: string): Promise<StoredItineraryItem | null>;
}
