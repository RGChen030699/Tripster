export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  void request;
  void context;
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
