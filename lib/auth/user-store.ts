import type { StoredUser, UserStore } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";

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

export class PrismaUserStore implements UserStore {
  async findByEmail(email: string): Promise<StoredUser | null> {
    const user = await getPrisma().user.findUnique({ where: { email } });
    return user ? toStoredUser(user) : null;
  }

  async findById(id: string): Promise<StoredUser | null> {
    const user = await getPrisma().user.findUnique({ where: { id } });
    return user ? toStoredUser(user) : null;
  }

  async create(user: StoredUser): Promise<StoredUser> {
    try {
      const created = await getPrisma().user.create({
        data: {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
        },
      });
      return toStoredUser(created);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateEmailError();
      }
      throw error;
    }
  }
}

function toStoredUser(user: { id: string; email: string; passwordHash: string }): StoredUser {
  return { id: user.id, email: user.email, passwordHash: user.passwordHash };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
