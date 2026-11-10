import { sessionCookie } from "@/lib/auth/cookies";
import { getAuthService } from "@/lib/auth/container";
import { errorResponse, readCredentials } from "@/lib/auth/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const credentials = await readCredentials(request);
  if (!credentials.ok) {
    return credentials.response;
  }

  const result = await getAuthService().register({
    email: credentials.email,
    password: credentials.password,
  });
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }

  return Response.json(
    { user: result.user },
    { status: 201, headers: { "set-cookie": sessionCookie(result.token) } },
  );
}
