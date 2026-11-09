import type { SessionStore, StoredSession } from "@/lib/auth/types";

export class InMemorySessionStore implements SessionStore {
  async create(session: StoredSession): Promise<StoredSession> {
    return session;
  }

  async findByToken(_token: string): Promise<StoredSession | null> {
    return null;
  }

  async deleteByToken(_token: string): Promise<void> {}
}
