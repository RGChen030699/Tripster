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
    return <p className="text-ink-muted">Nothing is on the itinerary yet.</p>;
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
          <h2 className="text-lg font-bold">{date}</h2>
          <ul className="mt-3 flex flex-col gap-4">
            {group.map((item) => (
              <ItemCard key={item.id} item={item} tripId={tripId} />
            ))}
          </ul>
        </section>
      ))}
      {unscheduled.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold">Unscheduled</h2>
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
}: {
  item: ItineraryItemView;
  tripId?: string;
}) {
  return (
    <li className="rounded-lg border border-sand bg-panel p-4">
      <h3 className="text-lg font-bold">{item.name}</h3>
      <p className="mt-1 text-sm text-ink-muted">{CATEGORY_LABELS[item.category]}</p>
      {item.unscheduled || !item.date ? null : <ScheduleSummary item={item} />}
      {tripId ? <ItineraryItemControls tripId={tripId} item={item} /> : null}
    </li>
  );
}

function ScheduleSummary({ item }: { item: ItineraryItemView }) {
  if (item.category === "lodging") {
    return (
      <div className="mt-2">
        <p>Check-in: {item.date}</p>
        <p>Check-out: {item.endDate ?? "Not set"}</p>
      </div>
    );
  }
  return <p className="mt-2">{item.startTime ?? "No time"}</p>;
}
