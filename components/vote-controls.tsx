"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { VoteChoice, VoteTotals } from "@/lib/suggestions/types";

const CHOICES: { choice: VoteChoice; label: string }[] = [
  { choice: "yes", label: "Yes" },
  { choice: "maybe", label: "Maybe" },
  { choice: "no", label: "No" },
];

export function VoteControls({
  tripId,
  suggestionId,
  votes,
  myVote,
}: {
  tripId: string;
  suggestionId: string;
  votes: VoteTotals;
  myVote: VoteChoice | null;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(myVote);
  const [totals, setTotals] = useState(votes);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function choose(choice: VoteChoice) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${tripId}/suggestions/${suggestionId}/votes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ choice }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        setError(errorMessage(payload, "Could not save your vote. Try again."));
        return;
      }
      setCurrent(choice);
      const nextTotals = totalsFrom(payload);
      if (nextTotals) {
        setTotals(nextTotals);
      }
      router.refresh();
    } catch {
      setError("Could not save your vote. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-3 text-sm text-stone-700">
        <p>Yes {totals.yes}</p>
        <p>Maybe {totals.maybe}</p>
        <p>No {totals.no}</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Vote">
        {CHOICES.map((option) => (
          <button
            key={option.choice}
            type="button"
            aria-pressed={current === option.choice}
            disabled={pending}
            onClick={() => {
              void choose(option.choice);
            }}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-900 outline-none hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:opacity-60 aria-pressed:border-teal-800 aria-pressed:bg-teal-50"
          >
            {option.label}
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-950">
          {error}
        </p>
      ) : null}
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

function totalsFrom(payload: unknown): VoteTotals | null {
  if (typeof payload !== "object" || payload === null || !("votes" in payload)) {
    return null;
  }
  const votes = payload.votes;
  if (typeof votes !== "object" || votes === null) {
    return null;
  }
  const candidate = votes as { yes?: unknown; maybe?: unknown; no?: unknown };
  if (
    typeof candidate.yes !== "number" ||
    typeof candidate.maybe !== "number" ||
    typeof candidate.no !== "number"
  ) {
    return null;
  }
  return { yes: candidate.yes, maybe: candidate.maybe, no: candidate.no };
}
