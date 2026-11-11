import { cookies } from "next/headers";

import { AccountHome } from "@/components/account-home";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";
import { getAuthService } from "@/lib/auth/container";
import { getTripService } from "@/lib/trips/container";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = await getAuthService().getSession(token);
  if (!session.ok) {
    return <AccountHome email={null} />;
  }
  const trips = await getTripService().listTrips(session.user.id);
  return <AccountHome email={session.user.email} trips={trips.trips} />;
}
