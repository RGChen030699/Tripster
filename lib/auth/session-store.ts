import type { SessionStore, StoredSession } from "@/lib/auth/types";

export class InMemorySessionStore implements SessionStore {
  private readonly byToken = new Map<string, StoredSession>();

  async create(session: StoredSession): Promise<StoredSession> {
    const stored = { token: session.token, userId: session.userId };
    this.byToken.set(stored.token, stored);
    return { token: stored.token, userId: stored.userId };
  }

  async findByToken(token: string): Promise<StoredSession | null> {
    const session = this.byToken.get(token);
    return session ? { token: session.token, userId: session.userId } : null;
  }

  async deleteByToken(token: string): Promise<void> {
    this.byToken.delete(token);
  }
}
