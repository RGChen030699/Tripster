import Link from "next/link";
import { cookies } from "next/headers";

import { secondaryButtonClassName } from "@/components/button-styles";
import { TripDetail } from "@/components/trip-detail";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";
import { getAuthService } from "@/lib/auth/container";
import { getTripService } from "@/lib/trips/container";

export const dynamic = "force-dynamic";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = await getAuthService().getSession(token);
  if (!session.ok) {
    return <MissingTrip />;
  }

  const result = await getTripService().getTrip(session.user.id, id);
  if (!result.ok) {
    return <MissingTrip />;
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-10">
      <TripDetail trip={result.trip} />
      <Link href="/" className={`${secondaryButtonClassName} self-start`}>
        Back to trips
      </Link>
    </main>
  );
}

function MissingTrip() {
  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Trip not found</h1>
      <p className="mt-3 text-ink-muted">This trip is not available on your account.</p>
      <p className="mt-6">
        <Link href="/" className={`${secondaryButtonClassName} self-start`}>
          Back to trips
        </Link>
      </p>
    </main>
  );
}
