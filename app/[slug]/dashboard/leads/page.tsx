import Link from "next/link";
import { PricingTable } from "@clerk/nextjs";
import { LeadsQueueBoard } from "@/components/dashboard/LeadsQueueBoard";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function LeadsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  if (!organization.hasPaidPlan) {
    return (
      <main className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -top-28 right-0 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Leads</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">Inbound lead queue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Lead queue management is included in paid plans. Upgrade to capture and manage AI receptionist
            leads in one place.
          </p>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>Upgrade to access leads</CardTitle>
          </CardHeader>
          <CardContent>
            <PricingTable
              for="organization"
              newSubscriptionRedirectUrl={`/${organization.slug}/dashboard/leads`}
            />
          </CardContent>
        </Card>
      </main>
    );
  }

  const leads = await prisma.receptionLead.findMany({
    where: { organizationId: organization.id },
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -top-28 right-0 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Leads</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">
              Inbound lead queue
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Update lead status as your team follows up callbacks and inquiries.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{leads.length} total</Badge>
            <Link
              href={`/${organization.slug}/dashboard/settings`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Settings
            </Link>
          </div>
        </div>
      </section>

      <LeadsQueueBoard
        initialLeads={leads.map((lead) => ({
          id: lead.id,
          channel: lead.channel,
          contact: lead.contact
            ? {
                id: lead.contact.id,
                name: lead.contact.name,
                email: lead.contact.email,
                phone: lead.contact.phone,
              }
            : null,
          intent: lead.intent,
          preferredCallbackWindow: lead.preferredCallbackWindow,
          qualified: lead.qualified,
          status: lead.status,
          createdAt: lead.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
