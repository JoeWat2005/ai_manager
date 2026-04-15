// app/api/webhooks/clerk/route.ts
import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkUserEventData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  primary_email_address_id: string | null;
  email_addresses: ClerkEmailAddress[];
};

type ClerkOrganizationEventData = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  created_by: string | null;
};

export async function POST(req: Request) {
  const payload = await req.text();
  const headerPayload = await headers();

  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    return new Response("Missing webhook signing secret", { status: 500 });
  }

  const wh = new Webhook(signingSecret);

  let evt: { type: string; data: unknown };

  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: unknown };
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const user = evt.data as ClerkUserEventData;

    const primaryEmail =
      user.email_addresses?.find(
        (email) => email.id === user.primary_email_address_id
      )?.email_address ?? null;

    await prisma.user.upsert({
      where: { clerkUserId: user.id },
      update: {
        email: primaryEmail ?? "",
        firstName: user.first_name ?? null,
        lastName: user.last_name ?? null,
        imageUrl: user.image_url ?? null,
      },
      create: {
        clerkUserId: user.id,
        email: primaryEmail ?? "",
        firstName: user.first_name ?? null,
        lastName: user.last_name ?? null,
        imageUrl: user.image_url ?? null,
      },
    });
  }

  if (evt.type === "organization.created" || evt.type === "organization.updated") {
    const org = evt.data as ClerkOrganizationEventData;

    let createdByUserId: string | null = null;

    if (org.created_by) {
      const creator = await prisma.user.findUnique({
        where: { clerkUserId: org.created_by },
      });
      createdByUserId = creator?.id ?? null;
    }

    await prisma.organization.upsert({
      where: { clerkOrgId: org.id },
      update: {
        name: org.name,
        slug: org.slug,
        imageUrl: org.image_url ?? null,
        createdByUserId,
      },
      create: {
        clerkOrgId: org.id,
        name: org.name,
        slug: org.slug,
        imageUrl: org.image_url ?? null,
        createdByUserId,
      },
    });
  }

  return new Response("OK");
}
