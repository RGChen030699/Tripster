import type { MemberBalance } from "@/lib/expenses/types";

export function equalShareCents(amountCents: number, participantCount: number): number[] {
  if (participantCount <= 0) {
    return [];
  }
  const base = Math.floor(amountCents / participantCount);
  const remainder = amountCents % participantCount;
  return Array.from({ length: participantCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function memberBalances(
  memberEmails: string[],
  expenses: { amountCents: number; payerEmail: string; participantEmails: string[] }[],
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
    const shares = equalShareCents(expense.amountCents, expense.participantEmails.length);
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
