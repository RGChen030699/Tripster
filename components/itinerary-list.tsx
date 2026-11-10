import type { ItineraryItemView } from "@/lib/itinerary/types";
import type { SuggestionCategory } from "@/lib/suggestions/types";

const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  lodging: "Lodging",
  activity: "Activity",
  place: "Place to visit",
  restaurant: "Restaurant",
};

export function ItineraryList({ items }: { items: ItineraryItemView[] }) {
  if (items.length === 0) {
    return <p className="text-stone-700">Nothing is on the itinerary yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={item.id} className="rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="text-lg font-semibold">{item.name}</h2>
          <p className="mt-1 text-sm text-stone-700">{CATEGORY_LABELS[item.category]}</p>
          <p className="mt-2">Unscheduled</p>
        </li>
      ))}
    </ul>
  );
}
