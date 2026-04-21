// lib/prisma.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Extend globalThis so we can cache Prisma in dev (avoid hot-reload issues)
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// This type is used ONLY to check if your Prisma client is up-to-date
type MvpAwareClient = {
  organizationContact?: unknown;
  receptionistConfig?: unknown;
  receptionLead?: unknown;
  receptionConversation?: unknown;
  bookingSettings?: unknown;
  organizationLinkProfile?: unknown;
  organizationPageCustomization?: unknown;
};

// Create a brand new Prisma client
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  // Fail fast if DB connection is missing
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // Use Prisma Postgres adapter (instead of default driver)
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

// Check if Prisma client includes expected models (prevents stale client issues)
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

// Main function that returns the Prisma client
function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;

  // Reuse existing client if it exists AND is valid
  if (existing && hasMvpModels(existing)) {
    return existing;
  }

  // Otherwise create a fresh one
  const fresh = createPrismaClient();

  // Warn if Prisma client is outdated (common dev issue)
  if (!hasMvpModels(fresh)) {
    console.warn(
      "[Prisma bootstrap] Client appears stale and does not include MVP models. Run `npx prisma generate` and restart the dev server."
    );
  }

  // Cache client globally in development (prevents multiple instances)
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = fresh;
  }

  return fresh;
}

// Export the singleton Prisma client
export const prisma = getPrismaClient();

// Extra safety: ensure global cache is set in dev
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

