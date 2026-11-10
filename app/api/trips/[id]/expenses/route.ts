import { errorResponse } from "@/lib/auth/http";
import { getExpenseService } from "@/lib/expenses/container";
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
  const result = await getExpenseService().listExpenses(user.user.id, id);
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ expenses: result.expenses });
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
  const result = await getExpenseService().recordExpense(user.user.id, id, {
    amount: readField(body, "amount"),
    description: readField(body, "description"),
    date: readField(body, "date"),
    payerEmail: readField(body, "payerEmail"),
    participantEmails: readField(body, "participantEmails"),
  });
  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }
  return Response.json({ expense: result.expense }, { status: 201 });
}
