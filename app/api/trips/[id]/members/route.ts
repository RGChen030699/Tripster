import { errorResponse } from "@/lib/auth/http";
import { getTripService } from "@/lib/trips/container";
import { readField, readJsonObject, requireUser } from "@/lib/trips/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const user = await requireUser(request);
  if (!user.ok) {
    return user.response;
  }

  const { id } = await context.params;
  const body = await readJsonObject(request);
  const result = await getTripService().addMember(user.user.id, id, readField(body, "email"));
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ member: result.member }, { status: 201 });
}
