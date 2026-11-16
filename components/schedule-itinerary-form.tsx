"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { primaryButtonClassName, secondaryButtonClassName } from "@/components/button-styles";
import { DateField } from "@/components/date-field";

const inputClassName =
  "mt-1 w-full rounded-md border border-sand bg-panel px-3 py-2 font-bold text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function ScheduleItineraryForm({
  tripId,
  itemId,
  date,
  startTime,
  open: openProp,
  onOpenChange,
}: {
  tripId: string;
  itemId: string;
  date?: string;
  startTime?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const controlled = openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(true);
  const open = controlled ? openProp : uncontrolledOpen;
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function setOpen(next: boolean) {
    if (!controlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextDate = String(formData.get("date") ?? "");
    const nextTime = String(formData.get("startTime") ?? "");
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${tripId}/itinerary/${itemId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ date: nextDate, startTime: nextTime }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        setStatus(null);
        setError(errorMessage(payload, "Could not save the schedule. Try again."));
        return;
      }
      setStatus("Saved the schedule.");
      setOpen(false);
      router.refresh();
    } catch {
      setStatus(null);
      setError("Could not save the schedule. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return status ? (
      <p role="status" className="rounded-md border border-sage bg-sand px-3 py-2 text-sm text-ink">
        {status}
      </p>
    ) : null;
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex w-full flex-col gap-3">
      <DateField id={`date-${itemId}`} label="Date" name="date" defaultValue={date ?? ""} />
      <div>
        <label htmlFor={`time-${itemId}`} className="block text-sm font-bold">
          Time
        </label>
        <input
          id={`time-${itemId}`}
          name="startTime"
          type="text"
          defaultValue={startTime ?? ""}
          autoComplete="off"
          placeholder="HH:MM"
          className={inputClassName}
        />
      </div>
      {error ? (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-950">
          {error}
        </p>
      ) : null}
      {status ? (
        <p role="status" className="rounded-md border border-sage bg-sand px-3 py-2 text-sm text-ink">
          {status}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setOpen(false)} className={secondaryButtonClassName}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={primaryButtonClassName}>
          {pending ? "Saving..." : "Save schedule"}
        </button>
      </div>
    </form>
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
