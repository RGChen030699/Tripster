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
    <div className="relative">
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
        <div className="absolute right-0 top-full z-20 mt-2 w-72">
          <MemberRoleButton
            tripId={tripId}
            email={email}
            role={role}
            confirming
            onConfirmingChange={(next) => {
              if (!next) {
                setPanel("none");
              }
            }}
          />
        </div>
      ) : null}
      {panel === "remove" && canRemove ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-72">
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
        </div>
      ) : null}
    </div>
  );
}
