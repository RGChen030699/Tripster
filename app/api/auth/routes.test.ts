import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { POST as register } from "@/app/api/auth/register/route";
import { GET as session } from "@/app/api/auth/session/route";
import { resetAuthService } from "@/lib/auth/container";

const EMAIL = "ada@example.com";
const PASSWORD = "correct-horse";

function jsonRequest(path: string, body: unknown, cookie?: string): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function sessionRequest(cookie?: string): Request {
  const headers = new Headers();
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return new Request("http://localhost/api/auth/session", { headers });
}

function cookiePair(response: Response): string {
  const setCookie = response.headers.get("set-cookie") ?? "";
  return setCookie.split(";")[0] ?? "";
}

function sessionToken(response: Response): string {
  const match = /tripster_session=([^;]+)/.exec(response.headers.get("set-cookie") ?? "");
  return decodeURIComponent(match?.[1] ?? "");
}

describe("auth routes", () => {
  beforeEach(async () => {
    await resetAuthService();
  });

  it("registers, sets an httpOnly cookie, and keeps the password and token out of the body", async () => {
    const response = await register(
      jsonRequest("/api/auth/register", {
        email: "  Ada@Example.com  ",
        password: PASSWORD,
      }),
    );

    expect(response.status).toBe(201);
    const body: unknown = await response.json();
    const token = sessionToken(response);
    expect(token).not.toBe("");
    expect(response.headers.get("set-cookie")?.toLowerCase()).toContain("httponly");
    expect(JSON.stringify(body)).not.toContain(PASSWORD);
    expect(JSON.stringify(body)).not.toContain(token);
    expect(body).toMatchObject({ user: { email: EMAIL } });
  });

  it("rejects a duplicate email", async () => {
    await register(jsonRequest("/api/auth/register", { email: EMAIL, password: PASSWORD }));

    const response = await register(
      jsonRequest("/api/auth/register", {
        email: "Ada@Example.com",
        password: "another-password",
      }),
    );

    expect(response.status).toBe(409);
    const body: unknown = await response.json();
    expect(body).toEqual({ error: "An account with that email already exists." });
    expect(JSON.stringify(body)).not.toContain("another-password");
  });

  it("logs in a registered user", async () => {
    await register(jsonRequest("/api/auth/register", { email: EMAIL, password: PASSWORD }));

    const response = await login(
      jsonRequest("/api/auth/login", {
        email: "Ada@Example.com",
        password: PASSWORD,
      }),
    );

    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    const token = sessionToken(response);
    expect(response.headers.get("set-cookie")?.toLowerCase()).toContain("httponly");
    expect(body).toMatchObject({ user: { email: EMAIL } });
    expect(JSON.stringify(body)).not.toContain(PASSWORD);
    expect(token).not.toBe("");
    expect(JSON.stringify(body)).not.toContain(token);
  });

  it("returns the same error for a wrong password and an unknown email", async () => {
    await register(jsonRequest("/api/auth/register", { email: EMAIL, password: PASSWORD }));

    const wrong = await login(
      jsonRequest("/api/auth/login", { email: EMAIL, password: "wrong-password" }),
    );
    const unknown = await login(
      jsonRequest("/api/auth/login", {
        email: "missing@example.com",
        password: "wrong-password",
      }),
    );
    const wrongBody: unknown = await wrong.json();
    const unknownBody: unknown = await unknown.json();

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(wrong.status);
    expect(unknownBody).toEqual(wrongBody);
    expect(wrongBody).toEqual({ error: "Invalid email or password." });
    expect(JSON.stringify(wrongBody)).not.toContain("wrong-password");
  });

  it("logout invalidates the session", async () => {
    const registered = await register(
      jsonRequest("/api/auth/register", { email: EMAIL, password: PASSWORD }),
    );
    const cookie = cookiePair(registered);
    const token = sessionToken(registered);

    const before = await session(sessionRequest(cookie));
    expect(before.status).toBe(200);

    const loggedOut = await logout(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: { cookie },
      }),
    );
    expect(loggedOut.status).toBe(204);

    const after = await session(sessionRequest(cookie));
    expect(after.status).toBe(401);
    const afterBody: unknown = await after.json();
    expect(afterBody).toEqual({ error: "Authentication required." });
    expect(JSON.stringify(afterBody)).not.toContain(PASSWORD);
    if (token) {
      expect(JSON.stringify(afterBody)).not.toContain(token);
    }
  });

  it("does not log the password or session token", async () => {
    const calls: string[] = [];
    const record = (...args: unknown[]) => {
      calls.push(
        args
          .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
          .join(" "),
      );
    };
    const spies = [
      vi.spyOn(console, "log").mockImplementation(record),
      vi.spyOn(console, "info").mockImplementation(record),
      vi.spyOn(console, "warn").mockImplementation(record),
      vi.spyOn(console, "error").mockImplementation(record),
      vi.spyOn(console, "debug").mockImplementation(record),
    ];

    try {
      const response = await register(
        jsonRequest("/api/auth/register", { email: EMAIL, password: PASSWORD }),
      );
      expect(response.status).toBe(201);
      const token = sessionToken(response);
      const wrong = await login(
        jsonRequest("/api/auth/login", { email: EMAIL, password: "wrong-password" }),
      );
      const errorText = await wrong.text();
      const logged = calls.join("\n");

      expect(logged).not.toContain(PASSWORD);
      expect(logged).not.toContain("wrong-password");
      expect(errorText).not.toContain(PASSWORD);
      expect(errorText).not.toContain("wrong-password");
      expect(token).not.toBe("");
      expect(logged).not.toContain(token);
      expect(errorText).not.toContain(token);
    } finally {
      for (const spy of spies) {
        spy.mockRestore();
      }
    }
  });

  it("does not echo a password when validation fails", async () => {
    const response = await register(
      jsonRequest("/api/auth/register", { email: "not-an-email", password: PASSWORD }),
    );

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).not.toContain(PASSWORD);
    expect(JSON.parse(text)).toEqual({ error: "Enter a valid email address." });
  });
});
