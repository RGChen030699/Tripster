import Link from "next/link";

import { AddMemberForm } from "@/components/add-member-form";
import { DeleteTripButton } from "@/components/delete-trip-button";
import { EditTripForm } from "@/components/edit-trip-form";
import { MemberRoleButton } from "@/components/member-role-button";
import { RemoveMemberButton } from "@/components/remove-member-button";
import type { TripDetails } from "@/lib/trips/types";

const sectionLinkClassName =
  "font-medium text-teal-900 underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800";

export function TripDetail({ trip }: { trip: TripDetails }) {
  const isOrganizer = trip.role === "organizer";
  const organizerCount = trip.members.filter((member) => member.role === "organizer").length;

  return (
    <article className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{trip.name}</h1>
        <p className="mt-3 text-lg">{trip.destination}</p>
        <p className="mt-1 text-stone-700">
          {trip.startDate} to {trip.endDate}
        </p>
        {isOrganizer ? (
          <div className="mt-4 flex flex-col gap-3">
            <EditTripForm
              tripId={trip.id}
              name={trip.name}
              destination={trip.destination}
              startDate={trip.startDate}
              endDate={trip.endDate}
            />
            <DeleteTripButton tripId={trip.id} />
          </div>
        ) : null}
      </div>
      <nav aria-label="Trip sections" className="flex flex-wrap gap-4">
        <Link href={`/trips/${trip.id}/suggestions`} className={sectionLinkClassName}>
          Suggestions
        </Link>
        <Link href={`/trips/${trip.id}/itinerary`} className={sectionLinkClassName}>
          Itinerary
        </Link>
        <Link href={`/trips/${trip.id}/expenses`} className={sectionLinkClassName}>
          Expenses
        </Link>
      </nav>
      <section aria-labelledby="members-heading">
        <h2 id="members-heading" className="text-lg font-semibold">
          Members
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {trip.members.map((member) => {
            const canChangeRole =
              isOrganizer && (member.role === "member" || organizerCount > 1);
            const canRemove =
              isOrganizer && (member.role === "member" || organizerCount > 1);
            return (
              <li key={`${member.role}-${member.email}`} className="flex items-start justify-between gap-4">
                <span>{member.email}</span>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm text-stone-700">
                    {member.role === "organizer" ? "Organizer" : "Member"}
                  </span>
                  {canChangeRole ? (
                    <MemberRoleButton tripId={trip.id} email={member.email} role={member.role} />
                  ) : null}
                  {canRemove ? <RemoveMemberButton tripId={trip.id} email={member.email} /> : null}
                </div>
              </li>
            );
          })}
        </ul>
        {isOrganizer ? <AddMemberForm tripId={trip.id} /> : null}
      </section>
    </article>
  );
}
