"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { DateField } from "@/components/date-field";
import { equalShareCents } from "@/lib/expenses/split";
import type { ExpenseSplitMode } from "@/lib/expenses/types";

const inputClassName =
  "mt-1 w-full rounded-md border border-sand bg-panel px-3 py-2 font-bold text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

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
  const [amount, setAmount] = useState("");
  const [splitMode, setSplitMode] = useState<ExpenseSplitMode>("even");
  const [selected, setSelected] = useState<string[]>([]);
  const [shares, setShares] = useState<Record<string, string>>({});

  const selectedMembers = useMemo(
    () => members.filter((member) => selected.includes(member.email)),
    [members, selected],
  );

  const evenShares = useMemo(() => {
    const parsed = parseAmountCents(amount);
    if (parsed === null || selectedMembers.length === 0) {
      return null;
    }
    return equalShareCents(parsed, selectedMembers.length);
  }, [amount, selectedMembers]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const description = String(formData.get("description") ?? "");
    const date = String(formData.get("date") ?? "");
    const payerEmail = String(formData.get("payerEmail") ?? "");
    const participantEmails = selectedMembers.map((member) => member.email);
    if (participantEmails.length === 0) {
      setStatus(null);
      setError("Select at least one trip member who shares this expense.");
      return;
    }
    const participantShares =
      splitMode === "manual" ? participantEmails.map((email) => shares[email] ?? "") : undefined;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          amount,
          description,
          date,
          payerEmail,
          participantEmails,
          splitMode,
          participantShares,
        }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        setStatus(null);
        setError(errorMessage(payload, "Could not record the expense. Try again."));
        return;
      }
      form.reset();
      setAmount("");
      setSplitMode("even");
      setSelected([]);
      setShares({});
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
      <div>
        <label htmlFor="expense-amount" className="block text-sm font-bold">
          Amount
        </label>
        <input
          id="expense-amount"
          name="amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className={inputClassName}
        />
      </div>
      <Field id="expense-description" label="Description" name="description" />
      <DateField id="expense-date" label="Date" name="date" />
      <div>
        <label htmlFor="expense-payer" className="block text-sm font-bold">
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
        <legend className="text-sm font-bold">Who shares this expense</legend>
        <p className="text-sm text-ink-muted">
          Even and manual splits only include the members you check. Unchecked members are left out.
        </p>
        {members.map((member) => (
          <label key={member.email} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="participant"
              value={member.email}
              checked={selected.includes(member.email)}
              onChange={(event) => {
                const checked = event.target.checked;
                setSelected((current) =>
                  checked ? [...current, member.email] : current.filter((email) => email !== member.email),
                );
              }}
            />
            {member.email}
          </label>
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-bold">Split</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="splitMode"
            value="even"
            checked={splitMode === "even"}
            onChange={() => setSplitMode("even")}
          />
          Even split
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="splitMode"
            value="manual"
            checked={splitMode === "manual"}
            onChange={() => setSplitMode("manual")}
          />
          Manual split
        </label>
      </fieldset>
      {splitMode === "even" ? (
        <div className="rounded-md border border-sand bg-panel px-3 py-2 text-sm" aria-live="polite">
          {selectedMembers.length === 0 ? (
            <p className="text-ink-muted">Check who shares above to preview the even split.</p>
          ) : evenShares === null ? (
            <p className="text-ink-muted">Enter an amount to preview each person’s share.</p>
          ) : (
            <>
              <p className="font-bold">Even split preview</p>
              <ul className="mt-2 flex flex-col gap-1">
                {selectedMembers.map((member, index) => (
                  <li key={member.email}>
                    {member.email}: {formatCents(evenShares[index] ?? 0)} USD
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
      {splitMode === "manual" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-bold">Share amounts</legend>
          <p className="text-sm text-ink-muted">
            Use dollars and cents (for example 20.50). Any amount left after these shares goes to the
            payer. Leave the payer’s field blank to put the whole leftover on them. Shares cannot go
            over the expense total.
          </p>
          {selectedMembers.length === 0 ? (
            <p className="text-sm text-ink-muted">Select members above, then enter each person’s share.</p>
          ) : (
            selectedMembers.map((member) => (
              <div key={member.email}>
                <label htmlFor={`share-${member.email}`} className="block text-sm font-bold">
                  {member.email}
                </label>
                <input
                  id={`share-${member.email}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  value={shares[member.email] ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setShares((current) => ({ ...current, [member.email]: value }));
                  }}
                  className={inputClassName}
                />
              </div>
            ))
          )}
        </fieldset>
      ) : null}
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
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md border border-sage bg-sage px-3 py-1.5 text-sm font-bold text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
      >
        {pending ? "Recording..." : "Record expense"}
      </button>
    </form>
  );
}

function Field({ id, label, name }: { id: string; label: string; name: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold">
        {label}
      </label>
      <input id={id} name={name} type="text" autoComplete="off" className={inputClassName} />
    </div>
  );
}

function parseAmountCents(value: string): number | null {
  if (!/^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/.test(value.trim())) {
    return null;
  }
  const [dollars, fraction = ""] = value.trim().split(".");
  const amountCents = Number(dollars) * 100 + Number((fraction + "00").slice(0, 2));
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    return null;
  }
  return amountCents;
}

function formatCents(cents: number): string {
  const dollars = Math.trunc(cents / 100);
  const fraction = String(Math.abs(cents % 100)).padStart(2, "0");
  return `${dollars}.${fraction}`;
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
