import type { MemberBalance } from "@/lib/expenses/types";

export function ExpenseBalances({ balances }: { balances: MemberBalance[] }) {
  return (
    <section aria-labelledby="balances-heading">
      <h2 id="balances-heading" className="text-lg font-semibold">
        Balances
      </h2>
      <p className="mt-2 text-sm text-stone-700">A positive balance is money the group owes this member.</p>
      <ul className="mt-3 flex flex-col gap-3">
        {balances.map((balance) => (
          <li key={balance.email} aria-label={balance.email} className="rounded-lg border border-stone-200 bg-white p-4">
            <h3 className="font-medium">{balance.email}</h3>
            <p className="mt-1">Paid {formatSignedCents(balance.paidCents)} USD</p>
            <p>Share {formatSignedCents(balance.shareCents)} USD</p>
            <p>Balance {formatSignedCents(balance.balanceCents)} USD</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatSignedCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const dollars = Math.trunc(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, "0");
  return `${sign}${dollars}.${fraction}`;
}
