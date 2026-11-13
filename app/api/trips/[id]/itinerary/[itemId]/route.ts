import { errorResponse } from "@/lib/auth/http";
import { getSuggestionService } from "@/lib/suggestions/container";
import { readField, readJsonObject, requireUser } from "@/lib/trips/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
): Promise<Response> {
  const user = await requireUser(request);
  if (!user.ok) {
    return user.response;
  }
  const { id, itemId } = await context.params;
  const body = await readJsonObject(request);
  const result = await getSuggestionService().scheduleItinerary(user.user.id, id, itemId, {
    date: readField(body, "date"),
    startTime: readField(body, "startTime"),
  });
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ item: result.item });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
): Promise<Response> {
  const user = await requireUser(request);
  if (!user.ok) {
    return user.response;
  }
  const { id, itemId } = await context.params;
  const result = await getSuggestionService().removeItineraryItem(user.user.id, id, itemId);
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return new Response(null, { status: 204 });
}
