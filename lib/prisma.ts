// lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

type ReceptionAwareClient = {
  receptionistConfig?: unknown;
  receptionLead?: unknown;
  receptionConversation?: unknown;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

function hasReceptionModels(client: PrismaClient): boolean {
  const candidate = client as unknown as ReceptionAwareClient;
  return (
    typeof candidate.receptionistConfig !== "undefined" &&
    typeof candidate.receptionLead !== "undefined" &&
    typeof candidate.receptionConversation !== "undefined"
  );
}

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;

  if (existing && hasReceptionModels(existing)) {
    return existing;
  }

  const fresh = createPrismaClient();

  if (!hasReceptionModels(fresh)) {
    console.warn(
      "[Prisma bootstrap] Client appears stale and does not include receptionist models. Run `npx prisma generate` and restart the dev server."
    );
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = fresh;
  }

  return fresh;
}

export const prisma = getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
