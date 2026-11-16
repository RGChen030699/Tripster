import { errorResponse } from "@/lib/auth/http";
import { getSuggestionService } from "@/lib/suggestions/container";
import { requireUser } from "@/lib/trips/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; suggestionId: string }> },
): Promise<Response> {
  const user = await requireUser(request);
  if (!user.ok) {
    return user.response;
  }

  const { id, suggestionId } = await context.params;
  const result = await getSuggestionService().addToItinerary(user.user.id, id, suggestionId);
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ item: result.item }, { status: result.created ? 201 : 200 });
}
