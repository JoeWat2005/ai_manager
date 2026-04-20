import { Suspense } from "react";
import Link from "next/link";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { prisma } from "@/lib/prisma";

// ─── Skeleton shown while each stat streams in ────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-1 h-9 w-14" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

// ─── Async stat components — each streams independently via Suspense ───────

async function NewLeadsCard({ organizationId }: { organizationId: string }) {
  const count = await prisma.receptionLead.count({
    where: { organizationId, status: "new" },
  });
  return (
    <AnimatedCard>
      <CardHeader>
        <CardDescription>New leads</CardDescription>
        <CardTitle className="text-3xl font-black tabular-nums text-primary">{count}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">Awaiting first follow-up</p>
      </CardContent>
    </AnimatedCard>
  );
}

async function UpcomingBookingsCard({ organizationId }: { organizationId: string }) {
  const count = await prisma.booking.count({
    where: {
      organizationId,
      startAt: { gte: new Date() },
      status: { in: ["confirmed"] },
    },
  });
  return (
    <AnimatedCard delay={0.05}>
      <CardHeader>
        <CardDescription>Upcoming bookings</CardDescription>
        <CardTitle className="text-3xl font-black tabular-nums">{count}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">Confirmed appointments</p>
      </CardContent>
    </AnimatedCard>
  );
}

async function RecentConversationsCard({ organizationId }: { organizationId: string }) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const count = await prisma.receptionConversation.count({
    where: {
      organizationId,
      createdAt: { gte: sevenDaysAgo },
    },
  });
  return (
    <AnimatedCard delay={0.1}>
      <CardHeader>
        <CardDescription>Chats / calls (7d)</CardDescription>
        <CardTitle className="text-3xl font-black tabular-nums">{count}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">Transcript history ready</p>
      </CardContent>
    </AnimatedCard>
  );
}

async function UnreadNotificationsCard({ organizationId }: { organizationId: string }) {
  const count = await prisma.notificationEvent.count({
    where: { organizationId, status: "unread" },
  });
  return (
    <AnimatedCard delay={0.15}>
      <CardHeader>
        <CardDescription>Unread notifications</CardDescription>
        <CardTitle className="text-3xl font-black tabular-nums">{count}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">Operational alerts and updates</p>
      </CardContent>
    </AnimatedCard>
  );
}

// ─── Navigation link card ──────────────────────────────────────────────────

function NavCard({
  href,
  label,
  title,
  description,
}: {
  href: string;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardHeader>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-base font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  return (
    <main className="space-y-6">
      {/* Hero — renders immediately after org lookup */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -top-28 right-0 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-24 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Command Center
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">
              {organization.name} operations overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Monitor leads, bookings, chats, and team activity from one place.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              href={`/${slug}/dashboard/leads`}
            >
              Open lead queue
            </Link>
            <Link
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              href={`/${slug}/dashboard/bookings`}
            >
              Manage bookings
            </Link>
            <Badge variant="outline" className="self-start sm:self-auto">
              Plan: {organization.effectivePlan}
            </Badge>
          </div>
        </div>
      </section>

      {/* Stats — each card streams independently as its COUNT query resolves */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Suspense fallback={<StatCardSkeleton />}>
          <NewLeadsCard organizationId={organization.id} />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <UpcomingBookingsCard organizationId={organization.id} />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <RecentConversationsCard organizationId={organization.id} />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <UnreadNotificationsCard organizationId={organization.id} />
        </Suspense>
      </section>

      {/* Quick navigation */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <NavCard
          href={`/${slug}/dashboard/chats`}
          label="Inbox"
          title="Chats & transcripts"
          description="Review web chat transcripts and phone call recording metadata."
        />
        <NavCard
          href={`/${slug}/dashboard/links`}
          label="Growth"
          title="Links profile"
          description="Manage linktree-style social links for your public profile."
        />
        <NavCard
          href={`/${slug}/dashboard/customization`}
          label="Brand"
          title="Page customization"
          description="Curated controls for landing hero copy, CTA labels, and accent color."
        />
        <NavCard
          href={`/${slug}/dashboard/organization`}
          label="Admin"
          title="Organization"
          description="Manage members, invites, and organization profile with Clerk."
        />
        <NavCard
          href={`/${slug}/dashboard/billing`}
          label="Plan"
          title="Billing"
          description="Upgrade and manage billing without leaving the dashboard."
        />
        <NavCard
          href={`/${slug}/dashboard/settings`}
          label="Configuration"
          title="Settings"
          description="Business profile, receptionist config, and accessibility preferences."
        />
      </section>
    </main>
  );
}
