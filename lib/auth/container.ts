import { AuthService } from "@/lib/auth/auth-service";
import { InMemorySessionStore } from "@/lib/auth/session-store";
import { InMemoryUserStore } from "@/lib/auth/user-store";

export function getAuthService(): AuthService {
  return new AuthService(new InMemoryUserStore(), new InMemorySessionStore(), {
    info() {},
    error() {},
  });
}

export function resetAuthService(): void {}
