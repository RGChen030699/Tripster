import { errorResponse } from "@/lib/auth/http";
import { getSuggestionService } from "@/lib/suggestions/container";
import { readField, readJsonObject, requireUser } from "@/lib/trips/http";

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
  const body = await readJsonObject(request);
  const result = await getSuggestionService().vote(
    user.user.id,
    id,
    suggestionId,
    readField(body, "choice"),
  );
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ vote: result.vote, votes: result.votes });
}
