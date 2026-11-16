"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { SuggestionView } from "@/lib/suggestions/types";
import { parseSuggestionInput } from "@/lib/suggestions/validation";

const inputClassName =
  "mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800";

export function EditSuggestionForm({
  tripId,
  suggestion,
}: {
  tripId: string;
  suggestion: SuggestionView;
}) {
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
      const response = await fetch(`/api/trips/${tripId}/suggestions/${suggestion.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ category, name, description, address, link }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        setStatus(null);
        setError(errorMessage(payload, "Could not save the suggestion. Try again."));
        return;
      }
      setStatus("Saved changes.");
      router.refresh();
    } catch {
      setStatus(null);
      setError("Could not save the suggestion. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
      <div>
        <label htmlFor={`edit-category-${suggestion.id}`} className="block text-sm font-medium">
          Category
        </label>
        <select
          id={`edit-category-${suggestion.id}`}
          name="category"
          defaultValue={suggestion.category}
          className={inputClassName}
        >
          <option value="lodging">Lodging</option>
          <option value="activity">Activity</option>
          <option value="place">Place to visit</option>
          <option value="restaurant">Restaurant</option>
        </select>
      </div>
      <Field id={`edit-name-${suggestion.id}`} label="Name" name="name" defaultValue={suggestion.name} />
      <Field
        id={`edit-description-${suggestion.id}`}
        label="Description"
        name="description"
        defaultValue={suggestion.description ?? ""}
      />
      <Field
        id={`edit-address-${suggestion.id}`}
        label="Address"
        name="address"
        defaultValue={suggestion.address ?? ""}
      />
      <Field id={`edit-link-${suggestion.id}`} label="Link" name="link" defaultValue={suggestion.link ?? ""} />
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
        {pending ? "Saving..." : "Save changes"}
      </button>
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
      <input id={id} name={name} type="text" defaultValue={defaultValue} autoComplete="off" className={inputClassName} />
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
