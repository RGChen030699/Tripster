import { afterEach, describe, expect, it } from "vitest";

import { signAccessToken, verifyAccessToken } from "@/lib/auth/jwt";

const PREVIOUS_SECRET = process.env.JWT_SECRET;

afterEach(() => {
  if (PREVIOUS_SECRET === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = PREVIOUS_SECRET;
  }
});

describe("JWT access tokens", () => {
  it("signs a token that verifies back to the same user id and jti", () => {
    process.env.JWT_SECRET = "unit-test-jwt-secret";

    const signed = signAccessToken({ userId: "user-1" });
    expect(signed.token.split(".")).toHaveLength(3);
    expect(signed.jti.length).toBeGreaterThan(0);

    const verified = verifyAccessToken(signed.token);
    expect(verified).toEqual({ userId: "user-1", jti: signed.jti });
  });

  it("rejects a token signed with a different secret", () => {
    process.env.JWT_SECRET = "unit-test-jwt-secret";
    const signed = signAccessToken({ userId: "user-1" });

    process.env.JWT_SECRET = "other-secret";
    expect(verifyAccessToken(signed.token)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    process.env.JWT_SECRET = "unit-test-jwt-secret";
    const signed = signAccessToken({ userId: "user-1" });
    const [header, payload, signature] = signed.token.split(".");
    const tampered = `${header}.${payload?.replace(/.$/, "x")}.${signature}`;

    expect(verifyAccessToken(tampered)).toBeNull();
  });

  it("rejects an expired token", () => {
    process.env.JWT_SECRET = "unit-test-jwt-secret";
    const signed = signAccessToken({ userId: "user-1", expiresInSeconds: -1 });

    expect(verifyAccessToken(signed.token)).toBeNull();
  });
});
