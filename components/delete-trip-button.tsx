"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteTripButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!response.ok) {
        setError("Could not delete the trip. Try again.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not delete the trip. Try again.");
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
        Delete trip
      </button>
    );
  }

  return (
    <div role="alertdialog" aria-label="Delete this trip?" className="rounded-md border border-red-300 bg-red-50 p-3">
      <p>Delete this trip? This cannot be undone.</p>
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
          {pending ? "Deleting..." : "Delete trip"}
        </button>
      </div>
    </div>
  );
}
