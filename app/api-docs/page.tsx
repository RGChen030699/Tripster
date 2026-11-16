import type { Metadata } from "next";

import { ApiDocsViewer } from "@/components/api-docs-viewer";

export const metadata: Metadata = {
  title: "Tripster API docs",
  description: "OpenAPI 3.1 documentation for the Tripster HTTP API.",
};

const REPO_OPENAPI_URL =
  "https://github.com/RGChen030699/Tripster/blob/main/openapi/tripster.openapi.json";
const REPO_RAW_OPENAPI_URL =
  "https://raw.githubusercontent.com/RGChen030699/Tripster/main/openapi/tripster.openapi.json";

export default function ApiDocsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl tracking-tight text-ink">Tripster API</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/80">
        OpenAPI 3.1 for accounts, trips, suggestions, votes, itinerary, and expenses. Available in
        production for graders and reviewers.
      </p>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink/80">
        <li>
          Live JSON:{" "}
          <a className="font-semibold text-ink underline decoration-sage underline-offset-2" href="/api/openapi">
            /api/openapi
          </a>
        </li>
        <li>
          Repo file:{" "}
          <a
            className="font-semibold text-ink underline decoration-sage underline-offset-2"
            href={REPO_OPENAPI_URL}
          >
            openapi/tripster.openapi.json
          </a>
        </li>
        <li>
          Raw JSON:{" "}
          <a
            className="font-semibold text-ink underline decoration-sage underline-offset-2"
            href={REPO_RAW_OPENAPI_URL}
          >
            raw.githubusercontent.com/…/tripster.openapi.json
          </a>
        </li>
      </ul>
      <ApiDocsViewer specUrl="/api/openapi" />
    </main>
  );
}
