-- CreateEnum
CREATE TYPE "ReceptionChannel" AS ENUM ('phone', 'web');

-- CreateEnum
CREATE TYPE "ReceptionLeadStatus" AS ENUM ('new', 'contacted', 'closed');

-- CreateTable
CREATE TABLE "ReceptionistConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "phoneExtension" TEXT NOT NULL,
    "notificationEmail" TEXT NOT NULL,
    "businessHoursJson" JSONB NOT NULL,
    "faqScript" TEXT NOT NULL DEFAULT '',
    "transferPhone" TEXT,
    "phoneEnabled" BOOLEAN NOT NULL DEFAULT true,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceptionistConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceptionLead" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" "ReceptionChannel" NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "intent" TEXT,
    "preferredCallbackWindow" TEXT,
    "callbackReason" TEXT,
    "qualified" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReceptionLeadStatus" NOT NULL DEFAULT 'new',
    "providerConversationId" TEXT,
    "transcript" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceptionLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceptionConversation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" "ReceptionChannel" NOT NULL,
    "provider" TEXT NOT NULL,
    "providerConversationId" TEXT NOT NULL,
    "outcome" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceptionConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceptionistConfig_organizationId_key" ON "ReceptionistConfig"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceptionistConfig_phoneExtension_key" ON "ReceptionistConfig"("phoneExtension");

-- CreateIndex
CREATE INDEX "ReceptionLead_organizationId_createdAt_idx" ON "ReceptionLead"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ReceptionLead_organizationId_status_idx" ON "ReceptionLead"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ReceptionConversation_organizationId_createdAt_idx" ON "ReceptionConversation"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReceptionConversation_provider_providerConversationId_key" ON "ReceptionConversation"("provider", "providerConversationId");

-- AddForeignKey
ALTER TABLE "ReceptionistConfig" ADD CONSTRAINT "ReceptionistConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionLead" ADD CONSTRAINT "ReceptionLead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionConversation" ADD CONSTRAINT "ReceptionConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
