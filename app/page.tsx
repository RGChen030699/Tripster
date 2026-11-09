import { cookies } from "next/headers";

import { AccountHome } from "@/components/account-home";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";
import { getAuthService } from "@/lib/auth/container";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = await getAuthService().getSession(token);
  return <AccountHome email={session.ok ? session.user.email : null} />;
}
