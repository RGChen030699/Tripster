import { readSessionToken } from "@/lib/auth/cookies";
import { getAuthService } from "@/lib/auth/container";
import { errorResponse } from "@/lib/auth/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const result = await getAuthService().getSession(readSessionToken(request));
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ user: result.user });
}
