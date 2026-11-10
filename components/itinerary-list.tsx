import { ItineraryItemControls } from "@/components/itinerary-item-controls";
import { compareItineraryItems } from "@/lib/itinerary/order";
import type { ItineraryItemView } from "@/lib/itinerary/types";
import type { SuggestionCategory } from "@/lib/suggestions/types";

const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  lodging: "Lodging",
  activity: "Activity",
  place: "Place to visit",
  restaurant: "Restaurant",
};

export function ItineraryList({
  items,
  tripId,
}: {
  items: ItineraryItemView[];
  tripId?: string;
}) {
  if (items.length === 0) {
    return <p className="text-stone-700">Nothing is on the itinerary yet.</p>;
  }

  const ordered = [...items].sort(compareItineraryItems);
  const scheduled = new Map<string, ItineraryItemView[]>();
  const unscheduled: ItineraryItemView[] = [];
  for (const item of ordered) {
    if (item.unscheduled || !item.date) {
      unscheduled.push(item);
      continue;
    }
    const group = scheduled.get(item.date) ?? [];
    group.push(item);
    scheduled.set(item.date, group);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...scheduled.entries()].map(([date, group]) => (
        <section key={date}>
          <h2 className="text-lg font-semibold">{date}</h2>
          <ul className="mt-3 flex flex-col gap-4">
            {group.map((item) => (
              <ItemCard key={item.id} item={item} tripId={tripId} timeLabel={item.startTime ?? "No time"} />
            ))}
          </ul>
        </section>
      ))}
      {unscheduled.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Unscheduled</h2>
          <ul className="mt-3 flex flex-col gap-4">
            {unscheduled.map((item) => (
              <ItemCard key={item.id} item={item} tripId={tripId} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ItemCard({
  item,
  tripId,
  timeLabel,
}: {
  item: ItineraryItemView;
  tripId?: string;
  timeLabel?: string;
}) {
  return (
    <li className="rounded-lg border border-stone-200 bg-white p-4">
      <h3 className="text-lg font-semibold">{item.name}</h3>
      <p className="mt-1 text-sm text-stone-700">{CATEGORY_LABELS[item.category]}</p>
      {timeLabel ? <p className="mt-2">{timeLabel}</p> : null}
      {tripId ? <ItineraryItemControls tripId={tripId} item={item} /> : null}
    </li>
  );
}
