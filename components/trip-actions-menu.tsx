"use client";

import { useState } from "react";

import { ActionMenu } from "@/components/action-menu";
import { dangerMenuItemClassName, menuItemClassName } from "@/components/button-styles";
import { DeleteTripButton } from "@/components/delete-trip-button";
import { EditTripForm } from "@/components/edit-trip-form";

export function TripActionsMenu({
  tripId,
  name,
  destination,
  startDate,
  endDate,
}: {
  tripId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
}) {
  const [panel, setPanel] = useState<"none" | "edit" | "delete">("none");

  return (
    <div className="flex flex-col items-start gap-3">
      <ActionMenu label="Trip actions">
        {(close) => (
          <>
            <button
              type="button"
              role="menuitem"
              className={menuItemClassName}
              onClick={() => {
                close();
                setPanel("edit");
              }}
            >
              Edit trip
            </button>
            <button
              type="button"
              role="menuitem"
              className={dangerMenuItemClassName}
              onClick={() => {
                close();
                setPanel("delete");
              }}
            >
              Delete trip
            </button>
          </>
        )}
      </ActionMenu>
      {panel === "edit" ? (
        <EditTripForm
          tripId={tripId}
          name={name}
          destination={destination}
          startDate={startDate}
          endDate={endDate}
          open
          onOpenChange={(next) => {
            if (!next) {
              setPanel("none");
            }
          }}
        />
      ) : null}
      {panel === "delete" ? (
        <DeleteTripButton
          tripId={tripId}
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
