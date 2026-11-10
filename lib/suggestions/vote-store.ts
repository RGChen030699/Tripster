import type { StoredVote, VoteStore } from "@/lib/suggestions/types";

export class InMemoryVoteStore implements VoteStore {
  async set(vote: StoredVote): Promise<void> {
    void vote;
  }

  async listBySuggestion(suggestionId: string): Promise<StoredVote[]> {
    void suggestionId;
    return [];
  }
}
