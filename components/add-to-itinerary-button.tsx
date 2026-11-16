"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddToItineraryButton({
  tripId,
  suggestionId,
}: {
  tripId: string;
  suggestionId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onAdd() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${tripId}/suggestions/${suggestionId}/itinerary`, {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = await readJson(response);
      if (!response.ok) {
        setStatus(null);
        setError(errorMessage(payload, "Could not add that suggestion. Try again."));
        return;
      }
      setStatus("Added to the itinerary.");
      router.refresh();
    } catch {
      setStatus(null);
      setError("Could not add that suggestion. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4">
      {error ? (
        <p role="alert" className="mb-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-950">
          {error}
        </p>
      ) : null}
      {status ? (
        <p role="status" className="mb-2 rounded-md border border-teal-300 bg-teal-50 px-3 py-2 text-sm text-teal-950">
          {status}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => {
          void onAdd();
        }}
        disabled={pending}
        className="rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white outline-none hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add"}
      </button>
    </div>
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return fallback;
}
