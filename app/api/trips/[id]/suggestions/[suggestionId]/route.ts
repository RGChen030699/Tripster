export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; suggestionId: string }> },
): Promise<Response> {
  void request;
  void context;
  return Response.json({ error: "Not implemented." }, { status: 501 });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; suggestionId: string }> },
): Promise<Response> {
  void request;
  void context;
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
