export const DEFAULT_CURRENCY = "USD";

export type ExpenseCurrency = typeof DEFAULT_CURRENCY;

export type StoredExpense = {
  id: string;
  tripId: string;
  amountCents: number;
  currency: ExpenseCurrency;
  description: string;
  date: string;
  payerId: string;
  participantIds: string[];
};

export type ExpenseView = {
  id: string;
  amountCents: number;
  currency: ExpenseCurrency;
  description: string;
  date: string;
  payerEmail: string;
  participantEmails: string[];
};

export type RecordExpenseResult = { ok: true; expense: ExpenseView } | ExpenseFailure;

export type ExpenseListResult = { ok: true; expenses: ExpenseView[] } | ExpenseFailure;

export type MemberBalance = {
  email: string;
  paidCents: number;
  shareCents: number;
  balanceCents: number;
};

export type BalanceListResult = { ok: true; balances: MemberBalance[] } | ExpenseFailure;

export type ExpenseFailure = {
  ok: false;
  status: number;
  error: string;
};

export interface ExpenseStore {
  add(expense: StoredExpense): Promise<void>;
  listByTrip(tripId: string): Promise<StoredExpense[]>;
}
