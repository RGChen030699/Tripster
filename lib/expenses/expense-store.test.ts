import { beforeEach, describe, expect, it } from "vitest";

import { resetDatabase } from "@/lib/db";
import { InMemoryExpenseStore, PrismaExpenseStore } from "@/lib/expenses/expense-store";
import type { StoredExpense } from "@/lib/expenses/types";
import { seedTrip, seedUser } from "@/lib/testing/parents";

const expense: StoredExpense = {
  id: "expense-1",
  tripId: "trip-1",
  amountCents: 1050,
  currency: "USD",
  description: "Taxi",
  date: "2026-11-02",
  payerId: "user-1",
  participantIds: ["user-1", "user-2"],
};

describe("InMemoryExpenseStore", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("stores an expense for its trip", async () => {
    const store = new InMemoryExpenseStore();

    await store.add(expense);

    await expect(store.listByTrip("trip-1")).resolves.toEqual([expense]);
    await expect(store.listByTrip("trip-2")).resolves.toEqual([]);
  });

  it("keeps an expense when a new store instance is created", async () => {
    await seedUser(expense.payerId);
    await seedUser("user-2");
    await seedTrip(expense.tripId);
    const first = new PrismaExpenseStore();
    const second = new PrismaExpenseStore();

    await first.add(expense);

    await expect(second.listByTrip("trip-1")).resolves.toEqual([expense]);
  });
});
