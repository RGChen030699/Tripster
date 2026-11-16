"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { VoteChoice, VoteTotals } from "@/lib/suggestions/types";

const CHOICES: { choice: VoteChoice; label: string }[] = [
  { choice: "yes", label: "Yes" },
  { choice: "maybe", label: "Maybe" },
  { choice: "no", label: "No" },
];

const POLL_MS = 4_000;

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
  const pendingRef = useRef(false);

  useEffect(() => {
    setCurrent(myVote);
    setTotals(votes);
  }, [myVote, votes]);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    let cancelled = false;

    async function pollVotes() {
      if (pendingRef.current || document.visibilityState === "hidden") {
        return;
      }
      try {
        const response = await fetch(`/api/trips/${tripId}/suggestions/${suggestionId}/votes`, {
          method: "GET",
          credentials: "same-origin",
        });
        if (!response.ok || cancelled || pendingRef.current) {
          return;
        }
        const payload = await readJson(response);
        const nextTotals = totalsFrom(payload);
        const nextVote = voteFrom(payload);
        if (nextTotals) {
          setTotals(nextTotals);
        }
        if (nextVote !== undefined) {
          setCurrent(nextVote);
        }
      } catch {
        // Keep the last known totals if a poll fails.
      }
    }

    void pollVotes();
    const timer = window.setInterval(() => {
      void pollVotes();
    }, POLL_MS);

    function onVisibility() {
      if (document.visibilityState === "visible") {
        void pollVotes();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tripId, suggestionId]);

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
      <div className="flex flex-wrap gap-3 text-sm text-ink-muted" aria-live="polite">
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
            className="rounded-md border border-sand bg-panel px-3 py-1.5 text-sm font-medium text-ink outline-none hover:bg-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 aria-pressed:border-primary aria-pressed:bg-sand"
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

function voteFrom(payload: unknown): VoteChoice | null | undefined {
  if (typeof payload !== "object" || payload === null || !("vote" in payload)) {
    return undefined;
  }
  if (payload.vote === null) {
    return null;
  }
  if (typeof payload.vote !== "object" || payload.vote === null || !("choice" in payload.vote)) {
    return undefined;
  }
  const choice = payload.vote.choice;
  if (choice === "yes" || choice === "maybe" || choice === "no") {
    return choice;
  }
  return undefined;
}
