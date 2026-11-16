import { readSessionToken } from "@/lib/auth/cookies";
import { getAuthService } from "@/lib/auth/container";
import { errorResponse } from "@/lib/auth/http";
import type { PublicUser } from "@/lib/auth/types";

export async function requireUser(
  request: Request,
): Promise<{ ok: true; user: PublicUser } | { ok: false; response: Response }> {
  const session = await getAuthService().getSession(readSessionToken(request));
  if (!session.ok) {
    return { ok: false, response: errorResponse(session.error, session.status) };
  }
  return { ok: true, user: session.user };
}

export async function readJsonObject(request: Request): Promise<object> {
  try {
    const payload: unknown = await request.json();
    if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
      return payload;
    }
  } catch {
    return {};
  }
  return {};
}

export function readField(value: object, key: string): unknown {
  if (!Object.hasOwn(value, key)) {
    return undefined;
  }
  return Reflect.get(value, key);
}
