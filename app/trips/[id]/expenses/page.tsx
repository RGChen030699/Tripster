import Link from "next/link";
import { cookies } from "next/headers";

import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";
import { getAuthService } from "@/lib/auth/container";
import { getExpenseService } from "@/lib/expenses/container";
import { getTripService } from "@/lib/trips/container";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = await getAuthService().getSession(token);
  if (!session.ok) {
    return <MissingTrip />;
  }

  const trip = await getTripService().getTrip(session.user.id, id);
  if (!trip.ok) {
    return <MissingTrip />;
  }

  const listed = await getExpenseService().listExpenses(session.user.id, id);
  if (!listed.ok) {
    return <MissingTrip />;
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Expenses</h1>
        <p className="mt-3 text-lg">{trip.trip.name}</p>
      </div>
      <ExpenseForm tripId={id} members={trip.trip.members} />
      <ExpenseList expenses={listed.expenses} />
      <Link
        href={`/trips/${id}`}
        className="font-medium text-teal-900 underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
      >
        Back to trip
      </Link>
    </main>
  );
}

function MissingTrip() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Trip not found</h1>
      <p className="mt-3 text-stone-700">This trip is not available on your account.</p>
      <Link href="/" className="mt-6 inline-block font-medium text-teal-900 underline">
        Back to trips
      </Link>
    </main>
  );
}
