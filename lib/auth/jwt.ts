import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

export type AccessTokenClaims = {
  userId: string;
  jti: string;
};

export type SignedAccessToken = AccessTokenClaims & {
  token: string;
};

type JwtPayload = {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
};

export function signAccessToken(input: {
  userId: string;
  expiresInSeconds?: number;
}): SignedAccessToken {
  const jti = randomBytes(16).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = input.expiresInSeconds ?? DEFAULT_EXPIRES_IN_SECONDS;
  const payload: JwtPayload = {
    sub: input.userId,
    jti,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const header = encodePart({ alg: "HS256", typ: "JWT" });
  const body = encodePart(payload);
  const signingInput = `${header}.${body}`;
  const token = `${signingInput}.${sign(signingInput)}`;
  return { token, userId: input.userId, jti };
}

export function verifyAccessToken(token: string): AccessTokenClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [headerPart, payloadPart, signaturePart] = parts;
  if (!headerPart || !payloadPart || !signaturePart) {
    return null;
  }

  const expected = sign(`${headerPart}.${payloadPart}`);
  if (!signaturesMatch(expected, signaturePart)) {
    return null;
  }

  let header: unknown;
  let payload: unknown;
  try {
    header = decodePart(headerPart);
    payload = decodePart(payloadPart);
  } catch {
    return null;
  }

  if (!isHs256Header(header) || !isJwtPayload(payload)) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    return null;
  }

  return { userId: payload.sub, jti: payload.jti };
}

function sign(content: string): string {
  return createHmac("sha256", readSecret()).update(content).digest("base64url");
}

function readSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === "") {
    throw new Error("JWT_SECRET is not set.");
  }
  return secret;
}

function encodePart(value: object): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodePart(value: string): unknown {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
}

function isHs256Header(value: unknown): value is { alg: "HS256"; typ: "JWT" } {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as { alg?: unknown; typ?: unknown };
  return candidate.alg === "HS256" && candidate.typ === "JWT";
}

function isJwtPayload(value: unknown): value is JwtPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as { sub?: unknown; jti?: unknown; iat?: unknown; exp?: unknown };
  return (
    typeof candidate.sub === "string" &&
    candidate.sub.length > 0 &&
    typeof candidate.jti === "string" &&
    candidate.jti.length > 0 &&
    typeof candidate.iat === "number" &&
    typeof candidate.exp === "number"
  );
}

function signaturesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}
