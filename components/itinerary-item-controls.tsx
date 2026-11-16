"use client";

import { useState } from "react";

import { RemoveItineraryButton } from "@/components/remove-itinerary-button";
import { ScheduleItineraryForm } from "@/components/schedule-itinerary-form";
import type { ItineraryItemView } from "@/lib/itinerary/types";

export function ItineraryItemControls({
  tripId,
  item,
}: {
  tripId: string;
  item: ItineraryItemView;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mt-3">
      {editing ? (
        <ScheduleItineraryForm
          tripId={tripId}
          itemId={item.id}
          date={item.date}
          startTime={item.startTime}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-teal-900 underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
        >
          {item.unscheduled ? "Schedule" : "Edit schedule"}
        </button>
      )}
      <RemoveItineraryButton tripId={tripId} itemId={item.id} />
    </div>
  );
}
