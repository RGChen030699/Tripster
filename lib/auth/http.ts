const INVALID_BODY = "Enter a valid email address and password.";

export async function readCredentials(
  request: Request,
): Promise<
  { ok: true; email: string; password: string } | { ok: false; response: Response }
> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return { ok: false, response: invalidBody() };
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, response: invalidBody() };
  }

  const email = readField(payload, "email");
  const password = readField(payload, "password");
  if (typeof email !== "string" || typeof password !== "string") {
    return { ok: false, response: invalidBody() };
  }

  return { ok: true, email, password };
}

export function errorResponse(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

function invalidBody(): Response {
  return errorResponse(INVALID_BODY, 400);
}

function readField(value: object, key: string): unknown {
  if (!Object.hasOwn(value, key)) {
    return undefined;
  }
  return Reflect.get(value, key);
}
