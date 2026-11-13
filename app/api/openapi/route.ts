import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(): Response {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  const document = readFileSync(join(process.cwd(), "openapi/tripster.openapi.json"), "utf8");
  return new Response(document, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
