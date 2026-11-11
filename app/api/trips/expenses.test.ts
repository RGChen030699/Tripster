import { beforeEach, describe, expect, it } from "vitest";

import { POST as register } from "@/app/api/auth/register/route";
import { GET as listExpenses, POST as recordExpense } from "@/app/api/trips/[id]/expenses/route";
import { POST as addMember } from "@/app/api/trips/[id]/members/route";
import { POST as createTrip } from "@/app/api/trips/route";
import { resetAuthService } from "@/lib/auth/container";
import { resetExpenseService } from "@/lib/expenses/container";
import { resetTripService } from "@/lib/trips/container";

const PASSWORD = "correct-horse";

function jsonRequest(path: string, body: unknown, cookie?: string, method = "POST"): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function registerUser(email: string): Promise<string> {
  const response = await register(jsonRequest("/api/auth/register", { email, password: PASSWORD }));
  return response.headers.get("set-cookie")?.split(";")[0] ?? "";
}

describe("expense routes", () => {
  beforeEach(() => {
    resetAuthService();
    resetTripService();
    resetExpenseService();
  });

  it("rejects an unauthenticated expense", async () => {
    const response = await recordExpense(jsonRequest("/api/trips/trip-1/expenses", { amount: "10.00" }), {
      params: Promise.resolve({ id: "trip-1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
  });

  it("lets a member record an expense that another member can read", async () => {
    const ada = await registerUser("ada@example.com");
    const bryce = await registerUser("bryce@example.com");
    const createdTrip = await createTrip(
      jsonRequest(
        "/api/trips",
        {
          name: "Lisbon week",
          destination: "Lisbon",
          startDate: "2026-11-01",
          endDate: "2026-11-05",
        },
        ada,
      ),
    );
    const tripId = ((await createdTrip.json()) as { trip: { id: string } }).trip.id;
    await addMember(jsonRequest(`/api/trips/${tripId}/members`, { email: "bryce@example.com" }, ada), {
      params: Promise.resolve({ id: tripId }),
    });

    const recorded = await recordExpense(
      jsonRequest(
        `/api/trips/${tripId}/expenses`,
        {
          amount: "10.50",
          description: "Taxi",
          date: "2026-11-02",
          payerEmail: "ada@example.com",
          participantEmails: ["ada@example.com", "bryce@example.com"],
        },
        bryce,
      ),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(recorded.status).toBe(201);
    const body = (await recorded.json()) as { expense: { amountCents: number; currency: string } };
    expect(body.expense).toMatchObject({
      amountCents: 1050,
      currency: "USD",
      description: "Taxi",
      payerEmail: "ada@example.com",
      participantEmails: ["ada@example.com", "bryce@example.com"],
    });
    expect(body).not.toHaveProperty("balances");
    expect(JSON.stringify(body)).not.toContain("shares");

    const listed = await listExpenses(
      new Request(`http://localhost/api/trips/${tripId}/expenses`, { headers: { cookie: ada } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(listed.status).toBe(200);
    await expect(listed.json()).resolves.toMatchObject({
      expenses: [{ description: "Taxi", amountCents: 1050 }],
    });
  });
});
