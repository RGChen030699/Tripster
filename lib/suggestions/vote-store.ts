import { getPrisma } from "@/lib/db";
import type { StoredVote, VoteChoice, VoteStore } from "@/lib/suggestions/types";

export class InMemoryVoteStore implements VoteStore {
  private readonly votes = new Map<string, StoredVote>();

  async set(vote: StoredVote): Promise<void> {
    this.votes.set(voteKey(vote.suggestionId, vote.userId), cloneVote(vote));
  }

  async listBySuggestion(suggestionId: string): Promise<StoredVote[]> {
    const listed: StoredVote[] = [];
    for (const vote of this.votes.values()) {
      if (vote.suggestionId === suggestionId) {
        listed.push(cloneVote(vote));
      }
    }
    return listed;
  }
}

function voteKey(suggestionId: string, userId: string): string {
  return `${suggestionId}\u0000${userId}`;
}

function cloneVote(vote: StoredVote): StoredVote {
  return { suggestionId: vote.suggestionId, userId: vote.userId, choice: vote.choice };
}

export class PrismaVoteStore implements VoteStore {
  async set(vote: StoredVote): Promise<void> {
    await getPrisma().vote.upsert({
      where: {
        suggestionId_userId: { suggestionId: vote.suggestionId, userId: vote.userId },
      },
      create: {
        suggestionId: vote.suggestionId,
        userId: vote.userId,
        choice: vote.choice,
      },
      update: { choice: vote.choice },
    });
  }

  async listBySuggestion(suggestionId: string): Promise<StoredVote[]> {
    const votes = await getPrisma().vote.findMany({
      where: { suggestionId },
      orderBy: [{ createdAt: "asc" }, { userId: "asc" }],
    });
    return votes.map((vote) => ({
      suggestionId: vote.suggestionId,
      userId: vote.userId,
      choice: vote.choice as VoteChoice,
    }));
  }
}
