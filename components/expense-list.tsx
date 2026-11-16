import type { ExpenseView } from "@/lib/expenses/types";

export function ExpenseList({ expenses }: { expenses: ExpenseView[] }) {
  if (expenses.length === 0) {
    return <p className="text-ink-muted">No expenses yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {expenses.map((expense) => (
        <li key={expense.id} className="rounded-lg border border-sand bg-panel p-4">
          <h2 className="text-lg font-bold">{expense.description}</h2>
          <p className="mt-1">{formatAmount(expense.amountCents, expense.currency)}</p>
          <p className="mt-1 text-ink-muted">{expense.date}</p>
          <p className="mt-2">Paid by {expense.payerEmail}</p>
          <p>
            {expense.splitMode === "manual" ? "Manual split" : "Even split"} · Shared by{" "}
            {expense.participantEmails.join(", ")}
          </p>
          {expense.splitMode === "manual" ? (
            <ul className="mt-2 text-sm text-ink-muted">
              {expense.participantEmails.map((email, index) => (
                <li key={email}>
                  {email}: {formatAmount(expense.participantShares[index] ?? 0, expense.currency)}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function formatAmount(amountCents: number, currency: string): string {
  const dollars = Math.trunc(amountCents / 100);
  const cents = String(Math.abs(amountCents % 100)).padStart(2, "0");
  return `${dollars}.${cents} ${currency}`;
}
