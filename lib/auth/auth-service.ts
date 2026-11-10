import { randomBytes, randomUUID } from "node:crypto";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type {
  AuthResult,
  Logger,
  PublicUser,
  SessionResult,
  SessionStore,
  StoredUser,
  UserStore,
} from "@/lib/auth/types";
import { DuplicateEmailError } from "@/lib/auth/user-store";
import { parseCredentials } from "@/lib/auth/validation";

const INVALID_CREDENTIALS = "Invalid email or password.";
const DUPLICATE_EMAIL = "An account with that email already exists.";
const AUTHENTICATION_REQUIRED = "Authentication required.";

export class AuthService {
  private readonly users: UserStore;
  private readonly sessions: SessionStore;
  private readonly logger: Logger;
  private readonly dummyHash: Promise<string>;

  constructor(users: UserStore, sessions: SessionStore, logger: Logger) {
    this.users = users;
    this.sessions = sessions;
    this.logger = logger;
    this.dummyHash = hashPassword("dummy-password-for-unknown-email");
  }

  async register(input: { email: string; password: string }): Promise<AuthResult> {
    const parsed = parseCredentials(input);
    if (!parsed.ok) {
      return parsed;
    }

    const existing = await this.users.findByEmail(parsed.email);
    if (existing) {
      return { ok: false, status: 409, error: DUPLICATE_EMAIL };
    }

    const user: StoredUser = {
      id: randomUUID(),
      email: parsed.email,
      passwordHash: await hashPassword(parsed.password),
    };

    try {
      await this.users.create(user);
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        return { ok: false, status: 409, error: DUPLICATE_EMAIL };
      }
      throw error;
    }

    const token = await this.startSession(user.id);
    this.logger.info("registered user");
    return { ok: true, user: toPublicUser(user), token };
  }

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    const parsed = parseCredentials(input);
    if (!parsed.ok) {
      return parsed;
    }

    const user = await this.users.findByEmail(parsed.email);
    const storedHash = user?.passwordHash ?? (await this.dummyHash);
    const passwordMatches = await verifyPassword(parsed.password, storedHash);
    if (!user || !passwordMatches) {
      this.logger.info("login failed");
      return { ok: false, status: 401, error: INVALID_CREDENTIALS };
    }

    const token = await this.startSession(user.id);
    this.logger.info("login succeeded");
    return { ok: true, user: toPublicUser(user), token };
  }

  async logout(token: string | null): Promise<void> {
    if (token) {
      await this.sessions.deleteByToken(token);
    }
    this.logger.info("logged out");
  }

  async getSession(token: string | null): Promise<SessionResult> {
    if (!token) {
      return { ok: false, status: 401, error: AUTHENTICATION_REQUIRED };
    }

    const session = await this.sessions.findByToken(token);
    if (!session) {
      return { ok: false, status: 401, error: AUTHENTICATION_REQUIRED };
    }

    const user = await this.users.findById(session.userId);
    if (!user) {
      return { ok: false, status: 401, error: AUTHENTICATION_REQUIRED };
    }

    return { ok: true, user: toPublicUser(user) };
  }

  private async startSession(userId: string): Promise<string> {
    const token = randomBytes(32).toString("base64url");
    await this.sessions.create({ token, userId });
    return token;
  }
}

function toPublicUser(user: StoredUser): PublicUser {
  return { id: user.id, email: user.email };
}
