"use client";

import { useState } from "react";

import { ActionMenu } from "@/components/action-menu";
import { dangerMenuItemClassName, menuItemClassName } from "@/components/button-styles";
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
  const [panel, setPanel] = useState<"none" | "schedule" | "remove">("none");
  const scheduleLabel = item.unscheduled ? "Schedule" : "Edit schedule";

  return (
    <div className="mt-3 flex flex-col items-start gap-3">
      <ActionMenu label="Itinerary actions" ariaLabel={`Itinerary actions for ${item.name}`}>
        {(close) => (
          <>
            <button
              type="button"
              role="menuitem"
              className={menuItemClassName}
              onClick={() => {
                close();
                setPanel("schedule");
              }}
            >
              {scheduleLabel}
            </button>
            <button
              type="button"
              role="menuitem"
              className={dangerMenuItemClassName}
              onClick={() => {
                close();
                setPanel("remove");
              }}
            >
              Remove from itinerary
            </button>
          </>
        )}
      </ActionMenu>
      {panel === "schedule" ? (
        <ScheduleItineraryForm
          tripId={tripId}
          itemId={item.id}
          date={item.date}
          startTime={item.startTime}
          open
          onOpenChange={(next) => {
            if (!next) {
              setPanel("none");
            }
          }}
        />
      ) : null}
      {panel === "remove" ? (
        <RemoveItineraryButton
          tripId={tripId}
          itemId={item.id}
          confirming
          onConfirmingChange={(next) => {
            if (!next) {
              setPanel("none");
            }
          }}
        />
      ) : null}
    </div>
  );
}
