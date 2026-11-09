import type {
  AuthResult,
  Logger,
  SessionResult,
  SessionStore,
  UserStore,
} from "@/lib/auth/types";

export class AuthService {
  private readonly users: UserStore;
  private readonly sessions: SessionStore;
  private readonly logger: Logger;

  constructor(users: UserStore, sessions: SessionStore, logger: Logger) {
    this.users = users;
    this.sessions = sessions;
    this.logger = logger;
  }

  async register(_input: { email: string; password: string }): Promise<AuthResult> {
    this.logger.error("Not implemented");
    return { ok: false, status: 501, error: "Not implemented" };
  }

  async login(_input: { email: string; password: string }): Promise<AuthResult> {
    this.logger.error("Not implemented");
    return { ok: false, status: 501, error: "Not implemented" };
  }

  async logout(_token: string | null): Promise<void> {
    this.logger.info("Not implemented");
  }

  async getSession(_token: string | null): Promise<SessionResult> {
    return { ok: false, status: 501, error: "Not implemented" };
  }
}
