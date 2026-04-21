import {
  ArrowRightIcon,
  BarChartIcon,
  BellIcon,
  CalendarIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  LinkIcon,
  MessageSquareIcon,
  PaletteIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

// ─── Skeletons ────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-1 h-8 w-12" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  );
}

// ─── Async stat cards ─────────────────────────────────────────────────────────

async function NewLeadsCard({ organizationId }: { organizationId: string }) {
  const count = await prisma.receptionLead.count({
    where: { organizationId, status: "new" },
  });
  return (
    <DashboardStatCard
      label="New leads"
      value={count}
      description="Awaiting first follow-up"
      accent
      delay={0}
    />
  );
}

async function UpcomingBookingsCard({ organizationId }: { organizationId: string }) {
  const count = await prisma.booking.count({
    where: { organizationId, startAt: { gte: new Date() }, status: "confirmed" },
  });
  return (
    <DashboardStatCard
      label="Upcoming bookings"
      value={count}
      description="Confirmed appointments"
      delay={0.05}
    />
  );
}

async function RecentChatsCard({ organizationId }: { organizationId: string }) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const count = await prisma.receptionConversation.count({
    where: { organizationId, createdAt: { gte: sevenDaysAgo } },
  });
  return (
    <DashboardStatCard
      label="Chats & calls (7d)"
      value={count}
      description="Transcript history ready"
      delay={0.1}
    />
  );
}

async function UnreadNotificationsCard({ organizationId }: { organizationId: string }) {
  const count = await prisma.notificationEvent.count({
    where: { organizationId, status: "unread" },
  });
  return (
    <DashboardStatCard
      label="Unread notifications"
      value={count}
      description="Operational alerts"
      delay={0.15}
    />
  );
}

// ─── Quick nav card ───────────────────────────────────────────────────────────

function QuickNavCard({
  href,
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-md group-hover:shadow-primary/5">
        <CardHeader className="pb-2">
          <div className="mb-2 flex size-9 items-center justify-center rounded-lg border border-border bg-muted/50 transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
            <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
          <CardDescription className="text-xs">{eyebrow}</CardDescription>
          <CardTitle className="text-sm font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Command Center
            </p>
            <h1 className="mt-1.5 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {organization.name}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Monitor leads, bookings, chats, and team activity from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Link
              href={`/${slug}/dashboard/leads`}
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
            >
              <UsersIcon className="size-3.5" />
              Lead queue
            </Link>
            <Link
              href={`/${slug}/dashboard/bookings`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <CalendarIcon className="size-3.5" />
              Bookings
            </Link>
            <Badge variant="outline" className="self-center">
              Plan: {organization.effectivePlan}
            </Badge>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Suspense fallback={<StatSkeleton />}>
          <NewLeadsCard organizationId={organization.id} />
        </Suspense>
        <Suspense fallback={<StatSkeleton />}>
          <UpcomingBookingsCard organizationId={organization.id} />
        </Suspense>
        <Suspense fallback={<StatSkeleton />}>
          <RecentChatsCard organizationId={organization.id} />
        </Suspense>
        <Suspense fallback={<StatSkeleton />}>
          <UnreadNotificationsCard organizationId={organization.id} />
        </Suspense>
      </section>

      {/* Quick navigation */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Quick access</h2>
          <Link
            href={`/${slug}/dashboard/analytics`}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View analytics
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickNavCard
            href={`/${slug}/dashboard/chats`}
            icon={MessageSquareIcon}
            eyebrow="Inbox"
            title="Chats & transcripts"
            description="Review web chat and phone call transcript history."
          />
          <QuickNavCard
            href={`/${slug}/dashboard/links`}
            icon={LinkIcon}
            eyebrow="Growth"
            title="Links profile"
            description="Manage linktree-style social links for your public profile."
          />
          <QuickNavCard
            href={`/${slug}/dashboard/customization`}
            icon={PaletteIcon}
            eyebrow="Brand"
            title="Page customization"
            description="Curate landing hero copy, CTA labels, and accent color."
          />
          <QuickNavCard
            href={`/${slug}/dashboard/organization`}
            icon={UsersIcon}
            eyebrow="Admin"
            title="Organization"
            description="Manage members, invites, and organization profile."
          />
          <QuickNavCard
            href={`/${slug}/dashboard/billing`}
            icon={CreditCardIcon}
            eyebrow="Plan"
            title="Billing"
            description="Upgrade and manage your subscription plan."
          />
          <QuickNavCard
            href={`/${slug}/dashboard/settings`}
            icon={SettingsIcon}
            eyebrow="Configuration"
            title="Settings"
            description="Business profile, receptionist config, and accessibility."
          />
        </div>
      </section>
    </div>
  );
}
