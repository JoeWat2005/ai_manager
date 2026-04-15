import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthRecovery } from "@/app/components/AuthRecovery";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { userId, orgId } = await auth();
  const { slug } = await params;

  if (!userId || !orgId) {
    redirect("/");
  }

  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId: orgId },
    select: { slug: true },
  });

  if (!organization) {
    redirect("/");
  }

  if (organization.slug !== slug) {
    redirect("/");
  }

  return (
    <div>
      <AuthRecovery />
      <header className="flex items-center justify-between border-b p-4">
        <OrganizationSwitcher hidePersonal />
        <UserButton />
      </header>
      {children}
    </div>
  );
}
