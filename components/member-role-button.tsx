"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { secondaryButtonClassName } from "@/components/button-styles";
import type { TripRole } from "@/lib/trips/types";

export function MemberRoleButton({
  tripId,
  email,
  role,
}: {
  tripId: string;
  email: string;
  role: TripRole;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const nextRole: TripRole = role === "organizer" ? "member" : "organizer";
  const label = role === "organizer" ? "Remove organizer" : "Make organizer";

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
      router.refresh();
    } catch {
      setError("Could not update that role. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          void updateRole();
        }}
        className={secondaryButtonClassName}
      >
        {pending ? "Updating..." : label}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-950">
          {error}
        </p>
      ) : null}
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
