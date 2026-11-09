import type { StoredUser, UserStore } from "@/lib/auth/types";

export class DuplicateEmailError extends Error {
  constructor() {
    super("Duplicate email");
    this.name = "DuplicateEmailError";
  }
}

export class InMemoryUserStore implements UserStore {
  async findByEmail(_email: string): Promise<StoredUser | null> {
    return null;
  }

  async findById(_id: string): Promise<StoredUser | null> {
    return null;
  }

  async create(user: StoredUser): Promise<StoredUser> {
    return user;
  }
}
