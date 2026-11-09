import { clearSessionCookie, readSessionToken } from "@/lib/auth/cookies";
import { getAuthService } from "@/lib/auth/container";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  await getAuthService().logout(readSessionToken(request));
  return new Response(null, {
    status: 204,
    headers: { "set-cookie": clearSessionCookie() },
  });
}
