import { describe, expect, it } from "vitest";

import { equalShareCents, memberBalances } from "@/lib/expenses/split";

describe("equal expense splits", () => {
  it("gives leftover cents to the earliest participants so shares total the amount", () => {
    expect(equalShareCents(100, 3)).toEqual([34, 33, 33]);
    expect(equalShareCents(10, 3)).toEqual([4, 3, 3]);
    expect(equalShareCents(1, 2)).toEqual([1, 0]);
    expect(equalShareCents(5, 1)).toEqual([5]);
    expect(equalShareCents(100, 3).reduce((sum, share) => sum + share, 0)).toBe(100);
    expect(equalShareCents(1, 2).reduce((sum, share) => sum + share, 0)).toBe(1);
  });

  it("counts a payer who is not a participant and keeps balances at zero overall", () => {
    const balances = memberBalances(
      ["cara@example.com", "ada@example.com", "bryce@example.com"],
      [
        {
          amountCents: 100,
          payerEmail: "ada@example.com",
          participantEmails: ["bryce@example.com", "cara@example.com"],
        },
        {
          amountCents: 1,
          payerEmail: "cara@example.com",
          participantEmails: ["ada@example.com", "bryce@example.com", "cara@example.com"],
        },
      ],
    );

    expect(balances).toEqual([
      { email: "ada@example.com", paidCents: 100, shareCents: 1, balanceCents: 99 },
      { email: "bryce@example.com", paidCents: 0, shareCents: 50, balanceCents: -50 },
      { email: "cara@example.com", paidCents: 1, shareCents: 50, balanceCents: -49 },
    ]);
    expect(balances.reduce((sum, balance) => sum + balance.shareCents, 0)).toBe(101);
    expect(balances.reduce((sum, balance) => sum + balance.balanceCents, 0)).toBe(0);
  });
});
