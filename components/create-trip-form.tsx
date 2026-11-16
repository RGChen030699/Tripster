"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { parseTripInput } from "@/lib/trips/validation";

const inputClassName =
  "mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800";

export function CreateTripForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const destination = String(formData.get("destination") ?? "");
    const startDate = String(formData.get("startDate") ?? "");
    const endDate = String(formData.get("endDate") ?? "");
    const parsed = parseTripInput({ name, destination, startDate, endDate });
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, destination, startDate, endDate }),
      });
      const payload: unknown = await readJson(response);
      if (!response.ok) {
        setError(errorMessage(payload, "Could not create the trip. Try again."));
        return;
      }
      const tripId = tripIdFrom(payload);
      if (!tripId) {
        setError("Could not create the trip. Try again.");
        return;
      }
      router.push(`/trips/${tripId}`);
      router.refresh();
    } catch {
      setError("Could not create the trip. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field id="name" label="Trip name" name="name" type="text" autoComplete="off" />
      <Field id="destination" label="Destination" name="destination" type="text" autoComplete="off" />
      <Field id="startDate" label="Start date" name="startDate" type="text" autoComplete="off" />
      <Field id="endDate" label="End date" name="endDate" type="text" autoComplete="off" />
      <p className="text-sm text-stone-700">Use dates as YYYY-MM-DD.</p>
      {error ? (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-950">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-800 px-4 py-2 font-medium text-white outline-none hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:opacity-60"
      >
        {pending ? "Creating trip..." : "Create trip"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  name,
  type,
  autoComplete,
}: {
  id: string;
  label: string;
  name: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input id={id} name={name} type={type} autoComplete={autoComplete} required className={inputClassName} />
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

function tripIdFrom(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null || !("trip" in payload)) {
    return null;
  }
  const trip = payload.trip;
  if (typeof trip !== "object" || trip === null || !("id" in trip) || typeof trip.id !== "string") {
    return null;
  }
  return trip.id;
}
