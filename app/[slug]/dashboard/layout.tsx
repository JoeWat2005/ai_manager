import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthRecovery } from "@/app/components/AuthRecovery";
import { DashboardSidebarNav } from "@/components/dashboard/DashboardSidebarNav";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
    <div data-theme="light" className="min-h-screen bg-muted/30">
      <AuthRecovery />

      {/* DaisyUI drawer keeps mobile overlay working without adding JS state */}
      <div className="drawer lg:drawer-open">
        <input id="dashboard-nav-drawer" type="checkbox" className="drawer-toggle" />

        {/* ── Main content ── */}
        <div className="drawer-content flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                {/* Mobile hamburger */}
                <label
                  htmlFor="dashboard-nav-drawer"
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
                  aria-label="Open dashboard menu"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
                    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </label>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
                    Deskcaptain
                  </p>
                  <p className="text-sm font-semibold text-foreground">{slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UserButton />
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>

        {/* ── Sidebar ── */}
        <div className="drawer-side z-40">
          <label
            htmlFor="dashboard-nav-drawer"
            aria-label="Close dashboard menu"
            className="drawer-overlay"
          />
          <aside className="flex min-h-full w-72 flex-col border-r border-border bg-background">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-4">
              <Image
                src="/deskcaptain.png"
                alt="Deskcaptain"
                width={36}
                height={36}
                className="rounded-xl"
              />
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
                  Workspace
                </p>
                <p className="text-sm font-bold text-foreground">Deskcaptain</p>
              </div>
            </div>

            <Separator />

            {/* Nav */}
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <DashboardSidebarNav slug={slug} />
            </div>

            <Separator />

            {/* Footer links */}
            <div className="flex flex-col gap-1.5 px-3 py-3">
              <Link
                href={`/${slug}/landing`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-start")}
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
                  <path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Business landing
              </Link>
              <Link
                href={`/${slug}/links`}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full justify-start")}
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
                  <path d="M10 13a4 4 0 0 1 0-6l1.5-1.5a4 4 0 0 1 5.66 5.66L16 12m-2 1a4 4 0 0 1 0 6l-1.5 1.5a4 4 0 1 1-5.66-5.66L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Public links
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
