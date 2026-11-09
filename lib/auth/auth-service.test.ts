import { describe, expect, it } from "vitest";

import { AuthService } from "@/lib/auth/auth-service";
import { InMemorySessionStore } from "@/lib/auth/session-store";
import type { Logger } from "@/lib/auth/types";
import { InMemoryUserStore } from "@/lib/auth/user-store";

const EMAIL = "ada@example.com";
const PASSWORD = "correct-horse";

function createHarness() {
  const logs: string[] = [];
  const logger: Logger = {
    info(message) {
      logs.push(message);
    },
    error(message) {
      logs.push(message);
    },
  };
  const users = new InMemoryUserStore();
  const sessions = new InMemorySessionStore();
  const service = new AuthService(users, sessions, logger);
  return { logs, users, service };
}

describe("AuthService", () => {
  it("registers an email username and stores a hash that is not the password", async () => {
    const { service, users } = createHarness();

    const result = await service.register({
      email: "  Ada@Example.com  ",
      password: PASSWORD,
    });

    expect(result).toMatchObject({
      ok: true,
      user: { email: EMAIL },
    });
    if (!result.ok) {
      return;
    }

    expect(result.token).not.toContain(PASSWORD);
    expect(JSON.stringify(result.user)).not.toContain(PASSWORD);

    const stored = await users.findByEmail(EMAIL);
    expect(stored).not.toBeNull();
    expect(stored?.passwordHash).not.toBe(PASSWORD);
    expect(stored?.passwordHash).not.toContain(PASSWORD);
  });

  it("rejects a second registration of the same email without echoing the password", async () => {
    const { service } = createHarness();

    const first = await service.register({ email: EMAIL, password: PASSWORD });
    expect(first.ok).toBe(true);

    const second = await service.register({
      email: "Ada@Example.com",
      password: PASSWORD,
    });

    expect(second).toEqual({
      ok: false,
      status: 409,
      error: "An account with that email already exists.",
    });
    expect(JSON.stringify(second)).not.toContain(PASSWORD);
  });

  it("returns one safe error for a wrong password and an unknown email", async () => {
    const { service, logs } = createHarness();

    const registered = await service.register({ email: EMAIL, password: PASSWORD });
    expect(registered.ok).toBe(true);

    const loggedIn = await service.login({
      email: "Ada@Example.com",
      password: PASSWORD,
    });
    expect(loggedIn.ok).toBe(true);
    if (!loggedIn.ok) {
      return;
    }

    expect(loggedIn.user.email).toBe(EMAIL);
    expect(loggedIn.token.length).toBeGreaterThan(0);

    const wrongPassword = "wrong-password";
    const wrong = await service.login({ email: EMAIL, password: wrongPassword });
    const unknown = await service.login({
      email: "missing@example.com",
      password: wrongPassword,
    });

    expect(wrong).toEqual({
      ok: false,
      status: 401,
      error: "Invalid email or password.",
    });
    expect(unknown).toEqual(wrong);

    const logged = logs.join("\n");
    expect(logged).not.toContain(PASSWORD);
    expect(logged).not.toContain(wrongPassword);
    expect(logged).not.toContain(loggedIn.token);
    expect(JSON.stringify(wrong)).not.toContain(wrongPassword);
    expect(JSON.stringify(wrong)).not.toContain(loggedIn.token);
  });

  it("invalidates the session on logout", async () => {
    const { service } = createHarness();

    const registered = await service.register({ email: EMAIL, password: PASSWORD });
    expect(registered.ok).toBe(true);
    if (!registered.ok) {
      return;
    }

    await expect(service.getSession(registered.token)).resolves.toMatchObject({
      ok: true,
      user: { email: EMAIL },
    });

    await service.logout(registered.token);

    await expect(service.getSession(registered.token)).resolves.toEqual({
      ok: false,
      status: 401,
      error: "Authentication required.",
    });
  });

  it("rejects a missing session", async () => {
    const { service } = createHarness();

    await expect(service.getSession(null)).resolves.toEqual({
      ok: false,
      status: 401,
      error: "Authentication required.",
    });
  });

  it("rejects an invalid email and a password that is too short or too long", async () => {
    const { service } = createHarness();

    await expect(
      service.register({ email: "not-an-email", password: PASSWORD }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Enter a valid email address.",
    });

    await expect(
      service.register({ email: EMAIL, password: "short" }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Use a password with at least 8 characters.",
    });

    await expect(
      service.register({ email: EMAIL, password: "a".repeat(129) }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Use a password with at most 128 characters.",
    });
  });
});
