import { errorResponse } from "@/lib/auth/http";
import { getTripService } from "@/lib/trips/container";
import { readField, readJsonObject, requireUser } from "@/lib/trips/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const user = await requireUser(request);
  if (!user.ok) {
    return user.response;
  }

  const { id } = await context.params;
  const result = await getTripService().getTrip(user.user.id, id);
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ trip: result.trip });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const user = await requireUser(request);
  if (!user.ok) {
    return user.response;
  }

  const { id } = await context.params;
  const body = await readJsonObject(request);
  const result = await getTripService().updateTrip(user.user.id, id, {
    name: readField(body, "name"),
    destination: readField(body, "destination"),
    startDate: readField(body, "startDate"),
    endDate: readField(body, "endDate"),
  });
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ trip: result.trip });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const user = await requireUser(request);
  if (!user.ok) {
    return user.response;
  }

  const { id } = await context.params;
  const result = await getTripService().deleteTrip(user.user.id, id);
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return new Response(null, { status: 204 });
}
