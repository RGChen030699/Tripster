"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  dangerButtonClassName,
  secondaryButtonClassName,
} from "@/components/button-styles";

export function RemoveItineraryButton({
  tripId,
  itemId,
  confirming: confirmingProp,
  onConfirmingChange,
}: {
  tripId: string;
  itemId: string;
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
      const response = await fetch(`/api/trips/${tripId}/itinerary/${itemId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!response.ok) {
        setError("Could not remove the itinerary item. Try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not remove the itinerary item. Try again.");
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
        Remove from itinerary
      </button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label="Remove this itinerary item?"
      className="rounded-md border border-red-300 bg-red-50 p-3"
    >
      <p>Remove this itinerary item?</p>
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
          className={`${dangerButtonClassName} border-red-800 bg-red-800 text-white hover:bg-red-900 focus-visible:outline-red-800`}
        >
          {pending ? "Removing..." : "Remove item"}
        </button>
      </div>
    </div>
  );
}
