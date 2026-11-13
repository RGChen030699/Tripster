import { describe, expect, it } from "vitest";

import { InMemoryExpenseStore } from "@/lib/expenses/expense-store";
import type { StoredExpense } from "@/lib/expenses/types";

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
  it("stores an expense for its trip", async () => {
    const store = new InMemoryExpenseStore();

    await store.add(expense);

    await expect(store.listByTrip("trip-1")).resolves.toEqual([expense]);
    await expect(store.listByTrip("trip-2")).resolves.toEqual([]);
  });

  it("keeps an expense when a new store instance is created", async () => {
    const first = new InMemoryExpenseStore();
    const second = new InMemoryExpenseStore();

    await first.add(expense);

    await expect(second.listByTrip("trip-1")).resolves.toEqual([expense]);
  });
});
