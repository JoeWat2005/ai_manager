// lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

type MvpAwareClient = {
  organizationContact?: unknown;
  receptionistConfig?: unknown;
  receptionLead?: unknown;
  receptionConversation?: unknown;
  bookingSettings?: unknown;
  organizationLinkProfile?: unknown;
  organizationPageCustomization?: unknown;
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

function hasMvpModels(client: PrismaClient): boolean {
  const candidate = client as unknown as MvpAwareClient;
  return (
    typeof candidate.organizationContact !== "undefined" &&
    typeof candidate.receptionistConfig !== "undefined" &&
    typeof candidate.receptionLead !== "undefined" &&
    typeof candidate.receptionConversation !== "undefined" &&
    typeof candidate.bookingSettings !== "undefined" &&
    typeof candidate.organizationLinkProfile !== "undefined" &&
    typeof candidate.organizationPageCustomization !== "undefined"
  );
}

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;

  if (existing && hasMvpModels(existing)) {
    return existing;
  }

  const fresh = createPrismaClient();

  if (!hasMvpModels(fresh)) {
    console.warn(
      "[Prisma bootstrap] Client appears stale and does not include MVP models. Run `npx prisma generate` and restart the dev server."
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

