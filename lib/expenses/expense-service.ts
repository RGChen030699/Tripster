import { randomUUID } from "node:crypto";

import type { Logger, UserStore } from "@/lib/auth/types";
import type {
  ExpenseFailure,
  BalanceListResult,
  ExpenseListResult,
  ExpenseStore,
  ExpenseView,
  RecordExpenseResult,
  StoredExpense,
} from "@/lib/expenses/types";
import { DEFAULT_CURRENCY } from "@/lib/expenses/types";
import type { TripStore } from "@/lib/trips/types";

const TRIP_NOT_FOUND = "Trip not found.";
const AMOUNT_ERROR = "Enter a positive amount in dollars and cents.";
const DESCRIPTION_LIMIT = 200;

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
    const membership = await this.trips.findMembership(tripId, userId);
    if (!membership) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }
    const parsed = parseExpenseInput(input);
    if (!parsed.ok) {
      return parsed;
    }
    const payer = await this.memberId(tripId, parsed.payerEmail);
    if (!payer) {
      return { ok: false, status: 400, error: "Choose a trip member as the payer." };
    }
    const participantIds: string[] = [];
    for (const email of parsed.participantEmails) {
      const participant = await this.memberId(tripId, email);
      if (!participant) {
        return { ok: false, status: 400, error: "Every participant must be a trip member." };
      }
      participantIds.push(participant);
    }

    const stored: StoredExpense = {
      id: randomUUID(),
      tripId,
      amountCents: parsed.amountCents,
      currency: DEFAULT_CURRENCY,
      description: parsed.description,
      date: parsed.date,
      payerId: payer,
      participantIds,
    };
    await this.expenses.add(stored);
    this.logger.info("expense recorded");
    const expense = await this.present(stored);
    if (!expense) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }
    return { ok: true, expense };
  }

  async listExpenses(userId: string, tripId: string): Promise<ExpenseListResult> {
    const membership = await this.trips.findMembership(tripId, userId);
    if (!membership) {
      return { ok: false, status: 404, error: TRIP_NOT_FOUND };
    }
    const stored = await this.expenses.listByTrip(tripId);
    const expenses: ExpenseView[] = [];
    for (const expense of stored) {
      const view = await this.present(expense);
      if (view) {
        expenses.push(view);
      }
    }
    return { ok: true, expenses };
  }

  async listBalances(userId: string, tripId: string): Promise<BalanceListResult> {
    void userId;
    void tripId;
    return { ok: false, status: 501, error: "Not implemented." };
  }

  private async memberId(tripId: string, email: string): Promise<string | null> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      return null;
    }
    const membership = await this.trips.findMembership(tripId, user.id);
    return membership ? user.id : null;
  }

  private async present(expense: StoredExpense): Promise<ExpenseView | null> {
    const payer = await this.users.findById(expense.payerId);
    if (!payer) {
      return null;
    }
    const participantEmails: string[] = [];
    for (const participantId of expense.participantIds) {
      const participant = await this.users.findById(participantId);
      if (!participant) {
        return null;
      }
      participantEmails.push(participant.email);
    }
    return {
      id: expense.id,
      amountCents: expense.amountCents,
      currency: expense.currency,
      description: expense.description,
      date: expense.date,
      payerEmail: payer.email,
      participantEmails,
    };
  }
}

type ParsedExpense =
  | {
      ok: true;
      amountCents: number;
      description: string;
      date: string;
      payerEmail: string;
      participantEmails: string[];
    }
  | ExpenseFailure;

function parseExpenseInput(input: {
  amount: unknown;
  description: unknown;
  date: unknown;
  payerEmail: unknown;
  participantEmails: unknown;
}): ParsedExpense {
  const amount = parseAmount(input.amount);
  if (!amount.ok) {
    return amount;
  }
  if (typeof input.description !== "string" || input.description.trim() === "") {
    return { ok: false, status: 400, error: "Enter a description." };
  }
  const description = input.description.trim();
  if (description.length > DESCRIPTION_LIMIT) {
    return { ok: false, status: 400, error: "Use a shorter description." };
  }
  if (typeof input.date !== "string" || !isCalendarDate(input.date.trim())) {
    return { ok: false, status: 400, error: "Enter a valid date." };
  }
  if (typeof input.payerEmail !== "string" || input.payerEmail.trim() === "") {
    return { ok: false, status: 400, error: "Choose a trip member as the payer." };
  }
  const participants = parseParticipants(input.participantEmails);
  if (!participants.ok) {
    return participants;
  }
  return {
    ok: true,
    amountCents: amount.amountCents,
    description,
    date: input.date.trim(),
    payerEmail: input.payerEmail.trim().toLowerCase(),
    participantEmails: participants.emails,
  };
}

function parseAmount(
  value: unknown,
): { ok: true; amountCents: number } | { ok: false; status: 400; error: string } {
  if (typeof value !== "string" || !/^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/.test(value.trim())) {
    return { ok: false, status: 400, error: AMOUNT_ERROR };
  }
  const [dollars, fraction = ""] = value.trim().split(".");
  const amountCents = Number(dollars) * 100 + Number((fraction + "00").slice(0, 2));
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    return { ok: false, status: 400, error: AMOUNT_ERROR };
  }
  return { ok: true, amountCents };
}

function parseParticipants(
  value: unknown,
): { ok: true; emails: string[] } | { ok: false; status: 400; error: string } {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, status: 400, error: "Select at least one trip member." };
  }
  const emails: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") {
      return { ok: false, status: 400, error: "Every participant must be a trip member." };
    }
    const email = entry.trim().toLowerCase();
    if (!emails.includes(email)) {
      emails.push(email);
    }
  }
  if (emails.length === 0 || emails.some((email) => email === "")) {
    return { ok: false, status: 400, error: "Select at least one trip member." };
  }
  return { ok: true, emails };
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isCalendarDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
