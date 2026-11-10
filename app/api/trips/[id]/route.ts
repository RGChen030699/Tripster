export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  _context: { params: Promise<{ id: string }> },
): Promise<Response> {
  return Response.json({ error: "Not implemented" }, { status: 501 });
}
