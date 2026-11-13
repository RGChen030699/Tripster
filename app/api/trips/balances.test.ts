import { beforeEach, describe, expect, it } from "vitest";

import { POST as register } from "@/app/api/auth/register/route";
import { GET as listBalances } from "@/app/api/trips/[id]/expenses/balances/route";
import { POST as recordExpense } from "@/app/api/trips/[id]/expenses/route";
import { POST as addMember } from "@/app/api/trips/[id]/members/route";
import { POST as createTrip } from "@/app/api/trips/route";
import { resetAuthService } from "@/lib/auth/container";
import { resetExpenseService } from "@/lib/expenses/container";
import { resetTripService } from "@/lib/trips/container";

const PASSWORD = "correct-horse";

function jsonRequest(path: string, body: unknown, cookie?: string): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return new Request(`http://localhost${path}`, { method: "POST", headers, body: JSON.stringify(body) });
}

async function registerUser(email: string): Promise<string> {
  const response = await register(jsonRequest("/api/auth/register", { email, password: PASSWORD }));
  return response.headers.get("set-cookie")?.split(";")[0] ?? "";
}

describe("expense balance routes", () => {
  beforeEach(async () => {
    await resetAuthService();
    await resetTripService();
    await resetExpenseService();
  });

  it("rejects an unauthenticated balance request", async () => {
    const response = await listBalances(new Request("http://localhost/api/trips/trip-1/expenses/balances"), {
      params: Promise.resolve({ id: "trip-1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
  });

  it("returns paid, share, and net balance for trip members", async () => {
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
          amount: "1.00",
          description: "Taxi",
          date: "2026-11-02",
          payerEmail: "ada@example.com",
          participantEmails: ["bryce@example.com"],
        },
        ada,
      ),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(recorded.status).toBe(201);
    expect(JSON.stringify(await recorded.clone().json())).not.toContain("shares");

    const listed = await listBalances(
      new Request(`http://localhost/api/trips/${tripId}/expenses/balances`, { headers: { cookie: bryce } }),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(listed.status).toBe(200);
    await expect(listed.json()).resolves.toEqual({
      balances: [
        { email: "ada@example.com", paidCents: 100, shareCents: 0, balanceCents: 100 },
        { email: "bryce@example.com", paidCents: 0, shareCents: 100, balanceCents: -100 },
      ],
    });
  });
});
