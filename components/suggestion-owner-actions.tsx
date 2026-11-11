"use client";

import { useState } from "react";

import { EditSuggestionForm } from "@/components/edit-suggestion-form";
import { RemoveSuggestionButton } from "@/components/remove-suggestion-button";
import type { SuggestionView } from "@/lib/suggestions/types";

export function SuggestionOwnerActions({
  tripId,
  suggestion,
}: {
  tripId: string;
  suggestion: SuggestionView;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mt-3">
      {editing ? (
        <EditSuggestionForm tripId={tripId} suggestion={suggestion} />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-teal-900 underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
        >
          Edit
        </button>
      )}
      <RemoveSuggestionButton tripId={tripId} suggestionId={suggestion.id} />
    </div>
  );
}
