import { describe, expect, it } from "vitest";

import { InMemoryUserStore } from "@/lib/auth/user-store";
import { ExpenseService } from "@/lib/expenses/expense-service";
import { InMemoryExpenseStore } from "@/lib/expenses/expense-store";
import { TripService } from "@/lib/trips/trip-service";
import { InMemoryTripStore } from "@/lib/trips/trip-store";

const TRIP = {
  name: "Lisbon week",
  destination: "Lisbon",
  startDate: "2026-11-01",
  endDate: "2026-11-05",
};

async function setup() {
  const users = new InMemoryUserStore();
  await users.create({ id: "user-1", email: "ada@example.com", passwordHash: "hashed-secret" });
  await users.create({ id: "user-2", email: "bryce@example.com", passwordHash: "hashed-secret" });
  const trips = new InMemoryTripStore();
  const tripService = new TripService(trips, users, { info() {}, error() {} });
  const created = await tripService.createTrip("user-1", TRIP);
  if (!created.ok) {
    throw new Error("trip setup failed");
  }
  await tripService.addMember("user-1", created.trip.id, "bryce@example.com");
  const messages: string[] = [];
  const service = new ExpenseService(new InMemoryExpenseStore(), trips, users, {
    info(message: string) {
      messages.push(message);
    },
    error(message: string) {
      messages.push(message);
    },
  });
  return { service, tripId: created.trip.id, messages };
}

describe("ExpenseService", () => {
  it("records an expense in cents for the selected members", async () => {
    const { service, tripId, messages } = await setup();

    const recorded = await service.recordExpense("user-2", tripId, {
      amount: "10.5",
      description: "  Taxi  ",
      date: "2026-12-01",
      payerEmail: " Ada@Example.com ",
      participantEmails: ["bryce@example.com", "ada@example.com", "bryce@example.com"],
    });

    expect(recorded).toMatchObject({
      ok: true,
      expense: {
        amountCents: 1050,
        currency: "USD",
        description: "Taxi",
        date: "2026-12-01",
        payerEmail: "ada@example.com",
        participantEmails: ["bryce@example.com", "ada@example.com"],
      },
    });
    expect(recorded).not.toHaveProperty("shares");
    expect(recorded).not.toHaveProperty("balances");
    if (recorded.ok) {
      expect(recorded.expense).not.toHaveProperty("shares");
      expect(recorded.expense).not.toHaveProperty("balance");
    }
    expect(messages).toContain("expense recorded");
    expect(messages.join(" ")).not.toContain("Taxi");
    expect(messages.join(" ")).not.toContain("ada@example.com");

    const listed = await service.listExpenses("user-1", tripId);
    expect(listed).toMatchObject({
      ok: true,
      expenses: [{ amountCents: 1050, description: "Taxi", payerEmail: "ada@example.com" }],
    });
    expect(listed).not.toHaveProperty("balances");
  });

  it("rejects an invalid amount, description, date, payer, or participant", async () => {
    const { service, tripId } = await setup();
    const valid = {
      amount: "10.00",
      description: "Taxi",
      date: "2026-11-02",
      payerEmail: "ada@example.com",
      participantEmails: ["ada@example.com"],
    };

    await expect(service.recordExpense("user-1", tripId, { ...valid, amount: "0" })).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Enter a positive amount in dollars and cents.",
    });
    await expect(service.recordExpense("user-1", tripId, { ...valid, amount: "10.555" })).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Enter a positive amount in dollars and cents.",
    });
    await expect(service.recordExpense("user-1", tripId, { ...valid, description: "  " })).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Enter a description.",
    });
    await expect(service.recordExpense("user-1", tripId, { ...valid, date: "2026-11-31" })).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Enter a valid date.",
    });
    await expect(
      service.recordExpense("user-1", tripId, { ...valid, payerEmail: "unknown@example.com" }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Choose a trip member as the payer.",
    });
    await expect(service.recordExpense("user-1", tripId, { ...valid, participantEmails: [] })).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Select at least one trip member.",
    });
    await expect(
      service.recordExpense("user-1", tripId, { ...valid, participantEmails: ["stranger@example.com"] }),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Every participant must be a trip member.",
    });
  });

  it("hides expenses from someone outside the trip", async () => {
    const { service, tripId } = await setup();
    const hiddenRecord = await service.recordExpense("someone-else", tripId, {
      amount: "10.00",
      description: "Taxi",
      date: "2026-11-02",
      payerEmail: "ada@example.com",
      participantEmails: ["ada@example.com"],
    });
    expect(hiddenRecord).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(hiddenRecord)).not.toContain("Taxi");
    expect(JSON.stringify(hiddenRecord)).not.toContain("Lisbon");

    const hiddenList = await service.listExpenses("someone-else", tripId);
    expect(hiddenList).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(hiddenList)).not.toContain("Taxi");
    expect(JSON.stringify(hiddenList)).not.toContain("Lisbon");
  });

  it("shows paid, share, and net balance when a payer is not a participant", async () => {
    const users = new InMemoryUserStore();
    await users.create({ id: "user-1", email: "ada@example.com", passwordHash: "hashed-secret" });
    await users.create({ id: "user-2", email: "bryce@example.com", passwordHash: "hashed-secret" });
    await users.create({ id: "user-3", email: "cara@example.com", passwordHash: "hashed-secret" });
    const trips = new InMemoryTripStore();
    const tripService = new TripService(trips, users, { info() {}, error() {} });
    const created = await tripService.createTrip("user-1", TRIP);
    if (!created.ok) {
      throw new Error("trip setup failed");
    }
    await tripService.addMember("user-1", created.trip.id, "bryce@example.com");
    await tripService.addMember("user-1", created.trip.id, "cara@example.com");
    const service = new ExpenseService(new InMemoryExpenseStore(), trips, users, {
      info() {},
      error() {},
    });
    const tripId = created.trip.id;

    const taxi = await service.recordExpense("user-1", tripId, {
      amount: "1.00",
      description: "Taxi",
      date: "2026-11-02",
      payerEmail: "ada@example.com",
      participantEmails: ["bryce@example.com", "cara@example.com"],
    });
    expect(taxi.ok).toBe(true);
    if (taxi.ok) {
      expect(taxi.expense).not.toHaveProperty("shares");
    }
    await service.recordExpense("user-3", tripId, {
      amount: "0.01",
      description: "Tip",
      date: "2026-11-02",
      payerEmail: "cara@example.com",
      participantEmails: ["ada@example.com", "bryce@example.com", "cara@example.com"],
    });

    const balances = await service.listBalances("user-2", tripId);
    expect(balances).toEqual({
      ok: true,
      balances: [
        { email: "ada@example.com", paidCents: 100, shareCents: 1, balanceCents: 99 },
        { email: "bryce@example.com", paidCents: 0, shareCents: 50, balanceCents: -50 },
        { email: "cara@example.com", paidCents: 1, shareCents: 50, balanceCents: -49 },
      ],
    });
    if (balances.ok) {
      expect(balances.balances.reduce((sum, balance) => sum + balance.shareCents, 0)).toBe(101);
      expect(balances.balances.reduce((sum, balance) => sum + balance.balanceCents, 0)).toBe(0);
    }

    const hidden = await service.listBalances("someone-else", tripId);
    expect(hidden).toEqual({ ok: false, status: 404, error: "Trip not found." });
    expect(JSON.stringify(hidden)).not.toContain("Taxi");
    expect(JSON.stringify(hidden)).not.toContain("Lisbon");
  });
});
