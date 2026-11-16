import { describe, expect, it } from "vitest";

import {
  applyPayerRemainder,
  equalShareCents,
  memberBalances,
  resolveParticipantShares,
} from "@/lib/expenses/split";

describe("equal expense splits", () => {
  it("gives leftover cents to the earliest participants so shares total the amount", () => {
    expect(equalShareCents(100, 3)).toEqual([34, 33, 33]);
    expect(equalShareCents(10, 3)).toEqual([4, 3, 3]);
    expect(equalShareCents(1, 2)).toEqual([1, 0]);
    expect(equalShareCents(5, 1)).toEqual([5]);
    expect(equalShareCents(100, 3).reduce((sum, share) => sum + share, 0)).toBe(100);
    expect(equalShareCents(1, 2).reduce((sum, share) => sum + share, 0)).toBe(1);
  });

  it("uses stored manual shares when they total the expense", () => {
    expect(resolveParticipantShares(1000, 2, [700, 300])).toEqual([700, 300]);
    expect(resolveParticipantShares(1000, 2, null)).toEqual([500, 500]);
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

  it("applies stored manual shares when computing balances", () => {
    const balances = memberBalances(
      ["ada@example.com", "bryce@example.com"],
      [
        {
          amountCents: 1000,
          payerEmail: "ada@example.com",
          participantEmails: ["ada@example.com", "bryce@example.com"],
          participantShares: [700, 300],
        },
      ],
    );

    expect(balances).toEqual([
      { email: "ada@example.com", paidCents: 1000, shareCents: 700, balanceCents: 300 },
      { email: "bryce@example.com", paidCents: 0, shareCents: 300, balanceCents: -300 },
    ]);
  });

  it("puts leftover manual share cents on the payer", () => {
    expect(
      applyPayerRemainder({
        amountCents: 4050,
        shares: [2025, 1000],
        participantEmails: ["ada@example.com", "bryce@example.com"],
        payerEmail: "ada@example.com",
      }),
    ).toEqual({ ok: true, shares: [3050, 1000] });

    expect(
      applyPayerRemainder({
        amountCents: 4000,
        shares: [2000, 1000],
        participantEmails: ["ada@example.com", "bryce@example.com"],
        payerEmail: "ada@example.com",
      }),
    ).toEqual({ ok: true, shares: [3000, 1000] });

    expect(
      applyPayerRemainder({
        amountCents: 1000,
        shares: [700, 300],
        participantEmails: ["ada@example.com", "bryce@example.com"],
        payerEmail: "ada@example.com",
      }),
    ).toEqual({ ok: true, shares: [700, 300] });

    expect(
      applyPayerRemainder({
        amountCents: 1000,
        shares: [800, 300],
        participantEmails: ["ada@example.com", "bryce@example.com"],
        payerEmail: "ada@example.com",
      }),
    ).toEqual({ ok: false, error: "Manual shares cannot exceed the expense amount." });

    expect(
      applyPayerRemainder({
        amountCents: 1000,
        shares: [400],
        participantEmails: ["bryce@example.com"],
        payerEmail: "ada@example.com",
      }),
    ).toEqual({
      ok: false,
      error: "Include the payer among who shares so the remaining amount can go to them.",
    });
  });
});
