import type { ExpenseStore, StoredExpense } from "@/lib/expenses/types";

export class InMemoryExpenseStore implements ExpenseStore {
  private readonly expenses = new Map<string, StoredExpense>();

  async add(expense: StoredExpense): Promise<void> {
    void expense;
  }

  async listByTrip(tripId: string): Promise<StoredExpense[]> {
    void tripId;
    return [];
  }
}
