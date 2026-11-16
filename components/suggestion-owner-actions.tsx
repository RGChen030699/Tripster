"use client";

import { useState } from "react";

import { secondaryButtonClassName } from "@/components/button-styles";
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
        <div
          className="flex flex-wrap items-center gap-3"
          data-testid="suggestion-owner-actions"
        >
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={secondaryButtonClassName}
          >
            Edit
          </button>
          <RemoveSuggestionButton tripId={tripId} suggestionId={suggestion.id} />
        </div>
      )}
    </div>
  );
}
