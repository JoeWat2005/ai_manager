import { InboxIcon } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { startTimer } from "@/lib/perf";
import { prisma } from "@/lib/prisma";

export default async function EnquiriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  const tData = startTimer(`enquiries data [org=${organization.id}]`);

  // Two parallel queries: contacts + total lead count for the org.
  // Using select instead of include for contacts to avoid pulling createdAt/updatedAt noise.
  const [contacts, totalLeadCount] = await Promise.all([
    prisma.organizationContact.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        receptionLeads: {
          select: {
            id: true,
            channel: true,
            intent: true,
            status: true,
            qualified: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.receptionLead.count({
      where: { organizationId: organization.id },
    }),
  ]);

  tData();

  const contactsWithEmail = contacts.filter((c) => c.email ?? c.phone).length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Enquiries"
        title="Contact enquiries"
        description="All inbound contacts captured by the AI receptionist and their lead history."
      />

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription className="text-xs">Total contacts</CardDescription>
            <CardTitle className="text-3xl font-black tabular-nums">{contacts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Unique callers and visitors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="text-xs">Total leads</CardDescription>
            <CardTitle className="text-3xl font-black tabular-nums">{totalLeadCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Reception interactions logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="text-xs">With contact info</CardDescription>
            <CardTitle className="text-3xl font-black tabular-nums">
              {contactsWithEmail}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Have email or phone on record</p>
          </CardContent>
        </Card>
      </div>

      {/* Contact list */}
      {contacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <InboxIcon className="size-8 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground">No enquiries yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Contacts captured by the AI receptionist will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {contacts.map((contact) => {
            const hasLeads = contact.receptionLeads.length > 0;
            const latestLead = contact.receptionLeads[0];

            return (
              <Card key={contact.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {contact.name ?? "Unknown contact"}
                      </CardTitle>
                      <CardDescription className="truncate text-xs">
                        {[contact.email, contact.phone].filter(Boolean).join(" · ") ||
                          "No contact details"}
                      </CardDescription>
                    </div>
                    {hasLeads && (
                      <Badge variant="secondary" className="shrink-0">
                        {contact.receptionLeads.length}{" "}
                        {contact.receptionLeads.length === 1 ? "lead" : "leads"}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                {hasLeads && (
                  <CardContent className="pt-0">
                    <ul className="flex flex-col gap-1.5">
                      {contact.receptionLeads.map((lead) => (
                        <li
                          key={lead.id}
                          className="flex items-center gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs"
                        >
                          <span className="shrink-0 font-medium capitalize text-foreground/70">
                            {lead.channel}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="truncate text-muted-foreground">
                            {lead.intent ?? "No intent recorded"}
                          </span>
                          <Badge
                            variant={lead.status === "new" ? "default" : "outline"}
                            className="ml-auto shrink-0 text-[10px]"
                          >
                            {lead.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                    {latestLead && (
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Last activity:{" "}
                        {new Date(latestLead.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
