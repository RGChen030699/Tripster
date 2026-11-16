"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { secondaryButtonClassName } from "@/components/button-styles";
import type { TripRole } from "@/lib/trips/types";

export function MemberRoleButton({
  tripId,
  email,
  role,
  confirming = true,
  onConfirmingChange,
}: {
  tripId: string;
  email: string;
  role: TripRole;
  confirming?: boolean;
  onConfirmingChange?: (confirming: boolean) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const nextRole: TripRole = role === "organizer" ? "member" : "organizer";
  const actionLabel = role === "organizer" ? "Remove organizer" : "Make organizer";
  const prompt =
    role === "organizer"
      ? `Remove organizer from ${email}?`
      : `Make ${email} an organizer?`;

  async function updateRole() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${tripId}/members`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, role: nextRole }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        setError(errorMessage(payload, "Could not update that role. Try again."));
        return;
      }
      onConfirmingChange?.(false);
      router.refresh();
    } catch {
      setError("Could not update that role. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (!confirming) {
    return null;
  }

  return (
    <div
      role="alertdialog"
      aria-label={prompt}
      className="rounded-md border border-sand bg-panel p-3 text-left"
    >
      <p>{prompt}</p>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-950">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => onConfirmingChange?.(false)}
          className={secondaryButtonClassName}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            void updateRole();
          }}
          className={secondaryButtonClassName}
        >
          {pending ? "Updating..." : actionLabel}
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
