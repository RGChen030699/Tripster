import type { MemberBalance } from "@/lib/expenses/types";

export function equalShareCents(amountCents: number, participantCount: number): number[] {
  if (participantCount <= 0) {
    return [];
  }
  const base = Math.floor(amountCents / participantCount);
  const remainder = amountCents % participantCount;
  return Array.from({ length: participantCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

/**
 * Manual shares that under-total the expense put the leftover on the payer.
 * Shares that over-total still fail.
 */
export function applyPayerRemainder(input: {
  amountCents: number;
  shares: number[];
  participantEmails: string[];
  payerEmail: string;
}): { ok: true; shares: number[] } | { ok: false; error: string } {
  const { amountCents, shares, participantEmails, payerEmail } = input;
  if (shares.length !== participantEmails.length) {
    return { ok: false, error: "Enter a share amount for each selected member." };
  }
  const total = shares.reduce((sum, share) => sum + share, 0);
  if (total === amountCents) {
    return { ok: true, shares };
  }
  if (total > amountCents) {
    return { ok: false, error: "Manual shares cannot exceed the expense amount." };
  }
  const payer = payerEmail.trim().toLowerCase();
  const payerIndex = participantEmails.findIndex((email) => email.trim().toLowerCase() === payer);
  if (payerIndex < 0) {
    return {
      ok: false,
      error: "Include the payer among who shares so the remaining amount can go to them.",
    };
  }
  const next = [...shares];
  next[payerIndex] = (next[payerIndex] ?? 0) + (amountCents - total);
  return { ok: true, shares: next };
}

export function resolveParticipantShares(
  amountCents: number,
  participantCount: number,
  storedShares: number[] | null | undefined,
): number[] {
  if (
    storedShares &&
    storedShares.length === participantCount &&
    storedShares.reduce((sum, share) => sum + share, 0) === amountCents
  ) {
    return storedShares;
  }
  return equalShareCents(amountCents, participantCount);
}

export function memberBalances(
  memberEmails: string[],
  expenses: {
    amountCents: number;
    payerEmail: string;
    participantEmails: string[];
    participantShares?: number[] | null;
  }[],
): MemberBalance[] {
  const totals = new Map<string, { paidCents: number; shareCents: number }>();
  for (const email of memberEmails) {
    totals.set(email, { paidCents: 0, shareCents: 0 });
  }
  for (const expense of expenses) {
    const payer = totals.get(expense.payerEmail);
    if (payer) {
      payer.paidCents += expense.amountCents;
    }
    const shares = resolveParticipantShares(
      expense.amountCents,
      expense.participantEmails.length,
      expense.participantShares,
    );
    expense.participantEmails.forEach((email, index) => {
      const participant = totals.get(email);
      const share = shares[index];
      if (participant && share !== undefined) {
        participant.shareCents += share;
      }
    });
  }
  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([email, member]) => ({
      email,
      paidCents: member.paidCents,
      shareCents: member.shareCents,
      balanceCents: member.paidCents - member.shareCents,
    }));
}
