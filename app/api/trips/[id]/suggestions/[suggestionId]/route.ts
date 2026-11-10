import { errorResponse } from "@/lib/auth/http";
import { getSuggestionService } from "@/lib/suggestions/container";
import { readField, readJsonObject, requireUser } from "@/lib/trips/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; suggestionId: string }> },
): Promise<Response> {
  const user = await requireUser(request);
  if (!user.ok) {
    return user.response;
  }
  const { id, suggestionId } = await context.params;
  const body = await readJsonObject(request);
  const result = await getSuggestionService().updateSuggestion(user.user.id, id, suggestionId, {
    category: readField(body, "category"),
    name: readField(body, "name"),
    description: readField(body, "description"),
    address: readField(body, "address"),
    link: readField(body, "link"),
  });
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ suggestion: result.suggestion });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; suggestionId: string }> },
): Promise<Response> {
  const user = await requireUser(request);
  if (!user.ok) {
    return user.response;
  }
  const { id, suggestionId } = await context.params;
  const result = await getSuggestionService().removeSuggestion(user.user.id, id, suggestionId);
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return new Response(null, { status: 204 });
}
