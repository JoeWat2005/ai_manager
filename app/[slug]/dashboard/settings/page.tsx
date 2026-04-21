import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { AccessibilityPreferencesCard } from "@/components/settings/AccessibilityPreferencesCard";
import {
  ReceptionistConfigForm,
  type ReceptionistConfigInput,
} from "@/components/settings/ReceptionistConfigForm";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getOrCreateReceptionistConfig,
  getOrganizationByClerkOrgId,
  getOrgNotificationFallbackEmail,
} from "@/lib/reception/org";

export default async function SettingsPage({
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
    redirect(`/${organization.slug}/dashboard/settings`);
  }

  let receptionistConfig: ReceptionistConfigInput | null = null;
  let notificationEmail = "Not configured";
  let timezone = "Europe/London";

  if (organization.hasPaidPlan) {
    const fallbackEmail = await getOrgNotificationFallbackEmail(userId);
    const config = await getOrCreateReceptionistConfig(organization.id, fallbackEmail);
    receptionistConfig = {
      phoneExtension: config.phoneExtension,
      notificationEmail: config.notificationEmail,
      faqScript: config.faqScript,
      transferPhone: config.transferPhone,
      phoneEnabled: config.phoneEnabled,
      chatEnabled: config.chatEnabled,
      timezone: config.timezone,
    };
    notificationEmail = config.notificationEmail;
    timezone = config.timezone;
  }

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Manage business profile details, receptionist behavior, and accessibility."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
            <CardDescription>Core workspace identity and public route details.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Business name</dt>
                <dd className="font-semibold text-foreground">{organization.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Slug</dt>
                <dd className="font-semibold text-foreground">{organization.slug}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Plan status</dt>
                <dd>
                  <Badge variant={organization.hasPaidPlan ? "default" : "outline"}>
                    {organization.hasPaidPlan ? "Pro" : "Free"}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Public landing</dt>
                <dd>
                  <Link
                    href={`/${organization.slug}/landing`}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    View page
                  </Link>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations defaults</CardTitle>
            <CardDescription>
              Shared operational settings and access rules for your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Timezone</dt>
                <dd className="font-semibold text-foreground">{timezone}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Lead notifications</dt>
                <dd className="font-semibold text-foreground">{notificationEmail}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Security and access</dt>
                <dd className="mt-2 text-foreground/80">
                  Organization permissions are managed through Clerk organizations, and
                  receptionist APIs enforce strict org scoping.
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>

      <AccessibilityPreferencesCard />

      {organization.hasPaidPlan && receptionistConfig ? (
        <ReceptionistConfigForm initialConfig={receptionistConfig} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Receptionist configuration</CardTitle>
            <CardDescription>
              Receptionist phone and chat configuration is available on paid plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to Pro to configure the AI phone receptionist, chat widget, and notification routing.
            </p>
            <Link
              href={`/${organization.slug}/dashboard/billing`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4"
            >
              View plans and upgrade
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
