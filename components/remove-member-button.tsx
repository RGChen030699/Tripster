"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RemoveMemberButton({ tripId, email }: { tripId: string; email: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${tripId}/members`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const payload = await readJson(response);
        setError(errorMessage(payload, "Could not remove that member. Try again."));
        return;
      }
      router.refresh();
    } catch {
      setError("Could not remove that member. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-red-900 underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800"
      >
        Remove
      </button>
    );
  }

  return (
    <div role="alertdialog" aria-label={`Remove ${email}?`} className="rounded-md border border-red-300 bg-red-50 p-3">
      <p>Remove {email} from this trip?</p>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-950">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            void remove();
          }}
          className="rounded-md bg-red-800 px-3 py-1.5 text-sm font-medium text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800 disabled:opacity-60"
        >
          {pending ? "Removing..." : "Remove member"}
        </button>
      </div>
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
