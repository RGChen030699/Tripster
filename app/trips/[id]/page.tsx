import Link from "next/link";
import { cookies } from "next/headers";

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
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-16">
      <TripDetail trip={result.trip} />
      <Link
        href="/"
        className="font-medium text-teal-900 underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
      >
        Back to trips
      </Link>
    </main>
  );
}

function MissingTrip() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Trip not found</h1>
      <p className="mt-3 text-stone-700">This trip is not available on your account.</p>
      <p className="mt-6">
        <Link href="/" className="font-medium text-teal-900 underline">
          Back to trips
        </Link>
      </p>
    </main>
  );
}
