import { AddToItineraryButton } from "@/components/add-to-itinerary-button";
import { VoteControls } from "@/components/vote-controls";
import type { SuggestionCategory, SuggestionView } from "@/lib/suggestions/types";

const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  lodging: "Lodging",
  activity: "Activity",
  place: "Place to visit",
  restaurant: "Restaurant",
};

export function SuggestionList({
  tripId,
  suggestions,
}: {
  tripId: string;
  suggestions: SuggestionView[];
}) {
  if (suggestions.length === 0) {
    return <p className="text-stone-700">No suggestions yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {suggestions.map((suggestion) => (
        <li key={suggestion.id} className="rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="text-lg font-semibold">{suggestion.name}</h2>
          <p className="mt-1 text-sm text-stone-700">{CATEGORY_LABELS[suggestion.category]}</p>
          <p className="mt-2">Suggested by {suggestion.authorEmail}</p>
          {suggestion.description ? <p className="mt-2">{suggestion.description}</p> : null}
          {suggestion.address ? <p className="mt-1">{suggestion.address}</p> : null}
          {suggestion.link ? (
            <p className="mt-2">
              <a
                href={suggestion.link}
                className="font-medium text-teal-900 underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
              >
                {suggestion.link}
              </a>
            </p>
          ) : null}
          <VoteControls
            tripId={tripId}
            suggestionId={suggestion.id}
            votes={suggestion.votes}
            myVote={suggestion.myVote}
          />
          <AddToItineraryButton tripId={tripId} suggestionId={suggestion.id} />
        </li>
      ))}
    </ul>
  );
}
