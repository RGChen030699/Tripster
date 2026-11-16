"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { primaryButtonClassName, secondaryButtonClassName } from "@/components/button-styles";
import { DateField } from "@/components/date-field";
import { parseTripInput } from "@/lib/trips/validation";

const inputClassName =
  "mt-1 w-full rounded-md border border-sand bg-panel px-3 py-2 font-bold text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function EditTripForm({
  tripId,
  name,
  destination,
  startDate,
  endDate,
  open: openProp,
  onOpenChange,
}: {
  tripId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const controlled = openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
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
    if (controlled) {
      return status ? (
        <p role="status" className="rounded-md border border-sage bg-sand px-3 py-2 text-sm text-ink">
          {status}
        </p>
      ) : null;
    }
    return (
      <div className="flex flex-col gap-2">
        {status ? (
          <p role="status" className="rounded-md border border-sage bg-sand px-3 py-2 text-sm text-ink">
            {status}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
          className={secondaryButtonClassName}
        >
          Edit trip
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="w-full rounded-md border border-sand bg-panel p-4">
      <h2 className="text-lg font-bold">Edit trip</h2>
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
          <button type="button" onClick={() => setOpen(false)} className={secondaryButtonClassName}>
            Cancel
          </button>
          <button type="submit" disabled={pending} className={primaryButtonClassName}>
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
      <label htmlFor={id} className="block text-sm font-bold">
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
