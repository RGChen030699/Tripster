"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { parseMemberEmail } from "@/lib/trips/validation";

const inputClassName =
  "mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800";

export function AddMemberForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");
    const parsed = parseMemberEmail(email);
    if (!parsed.ok) {
      setStatus(null);
      setError(parsed.error);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${tripId}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        setStatus(null);
        setError(errorMessage(payload, "Could not add that member. Try again."));
        return;
      }
      const addedEmail = memberEmailFrom(payload);
      form.reset();
      setStatus(addedEmail ? `Added ${addedEmail}.` : "Added the member.");
      router.refresh();
    } catch {
      setStatus(null);
      setError("Could not add that member. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
      <div>
        <label htmlFor="member-email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="member-email"
          name="email"
          type="email"
          autoComplete="off"
          required
          className={inputClassName}
        />
      </div>
      <p className="text-sm text-stone-700">Add someone who already has a Tripster account.</p>
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
        className="self-start rounded-md bg-teal-800 px-4 py-2 font-medium text-white outline-none hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:opacity-60"
      >
        {pending ? "Adding member..." : "Add member"}
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

function memberEmailFrom(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null || !("member" in payload)) {
    return null;
  }
  const member = payload.member;
  if (
    typeof member !== "object" ||
    member === null ||
    !("email" in member) ||
    typeof member.email !== "string"
  ) {
    return null;
  }
  return member.email;
}
