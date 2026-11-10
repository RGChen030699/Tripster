import type { ExpenseStore, StoredExpense } from "@/lib/expenses/types";

export class InMemoryExpenseStore implements ExpenseStore {
  private readonly expenses = new Map<string, StoredExpense>();

  async add(expense: StoredExpense): Promise<void> {
    this.expenses.set(expense.id, cloneExpense(expense));
  }

  async listByTrip(tripId: string): Promise<StoredExpense[]> {
    const listed: StoredExpense[] = [];
    for (const expense of this.expenses.values()) {
      if (expense.tripId === tripId) {
        listed.push(cloneExpense(expense));
      }
    }
    return listed;
  }
}

function cloneExpense(expense: StoredExpense): StoredExpense {
  return {
    id: expense.id,
    tripId: expense.tripId,
    amountCents: expense.amountCents,
    currency: expense.currency,
    description: expense.description,
    date: expense.date,
    payerId: expense.payerId,
    participantIds: [...expense.participantIds],
  };
}
