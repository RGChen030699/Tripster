import type { StoredUser, UserStore } from "@/lib/auth/types";

export class DuplicateEmailError extends Error {
  constructor() {
    super("Duplicate email");
    this.name = "DuplicateEmailError";
  }
}

export class InMemoryUserStore implements UserStore {
  private readonly byEmail = new Map<string, StoredUser>();
  private readonly byId = new Map<string, StoredUser>();

  async findByEmail(email: string): Promise<StoredUser | null> {
    return copyUser(this.byEmail.get(email));
  }

  async findById(id: string): Promise<StoredUser | null> {
    return copyUser(this.byId.get(id));
  }

  async create(user: StoredUser): Promise<StoredUser> {
    if (this.byEmail.has(user.email)) {
      throw new DuplicateEmailError();
    }

    const stored = cloneUser(user);
    this.byEmail.set(stored.email, stored);
    this.byId.set(stored.id, stored);
    return cloneUser(stored);
  }
}

function copyUser(user: StoredUser | undefined): StoredUser | null {
  return user ? cloneUser(user) : null;
}

function cloneUser(user: StoredUser): StoredUser {
  return { id: user.id, email: user.email, passwordHash: user.passwordHash };
}
