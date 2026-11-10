import { z } from "zod";

const emailSchema = z.string().email().max(254);

export type ParsedCredentials =
  | { ok: true; email: string; password: string }
  | { ok: false; status: 400; error: string };

export function parseCredentials(input: {
  email: unknown;
  password: unknown;
}): ParsedCredentials {
  if (typeof input.email !== "string" || typeof input.password !== "string") {
    return {
      ok: false,
      status: 400,
      error: "Enter a valid email address and password.",
    };
  }

  const email = input.email.trim().toLowerCase();
  if (!emailSchema.safeParse(email).success) {
    return { ok: false, status: 400, error: "Enter a valid email address." };
  }

  if (input.password.length < 8) {
    return {
      ok: false,
      status: 400,
      error: "Use a password with at least 8 characters.",
    };
  }

  if (input.password.length > 128) {
    return {
      ok: false,
      status: 400,
      error: "Use a password with at most 128 characters.",
    };
  }

  return { ok: true, email, password: input.password };
}
