import type { ExpenseView } from "@/lib/expenses/types";

export function ExpenseList({ expenses }: { expenses: ExpenseView[] }) {
  if (expenses.length === 0) {
    return <p className="text-stone-700">No expenses yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {expenses.map((expense) => (
        <li key={expense.id} className="rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="text-lg font-semibold">{expense.description}</h2>
          <p className="mt-1">{formatAmount(expense.amountCents, expense.currency)}</p>
          <p className="mt-1 text-stone-700">{expense.date}</p>
          <p className="mt-2">Paid by {expense.payerEmail}</p>
          <p>Shared by {expense.participantEmails.join(", ")}</p>
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
