-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('confirmed', 'completed', 'canceled', 'no_show');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('manual', 'chat', 'phone', 'admin');

-- CreateEnum
CREATE TYPE "ConversationMessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "LinkPlatform" AS ENUM ('custom', 'website', 'linkedin', 'instagram', 'facebook', 'x', 'youtube', 'tiktok', 'whatsapp');

-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('lead_captured', 'booking_confirmed', 'transcript_ready', 'billing_changed', 'booking_canceled');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('unread', 'read', 'archived');

-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('settings_updated', 'customization_updated', 'link_created', 'link_updated', 'link_deleted', 'booking_created', 'booking_updated', 'lead_status_changed', 'notification_marked', 'organization_updated', 'billing_updated');

-- AlterTable
ALTER TABLE "ReceptionConversation" ADD COLUMN     "leadId" TEXT;

-- CreateTable
CREATE TABLE "ReceptionConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "ConversationMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceptionConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceptionCallRecording" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "recordingUrl" TEXT,
    "storageProvider" TEXT,
    "durationSeconds" INTEGER,
    "transcriptText" TEXT,
    "transcriptSummary" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceptionCallRecording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "slotLengthMinutes" INTEGER NOT NULL DEFAULT 30,
    "openingHoursJson" JSONB NOT NULL,
    "instantConfirm" BOOLEAN NOT NULL DEFAULT true,
    "autoAssign" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookableStaffProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "membershipId" TEXT,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "bookable" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookableStaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookableStaffAvailability" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookableStaffAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "staffProfileId" TEXT,
    "conversationId" TEXT,
    "source" "BookingSource" NOT NULL DEFAULT 'manual',
    "status" "BookingStatus" NOT NULL DEFAULT 'confirmed',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "service" TEXT,
    "notes" TEXT,
    "preferredStaffName" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationLinkProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT '#2563eb',
    "buttonStyle" TEXT NOT NULL DEFAULT 'solid',
    "showBranding" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationLinkProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationLinkItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "platform" "LinkPlatform" NOT NULL DEFAULT 'custom',
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationLinkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationPageCustomization" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "landingHeroTitle" TEXT NOT NULL DEFAULT 'AI receptionist support for your business',
    "landingHeroSubtitle" TEXT NOT NULL DEFAULT 'Capture leads, qualify intent, and book callbacks in one flow.',
    "landingPrimaryCtaLabel" TEXT NOT NULL DEFAULT 'Book now',
    "landingSecondaryCtaLabel" TEXT NOT NULL DEFAULT 'Start AI chat',
    "landingShowBookingForm" BOOLEAN NOT NULL DEFAULT true,
    "landingShowChatWidget" BOOLEAN NOT NULL DEFAULT true,
    "landingAccentColor" TEXT NOT NULL DEFAULT '#2563eb',
    "linksTitle" TEXT NOT NULL DEFAULT 'Find us online',
    "linksBio" TEXT,
    "linksAccentColor" TEXT NOT NULL DEFAULT '#2563eb',
    "linksButtonStyle" TEXT NOT NULL DEFAULT 'solid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationPageCustomization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "NotificationEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'unread',
    "metadataJson" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" "AuditActionType" NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "description" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReceptionConversationMessage_conversationId_createdAt_idx" ON "ReceptionConversationMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReceptionCallRecording_conversationId_key" ON "ReceptionCallRecording"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSettings_organizationId_key" ON "BookingSettings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "BookableStaffProfile_membershipId_key" ON "BookableStaffProfile"("membershipId");

-- CreateIndex
CREATE INDEX "BookableStaffProfile_organizationId_bookable_idx" ON "BookableStaffProfile"("organizationId", "bookable");

-- CreateIndex
CREATE INDEX "BookableStaffAvailability_staffProfileId_weekday_idx" ON "BookableStaffAvailability"("staffProfileId", "weekday");

-- CreateIndex
CREATE INDEX "Booking_organizationId_startAt_idx" ON "Booking"("organizationId", "startAt");

-- CreateIndex
CREATE INDEX "Booking_organizationId_status_idx" ON "Booking"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Booking_staffProfileId_startAt_idx" ON "Booking"("staffProfileId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationLinkProfile_organizationId_key" ON "OrganizationLinkProfile"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationLinkItem_profileId_sortOrder_idx" ON "OrganizationLinkItem"("profileId", "sortOrder");

-- CreateIndex
CREATE INDEX "OrganizationLinkItem_organizationId_visible_sortOrder_idx" ON "OrganizationLinkItem"("organizationId", "visible", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationPageCustomization_organizationId_key" ON "OrganizationPageCustomization"("organizationId");

-- CreateIndex
CREATE INDEX "NotificationEvent_organizationId_createdAt_idx" ON "NotificationEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationEvent_organizationId_status_idx" ON "NotificationEvent"("organizationId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_action_idx" ON "AuditLog"("organizationId", "action");

-- AddForeignKey
ALTER TABLE "ReceptionConversation" ADD CONSTRAINT "ReceptionConversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "ReceptionLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionConversationMessage" ADD CONSTRAINT "ReceptionConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ReceptionConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionCallRecording" ADD CONSTRAINT "ReceptionCallRecording_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ReceptionConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSettings" ADD CONSTRAINT "BookingSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookableStaffProfile" ADD CONSTRAINT "BookableStaffProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookableStaffProfile" ADD CONSTRAINT "BookableStaffProfile_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookableStaffAvailability" ADD CONSTRAINT "BookableStaffAvailability_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "BookableStaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "BookableStaffProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ReceptionConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationLinkProfile" ADD CONSTRAINT "OrganizationLinkProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationLinkItem" ADD CONSTRAINT "OrganizationLinkItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationLinkItem" ADD CONSTRAINT "OrganizationLinkItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "OrganizationLinkProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationPageCustomization" ADD CONSTRAINT "OrganizationPageCustomization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
