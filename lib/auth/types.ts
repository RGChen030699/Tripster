export type PublicUser = {
  id: string;
  email: string;
};

export type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
};

export type StoredSession = {
  token: string;
  userId: string;
};

export type AuthSuccess = {
  ok: true;
  user: PublicUser;
  token: string;
};

export type AuthFailure = {
  ok: false;
  status: number;
  error: string;
};

export type AuthResult = AuthSuccess | AuthFailure;

export type SessionResult =
  | {
      ok: true;
      user: PublicUser;
    }
  | AuthFailure;

export interface UserStore {
  findByEmail(email: string): Promise<StoredUser | null>;
  findById(id: string): Promise<StoredUser | null>;
  create(user: StoredUser): Promise<StoredUser>;
}

export interface SessionStore {
  create(session: StoredSession): Promise<StoredSession>;
  findByToken(token: string): Promise<StoredSession | null>;
  deleteByToken(token: string): Promise<void>;
}

export interface Logger {
  info(message: string): void;
  error(message: string): void;
}
