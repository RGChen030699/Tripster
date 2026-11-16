import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  const existing = globalForPrisma.prisma;
  if (existing) {
    return existing;
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  globalForPrisma.prisma = prisma;
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  const existing = globalForPrisma.prisma;
  if (!existing) {
    return;
  }
  await existing.$disconnect();
  globalForPrisma.prisma = undefined;
}

export async function resetDatabase(): Promise<void> {
  await getPrisma().$executeRawUnsafe(
    `TRUNCATE TABLE "ExpenseParticipant", "Expense", "ItineraryItem", "Vote", "Suggestion", "Membership", "Trip", "Session", "User" RESTART IDENTITY CASCADE`,
  );
}
