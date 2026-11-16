import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(): Response {
  const document = readFileSync(join(process.cwd(), "openapi/tripster.openapi.json"), "utf8");
  return new Response(document, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
