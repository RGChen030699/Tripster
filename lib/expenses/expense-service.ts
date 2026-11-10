import type { Logger, UserStore } from "@/lib/auth/types";
import type { ExpenseListResult, ExpenseStore, RecordExpenseResult } from "@/lib/expenses/types";
import type { TripStore } from "@/lib/trips/types";

export class ExpenseService {
  private readonly expenses: ExpenseStore;
  private readonly trips: TripStore;
  private readonly users: UserStore;
  private readonly logger: Logger;

  constructor(expenses: ExpenseStore, trips: TripStore, users: UserStore, logger: Logger) {
    this.expenses = expenses;
    this.trips = trips;
    this.users = users;
    this.logger = logger;
  }

  async recordExpense(
    userId: string,
    tripId: string,
    input: {
      amount: unknown;
      description: unknown;
      date: unknown;
      payerEmail: unknown;
      participantEmails: unknown;
    },
  ): Promise<RecordExpenseResult> {
    void userId;
    void tripId;
    void input;
    void this.expenses;
    void this.trips;
    void this.users;
    void this.logger;
    return { ok: false, status: 501, error: "Not implemented." };
  }

  async listExpenses(userId: string, tripId: string): Promise<ExpenseListResult> {
    void userId;
    void tripId;
    return { ok: false, status: 501, error: "Not implemented." };
  }
}
