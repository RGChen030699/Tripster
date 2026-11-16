import Link from "next/link";

import { AddMemberForm } from "@/components/add-member-form";
import { secondaryButtonClassName } from "@/components/button-styles";
import { MemberActionsMenu } from "@/components/member-actions-menu";
import { TripActionsMenu } from "@/components/trip-actions-menu";
import type { TripDetails } from "@/lib/trips/types";

export function TripDetail({ trip }: { trip: TripDetails }) {
  const isOrganizer = trip.role === "organizer";
  const organizerCount = trip.members.filter((member) => member.role === "organizer").length;

  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{trip.name}</h1>
          <p className="mt-3 text-lg">{trip.destination}</p>
          <p className="mt-1 text-stone-700">
            {trip.startDate} to {trip.endDate}
          </p>
        </div>
        {isOrganizer ? (
          <TripActionsMenu
            tripId={trip.id}
            name={trip.name}
            destination={trip.destination}
            startDate={trip.startDate}
            endDate={trip.endDate}
          />
        ) : null}
      </div>
      <nav aria-label="Trip sections" className="flex flex-wrap gap-2">
        <Link href={`/trips/${trip.id}/suggestions`} className={secondaryButtonClassName}>
          Suggestions
        </Link>
        <Link href={`/trips/${trip.id}/itinerary`} className={secondaryButtonClassName}>
          Itinerary
        </Link>
        <Link href={`/trips/${trip.id}/expenses`} className={secondaryButtonClassName}>
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
                  <MemberActionsMenu
                    tripId={trip.id}
                    email={member.email}
                    role={member.role}
                    canChangeRole={canChangeRole}
                    canRemove={canRemove}
                  />
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
