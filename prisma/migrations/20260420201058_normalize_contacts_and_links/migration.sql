-- DropForeignKey
ALTER TABLE "OrganizationLinkItem" DROP CONSTRAINT "OrganizationLinkItem_organizationId_fkey";

-- DropIndex
DROP INDEX "OrganizationLinkItem_organizationId_visible_sortOrder_idx";

-- CreateTable
CREATE TABLE "OrganizationContact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "normalizedPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationContact_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "contactId" TEXT;

-- AlterTable
ALTER TABLE "ReceptionLead" ADD COLUMN "contactId" TEXT;

WITH contact_sources AS (
    SELECT
        "organizationId" AS organization_id,
        NULLIF(BTRIM("customerName"), '') AS name,
        NULLIF(LOWER(BTRIM("customerEmail")), '') AS email,
        NULLIF(BTRIM("customerPhone"), '') AS phone,
        CASE
            WHEN LENGTH(REGEXP_REPLACE(COALESCE("customerPhone", ''), '[^\d+]', '', 'g')) >= 7
                THEN REGEXP_REPLACE("customerPhone", '[^\d+]', '', 'g')
            ELSE NULL
        END AS normalized_phone,
        "createdAt" AS created_at
    FROM "Booking"
    UNION ALL
    SELECT
        "organizationId" AS organization_id,
        NULLIF(BTRIM("name"), '') AS name,
        NULL AS email,
        NULLIF(BTRIM("phone"), '') AS phone,
        CASE
            WHEN LENGTH(REGEXP_REPLACE(COALESCE("phone", ''), '[^\d+]', '', 'g')) >= 7
                THEN REGEXP_REPLACE("phone", '[^\d+]', '', 'g')
            ELSE NULL
        END AS normalized_phone,
        "createdAt" AS created_at
    FROM "ReceptionLead"
),
normalized_contacts AS (
    SELECT
        CASE
            WHEN normalized_phone IS NOT NULL
                THEN MD5(CONCAT_WS('|', organization_id, 'phone', normalized_phone))
            WHEN email IS NOT NULL
                THEN MD5(CONCAT_WS('|', organization_id, 'email', email))
            WHEN name IS NOT NULL
                THEN MD5(CONCAT_WS('|', organization_id, 'name', LOWER(name)))
            ELSE NULL
        END AS id,
        organization_id,
        name,
        email,
        phone,
        normalized_phone,
        created_at
    FROM contact_sources
    WHERE name IS NOT NULL OR email IS NOT NULL OR normalized_phone IS NOT NULL
)
INSERT INTO "OrganizationContact" (
    "id",
    "organizationId",
    "name",
    "email",
    "phone",
    "normalizedPhone",
    "createdAt",
    "updatedAt"
)
SELECT
    id,
    organization_id,
    name,
    email,
    phone,
    normalized_phone,
    created_at,
    CURRENT_TIMESTAMP
FROM normalized_contacts
WHERE id IS NOT NULL
ON CONFLICT ("id") DO UPDATE SET
    "name" = COALESCE("OrganizationContact"."name", EXCLUDED."name"),
    "email" = COALESCE("OrganizationContact"."email", EXCLUDED."email"),
    "phone" = COALESCE("OrganizationContact"."phone", EXCLUDED."phone"),
    "normalizedPhone" = COALESCE("OrganizationContact"."normalizedPhone", EXCLUDED."normalizedPhone"),
    "updatedAt" = CURRENT_TIMESTAMP;

WITH booking_contact_map AS (
    SELECT
        "id" AS booking_id,
        CASE
            WHEN LENGTH(REGEXP_REPLACE(COALESCE("customerPhone", ''), '[^\d+]', '', 'g')) >= 7
                THEN MD5(CONCAT_WS('|', "organizationId", 'phone', REGEXP_REPLACE("customerPhone", '[^\d+]', '', 'g')))
            WHEN NULLIF(LOWER(BTRIM("customerEmail")), '') IS NOT NULL
                THEN MD5(CONCAT_WS('|', "organizationId", 'email', LOWER(BTRIM("customerEmail"))))
            WHEN NULLIF(BTRIM("customerName"), '') IS NOT NULL
                THEN MD5(CONCAT_WS('|', "organizationId", 'name', LOWER(BTRIM("customerName"))))
            ELSE NULL
        END AS contact_id
    FROM "Booking"
)
UPDATE "Booking" AS booking
SET "contactId" = booking_contact_map.contact_id
FROM booking_contact_map
WHERE booking."id" = booking_contact_map.booking_id;

WITH lead_contact_map AS (
    SELECT
        "id" AS lead_id,
        CASE
            WHEN LENGTH(REGEXP_REPLACE(COALESCE("phone", ''), '[^\d+]', '', 'g')) >= 7
                THEN MD5(CONCAT_WS('|', "organizationId", 'phone', REGEXP_REPLACE("phone", '[^\d+]', '', 'g')))
            WHEN NULLIF(BTRIM("name"), '') IS NOT NULL
                THEN MD5(CONCAT_WS('|', "organizationId", 'name', LOWER(BTRIM("name"))))
            ELSE NULL
        END AS contact_id
    FROM "ReceptionLead"
)
UPDATE "ReceptionLead" AS lead
SET "contactId" = lead_contact_map.contact_id
FROM lead_contact_map
WHERE lead."id" = lead_contact_map.lead_id;

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "contactId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Booking"
DROP COLUMN "customerEmail",
DROP COLUMN "customerName",
DROP COLUMN "customerPhone";

-- AlterTable
ALTER TABLE "OrganizationLinkItem" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "ReceptionLead"
DROP COLUMN "name",
DROP COLUMN "phone";

-- CreateIndex
CREATE INDEX "OrganizationContact_organizationId_createdAt_idx" ON "OrganizationContact"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "OrganizationContact_organizationId_normalizedPhone_idx" ON "OrganizationContact"("organizationId", "normalizedPhone");

-- CreateIndex
CREATE INDEX "OrganizationContact_organizationId_email_idx" ON "OrganizationContact"("organizationId", "email");

-- AddForeignKey
ALTER TABLE "OrganizationContact" ADD CONSTRAINT "OrganizationContact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionLead" ADD CONSTRAINT "ReceptionLead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "OrganizationContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "OrganizationContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
