export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(): Response {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
