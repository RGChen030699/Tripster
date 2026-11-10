import Link from "next/link";

import { AddMemberForm } from "@/components/add-member-form";
import type { TripDetails } from "@/lib/trips/types";

const sectionLinkClassName =
  "font-medium text-teal-900 underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800";

export function TripDetail({ trip }: { trip: TripDetails }) {
  return (
    <article className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{trip.name}</h1>
        <p className="mt-3 text-lg">{trip.destination}</p>
        <p className="mt-1 text-stone-700">
          {trip.startDate} to {trip.endDate}
        </p>
      </div>
      <nav aria-label="Trip sections" className="flex flex-wrap gap-4">
        <Link href={`/trips/${trip.id}/suggestions`} className={sectionLinkClassName}>
          Suggestions
        </Link>
      </nav>
      <section aria-labelledby="members-heading">
        <h2 id="members-heading" className="text-lg font-semibold">
          Members
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {trip.members.map((member) => (
            <li key={`${member.role}-${member.email}`} className="flex items-center justify-between gap-4">
              <span>{member.email}</span>
              <span className="text-sm text-stone-700">
                {member.role === "organizer" ? "Organizer" : "Member"}
              </span>
            </li>
          ))}
        </ul>
        {trip.role === "organizer" ? <AddMemberForm tripId={trip.id} /> : null}
      </section>
    </article>
  );
}
