import { CheckIcon, CreditCardIcon, SettingsIcon, SparklesIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import { BillingTimelineTable } from "@/components/dashboard/BillingTimelineTable";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { ManageBillingButton } from "@/components/dashboard/ManageBillingButton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { isPaidPlan } from "@/lib/billing/effective-plan";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "£0",
    period: "forever",
    description: "Test workflows before go-live.",
    features: ["Landing page", "Basic dashboard", "Manual bookings"],
    planKey: "starter",
  },
  {
    name: "Pro",
    price: "£79",
    period: "/ month",
    description: "Full AI receptionist for live operations.",
    features: [
      "Phone + web AI receptionist",
      "Leads + chat transcript inbox",
      "Multi-staff booking auto-assignment",
      "Operational notifications",
      "Audit log",
    ],
    planKey: "pro",
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    description: "Multi-location with dedicated support.",
    features: [
      "Everything in Pro",
      "Higher usage limits",
      "Priority onboarding",
      "Custom workflow support",
    ],
    planKey: "scale",
  },
];

export default async function BillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  const timelineItems = await prisma.subscriptionItem.findMany({
    where: { subscription: { organizationId: organization.id } },
    select: {
      id: true,
      plan: true,
      status: true,
      periodStart: true,
      periodEnd: true,
    },
    orderBy: [{ periodStart: "desc" }, { id: "desc" }],
  });

  const billingRows = timelineItems.map((item) => ({
    id: item.id,
    plan: item.plan,
    status: item.status,
    periodStart: item.periodStart ? item.periodStart.toISOString() : null,
    periodEnd: item.periodEnd ? item.periodEnd.toISOString() : null,
  }));

  const { effectivePlan } = organization;
  const isPaid = isPaidPlan(effectivePlan);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Billing"
        title="Plan and billing"
        description="Manage your subscription and review billing history."
      />

      {/* Current plan status */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardDescription className="text-xs">Current plan</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl font-black capitalize">{effectivePlan}</CardTitle>
              <Badge variant={isPaid ? "default" : "secondary"}>
                {isPaid ? "Active" : "Free"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isPaid ? (
              <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                <span className="inline-flex size-1.5 rounded-full bg-emerald-500" />
                AI receptionist features enabled
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Upgrade to Pro to unlock AI phone and web receptionist.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="text-xs">Workspace</CardDescription>
            <CardTitle className="text-base">{organization.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">/{organization.slug}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="text-xs">Billing events</CardDescription>
            <CardTitle className="text-3xl font-black tabular-nums">
              {timelineItems.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Subscription records synced</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan cards */}
      {!isPaid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <SparklesIcon className="size-4 text-primary" />
              Upgrade your plan
            </CardTitle>
            <CardDescription>
              Unlock the full AI receptionist to capture every inbound opportunity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const isCurrent =
                  effectivePlan.toLowerCase() === plan.planKey ||
                  (effectivePlan === "free" && plan.planKey === "starter");
                return (
                  <div
                    key={plan.name}
                    className={cn(
                      "relative rounded-xl border p-4",
                      plan.planKey === "pro"
                        ? "border-primary/50 bg-primary/3"
                        : "border-border bg-muted/30"
                    )}
                  >
                    {plan.planKey === "pro" && (
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-t-xl" />
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-foreground">{plan.name}</p>
                      {isCurrent && (
                        <Badge variant="outline" className="text-[10px]">Current</Badge>
                      )}
                      {plan.planKey === "pro" && !isCurrent && (
                        <Badge className="text-[10px]">Recommended</Badge>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-foreground">{plan.price}</span>
                      {plan.period && (
                        <span className="text-xs text-muted-foreground">{plan.period}</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-foreground/80">
                          <CheckIcon className="size-3 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && (
                      <Link
                        href="/sign-up"
                        className={cn(
                          "mt-4 block w-full rounded-lg py-2 text-center text-xs font-semibold transition-all",
                          plan.planKey === "pro"
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border border-border bg-background text-foreground hover:bg-muted"
                        )}
                      >
                        {plan.planKey === "scale" ? "Contact sales" : `Upgrade to ${plan.name}`}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manage subscription — paid plans only */}
      {isPaid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <SettingsIcon className="size-4 text-muted-foreground" />
              Manage subscription
            </CardTitle>
            <CardDescription>
              Review your active plan details and manage your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/40 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Your{" "}
                <span className="font-semibold capitalize text-foreground">{effectivePlan}</span>{" "}
                plan is active for{" "}
                <span className="font-semibold text-foreground">{organization.name}</span>. AI phone
                and web receptionist features are enabled.
              </p>
            </div>
            <Separator />
            <div>
              <p className="mb-3 text-xs text-muted-foreground">
                Cancelling will maintain access until the end of the current billing period, then
                the workspace reverts to the free tier.
              </p>
              <ManageBillingButton slug={slug} planName={effectivePlan} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCardIcon className="size-4 text-muted-foreground" />
            Billing history
          </CardTitle>
          <CardDescription>Subscription events synced from payment webhooks.</CardDescription>
        </CardHeader>
        <CardContent>
          <BillingTimelineTable items={billingRows} />
        </CardContent>
      </Card>
    </div>
  );
}
