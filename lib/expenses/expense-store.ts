import { getPrisma } from "@/lib/db";
import type { ExpenseCurrency, ExpenseStore, StoredExpense } from "@/lib/expenses/types";

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

export class PrismaExpenseStore implements ExpenseStore {
  async add(expense: StoredExpense): Promise<void> {
    const prisma = getPrisma();
    await prisma.$transaction(async (tx) => {
      await tx.expense.create({
        data: {
          id: expense.id,
          tripId: expense.tripId,
          amountCents: expense.amountCents,
          currency: expense.currency,
          description: expense.description,
          date: expense.date,
          payerId: expense.payerId,
        },
      });
      if (expense.participantIds.length > 0) {
        await tx.expenseParticipant.createMany({
          data: expense.participantIds.map((userId, position) => ({
            expenseId: expense.id,
            userId,
            position,
          })),
        });
      }
    });
  }

  async listByTrip(tripId: string): Promise<StoredExpense[]> {
    const expenses = await getPrisma().expense.findMany({
      where: { tripId },
      orderBy: { createdAt: "asc" },
      include: { participants: { orderBy: { position: "asc" } } },
    });
    return expenses.map((expense) => ({
      id: expense.id,
      tripId: expense.tripId,
      amountCents: expense.amountCents,
      currency: expense.currency as ExpenseCurrency,
      description: expense.description,
      date: expense.date,
      payerId: expense.payerId,
      participantIds: expense.participants.map((participant) => participant.userId),
    }));
  }
}
