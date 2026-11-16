"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { DateField } from "@/components/date-field";
import { parseTripInput } from "@/lib/trips/validation";

const inputClassName =
  "mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800";

export function EditTripForm({
  tripId,
  name,
  destination,
  startDate,
  endDate,
}: {
  tripId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextName = String(formData.get("name") ?? "");
    const nextDestination = String(formData.get("destination") ?? "");
    const nextStartDate = String(formData.get("startDate") ?? "");
    const nextEndDate = String(formData.get("endDate") ?? "");
    const parsed = parseTripInput({
      name: nextName,
      destination: nextDestination,
      startDate: nextStartDate,
      endDate: nextEndDate,
    });
    if (!parsed.ok) {
      setStatus(null);
      setError(parsed.error);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: nextName,
          destination: nextDestination,
          startDate: nextStartDate,
          endDate: nextEndDate,
        }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        setStatus(null);
        setError(errorMessage(payload, "Could not save the trip. Try again."));
        return;
      }
      setStatus("Saved trip details.");
      setOpen(false);
      router.refresh();
    } catch {
      setStatus(null);
      setError("Could not save the trip. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        {status ? (
          <p role="status" className="rounded-md border border-teal-300 bg-teal-50 px-3 py-2 text-sm text-teal-950">
            {status}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
          className="self-start text-sm font-medium text-teal-900 underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
        >
          Edit trip
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="rounded-md border border-stone-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Edit trip</h2>
      <div className="mt-4 flex flex-col gap-3">
        <Field id="edit-name" label="Trip name" name="name" defaultValue={name} />
        <Field id="edit-destination" label="Destination" name="destination" defaultValue={destination} />
        <DateField id="edit-startDate" label="Start date" name="startDate" defaultValue={startDate} required />
        <DateField id="edit-endDate" label="End date" name="endDate" defaultValue={endDate} required />
        {error ? (
          <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-950">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-teal-800 px-3 py-1.5 text-sm font-medium text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save trip"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  name,
  defaultValue,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        defaultValue={defaultValue}
        autoComplete="off"
        required
        className={inputClassName}
      />
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
