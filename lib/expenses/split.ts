import type { MemberBalance } from "@/lib/expenses/types";

export function equalShareCents(amountCents: number, participantCount: number): number[] {
  void amountCents;
  void participantCount;
  return [];
}

export function memberBalances(
  memberEmails: string[],
  expenses: { amountCents: number; payerEmail: string; participantEmails: string[] }[],
): MemberBalance[] {
  void memberEmails;
  void expenses;
  return [];
}
