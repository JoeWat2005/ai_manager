import { CalendarIcon, CreditCardIcon, FileTextIcon, InboxIcon } from "lucide-react";
import Link from "next/link";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { isPaidPlan } from "@/lib/billing/effective-plan";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { prisma } from "@/lib/prisma";

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "active":
    case "paid":
      return "default";
    case "canceled":
    case "incomplete_expired":
      return "destructive";
    default:
      return "secondary";
  }
}

function formatPeriod(start: Date | null, end: Date | null): string {
  if (!start) return "—";
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

function invoiceRef(index: number, id: string): string {
  const suffix = id.slice(-6).toUpperCase();
  const num = String(index + 1).padStart(4, "0");
  return `INV-${num}-${suffix}`;
}

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  const items = await prisma.subscriptionItem.findMany({
    where: { subscription: { organizationId: organization.id } },
    select: {
      id: true,
      plan: true,
      status: true,
      periodStart: true,
      periodEnd: true,
      clerkSubscriptionItemId: true,
    },
    orderBy: [{ periodStart: "desc" }, { id: "desc" }],
    take: 250,
  });

  const isPaid = isPaidPlan(organization.effectivePlan);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Billing"
        title="Invoices"
        description="Your billing history and subscription payment records."
        actions={
          <Link
            href={`/${slug}/dashboard/billing`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <CreditCardIcon className="mr-1.5 size-3.5" />
            Billing overview
          </Link>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total records</CardDescription>
            <CardTitle className="text-3xl font-black tabular-nums">{items.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Subscription billing periods synced</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Current plan</CardDescription>
            <CardTitle className="text-base capitalize">{organization.effectivePlan}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isPaid ? "AI receptionist features enabled" : "Free tier — upgrade to unlock AI"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Latest period</CardDescription>
            <CardTitle className="text-sm">
              {items[0]
                ? formatPeriod(items[0].periodStart, items[0].periodEnd)
                : "No records yet"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Most recent billing period</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileTextIcon className="size-4 text-muted-foreground" />
            Billing records
          </CardTitle>
          <CardDescription>
            Subscription periods synced from payment webhooks. Contact support for PDF invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <InboxIcon className="size-8 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium text-foreground">No billing records yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Records appear here once a subscription is active and payment webhooks are
                  received.
                </p>
              </div>
              {!isPaid && (
                <Link
                  href={`/${slug}/dashboard/billing`}
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Upgrade your plan
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-6 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                      <FileTextIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {invoiceRef(i, item.id)}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarIcon className="size-3 shrink-0" />
                        {formatPeriod(item.periodStart, item.periodEnd)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-sm font-medium capitalize text-foreground sm:block">
                      {item.plan}
                    </span>
                    <Badge variant={statusVariant(item.status)} className="text-[11px] capitalize">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
