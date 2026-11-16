"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const inputClassName =
  "mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800";

export function ExpenseForm({
  tripId,
  members,
}: {
  tripId: string;
  members: { email: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const amount = String(formData.get("amount") ?? "");
    const description = String(formData.get("description") ?? "");
    const date = String(formData.get("date") ?? "");
    const payerEmail = String(formData.get("payerEmail") ?? "");
    const participantEmails = formData.getAll("participant").filter((value): value is string => typeof value === "string");
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ amount, description, date, payerEmail, participantEmails }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        setStatus(null);
        setError(errorMessage(payload, "Could not record the expense. Try again."));
        return;
      }
      form.reset();
      setStatus("Recorded the expense.");
      router.refresh();
    } catch {
      setStatus(null);
      setError("Could not record the expense. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field id="expense-amount" label="Amount" name="amount" />
      <Field id="expense-description" label="Description" name="description" />
      <Field id="expense-date" label="Date" name="date" />
      <div>
        <label htmlFor="expense-payer" className="block text-sm font-medium">
          Payer
        </label>
        <select id="expense-payer" name="payerEmail" defaultValue={members[0]?.email ?? ""} className={inputClassName}>
          {members.map((member) => (
            <option key={member.email} value={member.email}>
              {member.email}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Who shares this expense</legend>
        {members.map((member) => (
          <label key={member.email} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="participant" value={member.email} />
            {member.email}
          </label>
        ))}
      </fieldset>
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
        className="self-start rounded-md bg-teal-800 px-3 py-1.5 text-sm font-medium text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:opacity-60"
      >
        {pending ? "Recording..." : "Record expense"}
      </button>
    </form>
  );
}

function Field({ id, label, name }: { id: string; label: string; name: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input id={id} name={name} type="text" autoComplete="off" className={inputClassName} />
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
