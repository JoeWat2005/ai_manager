import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthRecovery } from "@/app/components/AuthRecovery";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

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
        <header className="sticky top-0 z-30 flex h-13 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur-md">
          <SidebarTrigger className="-ml-0.5 text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
            <DashboardBreadcrumb slug={slug} />
            <div className="flex shrink-0 items-center gap-2">
              <DashboardSearch slug={slug} />
              <UserButton />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
