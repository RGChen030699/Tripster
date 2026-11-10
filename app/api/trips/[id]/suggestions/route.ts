import { errorResponse } from "@/lib/auth/http";
import { getSuggestionService } from "@/lib/suggestions/container";
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
  const result = await getSuggestionService().listSuggestions(user.user.id, id);
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ suggestions: result.suggestions });
}

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
  const result = await getSuggestionService().createSuggestion(user.user.id, id, {
    category: readField(body, "category"),
    name: readField(body, "name"),
    description: readField(body, "description"),
    address: readField(body, "address"),
    link: readField(body, "link"),
  });
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ suggestion: result.suggestion }, { status: 201 });
}
