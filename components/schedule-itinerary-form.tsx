"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const inputClassName =
  "mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800";

export function ScheduleItineraryForm({
  tripId,
  itemId,
  date,
  startTime,
}: {
  tripId: string;
  itemId: string;
  date?: string;
  startTime?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
      router.refresh();
    } catch {
      setStatus(null);
      setError("Could not save the schedule. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor={`date-${itemId}`} className="block text-sm font-medium">
          Date
        </label>
        <input
          id={`date-${itemId}`}
          name="date"
          type="text"
          defaultValue={date ?? ""}
          autoComplete="off"
          className={inputClassName}
        />
      </div>
      <div>
        <label htmlFor={`time-${itemId}`} className="block text-sm font-medium">
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
        <p role="status" className="rounded-md border border-teal-300 bg-teal-50 px-3 py-2 text-sm text-teal-950">
          {status}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium outline-none hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save schedule"}
      </button>
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
