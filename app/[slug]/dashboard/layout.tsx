import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthRecovery } from "@/app/components/AuthRecovery";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { userId, orgId, orgSlug } = await auth();
  const { slug } = await params;

  if (!userId) redirect("/sign-in");
  if (!orgId || !orgSlug) redirect("/onboarding");
  if (orgSlug !== slug) redirect(`/${orgSlug}/dashboard`);

  return (
    <SidebarProvider>
      <AuthRecovery />
      <DashboardSidebar slug={slug} />

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur-md">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <div className="flex flex-1 items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold text-foreground">{slug}</p>
            <div className="flex items-center gap-2">
              <DashboardSearch slug={slug} />
              <UserButton />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
