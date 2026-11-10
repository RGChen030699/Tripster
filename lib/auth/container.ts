import { AuthService } from "@/lib/auth/auth-service";
import { createConsoleLogger } from "@/lib/auth/logger";
import { InMemorySessionStore } from "@/lib/auth/session-store";
import { InMemoryUserStore } from "@/lib/auth/user-store";

const AUTH_SERVICE_KEY = "__tripsterAuthService";

export function getAuthService(): AuthService {
  const existing = readAuthService();
  if (existing) {
    return existing;
  }
  const created = createAuthService();
  writeAuthService(created);
  return created;
}

export function resetAuthService(): void {
  writeAuthService(createAuthService());
}

function createAuthService(): AuthService {
  return new AuthService(
    new InMemoryUserStore(),
    new InMemorySessionStore(),
    createConsoleLogger(),
  );
}

function readAuthService(): AuthService | undefined {
  const value = Reflect.get(globalThis, AUTH_SERVICE_KEY);
  return isAuthService(value) ? value : undefined;
}

function writeAuthService(service: AuthService): void {
  Reflect.set(globalThis, AUTH_SERVICE_KEY, service);
}

function isAuthService(value: unknown): value is AuthService {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as {
    register?: unknown;
    login?: unknown;
    logout?: unknown;
    getSession?: unknown;
  };
  return (
    typeof candidate.register === "function" &&
    typeof candidate.login === "function" &&
    typeof candidate.logout === "function" &&
    typeof candidate.getSession === "function"
  );
}
