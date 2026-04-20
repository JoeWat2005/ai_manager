import { PricingTable } from "@clerk/nextjs";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isPaidPlan } from "@/lib/billing/effective-plan";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { prisma } from "@/lib/prisma";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  const timelineItems = await prisma.subscriptionItem.findMany({
    where: {
      subscription: {
        organizationId: organization.id,
      },
    },
    select: {
      id: true,
      plan: true,
      status: true,
      periodStart: true,
      periodEnd: true,
    },
    orderBy: [{ periodStart: "desc" }, { id: "desc" }],
  });

  // effectivePlan already computed inside getOrganizationByClerkOrgId — no re-derive needed.
  const { effectivePlan } = organization;

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        eyebrow="Billing"
        title="Plan and billing management"
        description="Clerk-native billing surface with your current effective plan summary."
      />

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>Effective plan from the synced subscription timeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant={isPaidPlan(effectivePlan) ? "default" : "outline"}>
              {effectivePlan}
            </Badge>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timelineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.plan}</TableCell>
                      <TableCell className="capitalize">{item.status}</TableCell>
                      <TableCell>
                        {item.periodStart ? item.periodStart.toLocaleDateString() : "-"} -{" "}
                        {item.periodEnd ? item.periodEnd.toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {timelineItems.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-sm text-muted-foreground"
                      >
                        No subscription events synced yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upgrade or manage plan</CardTitle>
            <CardDescription>
              Use Clerk billing for upgrades, downgrades, and checkout flows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PricingTable
              for="organization"
              newSubscriptionRedirectUrl={`/${organization.slug}/dashboard/billing`}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
