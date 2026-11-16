import { errorResponse } from "@/lib/auth/http";
import { getExpenseService } from "@/lib/expenses/container";
import { requireUser } from "@/lib/trips/http";

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
  const result = await getExpenseService().listBalances(user.user.id, id);
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ balances: result.balances });
}
