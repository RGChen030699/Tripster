export const SUGGESTION_CATEGORIES = ["lodging", "activity", "place", "restaurant"] as const;

export type SuggestionCategory = (typeof SUGGESTION_CATEGORIES)[number];

export type StoredSuggestion = {
  id: string;
  tripId: string;
  authorId: string;
  category: SuggestionCategory;
  name: string;
  description: string | null;
  address: string | null;
  link: string | null;
};

export type VoteChoice = "yes" | "maybe" | "no";

export type VoteTotals = {
  yes: number;
  maybe: number;
  no: number;
};

export type StoredVote = {
  suggestionId: string;
  userId: string;
  choice: VoteChoice;
};

export type SuggestionView = {
  id: string;
  category: SuggestionCategory;
  name: string;
  description: string | null;
  address: string | null;
  link: string | null;
  authorEmail: string;
  votes: VoteTotals;
  myVote: VoteChoice | null;
};

export type SuggestionFailure = {
  ok: false;
  status: number;
  error: string;
};

export type CreateSuggestionResult = { ok: true; suggestion: SuggestionView } | SuggestionFailure;

export type SuggestionListResult = { ok: true; suggestions: SuggestionView[] } | SuggestionFailure;

export type VoteResult =
  | { ok: true; vote: { choice: VoteChoice }; votes: VoteTotals }
  | SuggestionFailure;

export interface VoteStore {
  set(vote: StoredVote): Promise<void>;
  listBySuggestion(suggestionId: string): Promise<StoredVote[]>;
}

export interface SuggestionStore {
  create(suggestion: StoredSuggestion): Promise<void>;
  listByTrip(tripId: string): Promise<StoredSuggestion[]>;
  findById(id: string): Promise<StoredSuggestion | null>;
}
