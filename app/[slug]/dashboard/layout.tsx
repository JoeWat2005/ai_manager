import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthRecovery } from "@/app/components/AuthRecovery";
import { DashboardSidebarNav } from "@/components/dashboard/DashboardSidebarNav";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { userId, orgId, orgSlug } = await auth();
  const { slug } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  if (!orgId || !orgSlug) {
    redirect("/onboarding");
  }

  if (orgSlug !== slug) {
    redirect(`/${orgSlug}/dashboard`);
  }

  return (
    <div data-theme="light" className="min-h-screen bg-base-200/50">
      <AuthRecovery />
      <div className="drawer lg:drawer-open">
        <input id="dashboard-nav-drawer" type="checkbox" className="drawer-toggle" />

        <div className="drawer-content flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="dashboard-nav-drawer"
                  className="btn btn-square btn-ghost lg:hidden"
                  aria-label="Open dashboard menu"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 7h16M4 12h16M4 17h16"
                      className="stroke-current"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </label>
                <div>
                  <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
                    Deskcaptain
                  </p>
                  <p className="text-sm font-semibold text-base-content">{slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden min-[560px]:block">
                  <OrganizationSwitcher hidePersonal />
                </div>
                <UserButton />
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-8 pt-5 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>

        <div className="drawer-side z-40">
          <label
            htmlFor="dashboard-nav-drawer"
            aria-label="Close dashboard menu"
            className="drawer-overlay"
          />
          <aside className="min-h-full w-80 border-r border-base-300 bg-base-100">
            <div className="flex h-full flex-col">
              <div className="border-b border-base-300 p-5">
                <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                  Operations
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-base-content">
                  Deskcaptain Console
                </h2>
                <p className="mt-2 text-sm text-base-content/70">
                  Run bookings, leads, and AI receptionist workflows from one place.
                </p>
              </div>

              <div className="px-4 py-4">
                <DashboardSidebarNav slug={slug} />
              </div>

              <div className="mt-auto space-y-3 border-t border-base-300 px-4 py-4">
                <Link href={`/${slug}/landing`} className="btn btn-outline btn-sm w-full">
                  View Public Landing
                </Link>
                <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                  <p className="text-xs font-semibold tracking-wide text-base-content uppercase">
                    Workspace
                  </p>
                  <p className="mt-1 text-sm text-base-content/70">
                    Keep your receptionist settings updated before going live.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
