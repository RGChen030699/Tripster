"use client";

import { useState } from "react";

import { ActionMenu } from "@/components/action-menu";
import { dangerMenuItemClassName, menuItemClassName } from "@/components/button-styles";
import { MemberRoleButton } from "@/components/member-role-button";
import { RemoveMemberButton } from "@/components/remove-member-button";
import type { TripRole } from "@/lib/trips/types";

export function MemberActionsMenu({
  tripId,
  email,
  role,
  canChangeRole,
  canRemove,
}: {
  tripId: string;
  email: string;
  role: TripRole;
  canChangeRole: boolean;
  canRemove: boolean;
}) {
  const [panel, setPanel] = useState<"none" | "role" | "remove">("none");

  if (!canChangeRole && !canRemove) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <ActionMenu label="Member actions" ariaLabel={`Actions for ${email}`}>
        {(close) => (
          <>
            {canChangeRole ? (
              <button
                type="button"
                role="menuitem"
                className={menuItemClassName}
                onClick={() => {
                  close();
                  setPanel("role");
                }}
              >
                {role === "organizer" ? "Remove organizer" : "Make organizer"}
              </button>
            ) : null}
            {canRemove ? (
              <button
                type="button"
                role="menuitem"
                className={dangerMenuItemClassName}
                onClick={() => {
                  close();
                  setPanel("remove");
                }}
              >
                Remove
              </button>
            ) : null}
          </>
        )}
      </ActionMenu>
      {panel === "role" && canChangeRole ? (
        <MemberRoleButton tripId={tripId} email={email} role={role} />
      ) : null}
      {panel === "remove" && canRemove ? (
        <RemoveMemberButton
          tripId={tripId}
          email={email}
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
