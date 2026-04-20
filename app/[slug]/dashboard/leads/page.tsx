import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LeadsQueueBoard } from "@/components/dashboard/LeadsQueueBoard";
import { prisma } from "@/lib/prisma";
import { getOrganizationByClerkOrgId } from "@/lib/reception/org";

export default async function LeadsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId, orgId } = await auth();
  const { slug } = await params;

  if (!userId || !orgId) {
    redirect("/sign-in");
  }

  const organization = await getOrganizationByClerkOrgId(orgId);
  if (!organization) {
    redirect("/onboarding");
  }

  if (organization.slug !== slug) {
    redirect(`/${organization.slug}/dashboard/leads`);
  }

  if (!organization.hasPaidPlan) {
    return (
      <main className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-base-100 p-6 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Leads Queue</h1>
          <p className="mt-2 text-sm text-slate-600">
            Lead queue management is included in paid plans. Upgrade to capture and
            manage AI receptionist leads in one place.
          </p>
        </section>
        <PricingTable
          for="organization"
          newSubscriptionRedirectUrl={`/${organization.slug}/dashboard/leads`}
        />
      </main>
    );
  }

  const leads = await prisma.receptionLead.findMany({
    where: {
      organizationId: organization.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 150,
  });

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-base-100 p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Leads
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              Inbound lead queue
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Update lead status as your team follows up callbacks and inquiries.
            </p>
          </div>
          <Link
            href={`/${organization.slug}/dashboard/settings`}
            className="btn btn-outline"
          >
            Settings
          </Link>
        </div>
      </section>

      <LeadsQueueBoard
        initialLeads={leads.map((lead) => ({
          id: lead.id,
          channel: lead.channel,
          name: lead.name,
          phone: lead.phone,
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
