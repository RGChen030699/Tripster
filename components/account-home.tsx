import Link from "next/link";

import { primaryButtonClassName, secondaryButtonClassName } from "@/components/button-styles";
import { LogoutButton } from "@/components/logout-button";
import type { TripSummary } from "@/lib/trips/types";

const tripSurfaces = ["bg-sand", "bg-sage", "bg-clay"] as const;

export function AccountHome({
  email,
  trips = [],
}: {
  email: string | null;
  trips?: TripSummary[];
}) {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-10">
      {email ? (
        <section className="rounded-2xl border border-sand bg-panel p-6" aria-labelledby="account-heading">
          <h1 id="account-heading" className="font-display text-2xl font-semibold tracking-tight text-ink">
            Your account
          </h1>
          <p className="mt-2 text-ink-muted">
            Signed in as <span className="font-medium text-ink">{email}</span>
          </p>
          <div className="mt-4">
            <LogoutButton />
          </div>
        </section>
      ) : null}
      {email ? (
        <section aria-labelledby="trips-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="trips-heading" className="font-display text-2xl font-semibold tracking-tight text-ink">
              Your trips
            </h2>
            <Link href="/trips/new" className={primaryButtonClassName}>
              Create a trip
            </Link>
          </div>
          {trips.length === 0 ? (
            <p className="mt-3 text-ink-muted">You have no trips yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {trips.map((trip, index) => (
                <li key={trip.id}>
                  <Link
                    href={`/trips/${trip.id}`}
                    className={`block rounded-2xl px-5 py-6 outline-none transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${tripSurfaces[index % tripSurfaces.length]}`}
                  >
                    <span className="font-display text-xl font-semibold text-ink">{trip.name}</span>
                    <p className="mt-2 text-ink">{trip.destination}</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {trip.startDate} to {trip.endDate}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-sand bg-panel p-6" aria-labelledby="welcome-heading">
          <h1 id="welcome-heading" className="font-display text-2xl font-semibold tracking-tight text-ink">
            Create an account or log in
          </h1>
          <p className="mt-2 text-ink-muted">
            Use your email address and a password to plan trips with your group.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/register" className={primaryButtonClassName}>
              Create an account
            </Link>
            <Link href="/login" className={secondaryButtonClassName}>
              Log in
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
