"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  dangerButtonClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/button-styles";

export function RemoveMemberButton({
  tripId,
  email,
  confirming: confirmingProp,
  onConfirmingChange,
}: {
  tripId: string;
  email: string;
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
    if (controlled) {
      return null;
    }
    return (
      <button type="button" onClick={() => setConfirming(true)} className={dangerButtonClassName}>
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
