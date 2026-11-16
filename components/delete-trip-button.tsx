"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  dangerButtonClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/button-styles";

export function DeleteTripButton({
  tripId,
  confirming: confirmingProp,
  onConfirmingChange,
}: {
  tripId: string;
  confirming?: boolean;
  onConfirmingChange?: (confirming: boolean) => void;
}) {
  const router = useRouter();
  const controlled = confirmingProp !== undefined;
  const [uncontrolledConfirming, setUncontrolledConfirming] = useState(false);
  const confirming = controlled ? confirmingProp : uncontrolledConfirming;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function setConfirming(next: boolean) {
    if (!controlled) {
      setUncontrolledConfirming(next);
    }
    onConfirmingChange?.(next);
  }

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
    if (controlled) {
      return null;
    }
    return (
      <button type="button" onClick={() => setConfirming(true)} className={dangerButtonClassName}>
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
        <button type="button" onClick={() => setConfirming(false)} className={secondaryButtonClassName}>
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            void remove();
          }}
          className={`${primaryButtonClassName} bg-red-800 focus-visible:outline-red-800`}
        >
          {pending ? "Deleting..." : "Delete trip"}
        </button>
      </div>
    </div>
  );
}
