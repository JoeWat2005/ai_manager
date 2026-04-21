"use server";

import { clerkClient, auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function inviteMember(formData: FormData) {
  const { orgId, orgSlug } = await auth();
  if (!orgId || !orgSlug) throw new Error("Not authorized");

  const emailAddress = formData.get("email") as string;
  const role = (formData.get("role") as string) || "org:member";

  if (!emailAddress) throw new Error("Email is required");

  const clerk = await clerkClient();
  await clerk.organizations.createOrganizationInvitation({
    organizationId: orgId,
    emailAddress,
    role,
  });

  revalidatePath(`/${orgSlug}/dashboard/organization`);
}

export async function revokeMember(formData: FormData) {
  const { orgId, orgSlug } = await auth();
  if (!orgId || !orgSlug) throw new Error("Not authorized");

  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("User ID is required");

  const clerk = await clerkClient();
  await clerk.organizations.deleteOrganizationMembership({
    organizationId: orgId,
    userId,
  });

  revalidatePath(`/${orgSlug}/dashboard/organization`);
}

export async function revokeInvitation(formData: FormData) {
  const { orgId, orgSlug, userId } = await auth();
  if (!orgId || !orgSlug || !userId) throw new Error("Not authorized");

  const invitationId = formData.get("invitationId") as string;
  if (!invitationId) throw new Error("Invitation ID is required");

  const clerk = await clerkClient();
  await clerk.organizations.revokeOrganizationInvitation({
    organizationId: orgId,
    invitationId,
    requestingUserId: userId,
  });

  revalidatePath(`/${orgSlug}/dashboard/organization`);
}
