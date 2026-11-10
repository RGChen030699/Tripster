export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request): Promise<Response> {
  return Response.json({ error: "Not implemented" }, { status: 501 });
}

export async function POST(_request: Request): Promise<Response> {
  return Response.json({ error: "Not implemented" }, { status: 501 });
}
