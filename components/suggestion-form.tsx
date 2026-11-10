"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { parseSuggestionInput } from "@/lib/suggestions/validation";

const inputClassName =
  "mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800";

export function SuggestionForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const category = String(new FormData(form).get("category") ?? "");
    const name = String(new FormData(form).get("name") ?? "");
    const description = String(new FormData(form).get("description") ?? "");
    const address = String(new FormData(form).get("address") ?? "");
    const link = String(new FormData(form).get("link") ?? "");
    const parsed = parseSuggestionInput({ category, name, description, address, link });
    if (!parsed.ok) {
      setStatus(null);
      setError(parsed.error);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${tripId}/suggestions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ category, name, description, address, link }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        setStatus(null);
        setError(errorMessage(payload, "Could not add the suggestion. Try again."));
        return;
      }
      const addedName = suggestionNameFrom(payload);
      form.reset();
      setStatus(addedName ? `Added ${addedName}.` : "Added the suggestion.");
      router.refresh();
    } catch {
      setStatus(null);
      setError("Could not add the suggestion. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="suggestion-category" className="block text-sm font-medium">
          Category
        </label>
        <select id="suggestion-category" name="category" required className={inputClassName} defaultValue="">
          <option value="">Choose a category</option>
          <option value="lodging">Lodging</option>
          <option value="activity">Activity</option>
          <option value="place">Place to visit</option>
          <option value="restaurant">Restaurant</option>
        </select>
      </div>
      <Field id="suggestion-name" label="Name" name="name" />
      <div>
        <label htmlFor="suggestion-description" className="block text-sm font-medium">
          Description
        </label>
        <textarea id="suggestion-description" name="description" rows={3} className={inputClassName} />
      </div>
      <Field id="suggestion-address" label="Address" name="address" />
      <Field id="suggestion-link" label="Link" name="link" />
      <p className="text-sm text-stone-700">Description, address, and link are optional.</p>
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
        {pending ? "Adding suggestion..." : "Add suggestion"}
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

function suggestionNameFrom(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null || !("suggestion" in payload)) {
    return null;
  }
  const suggestion = payload.suggestion;
  if (
    typeof suggestion !== "object" ||
    suggestion === null ||
    !("name" in suggestion) ||
    typeof suggestion.name !== "string"
  ) {
    return null;
  }
  return suggestion.name;
}
