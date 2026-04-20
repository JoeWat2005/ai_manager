import Link from "next/link";
import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AccessibilityPreferencesCard } from "@/components/settings/AccessibilityPreferencesCard";
import {
  ReceptionistConfigForm,
  type ReceptionistConfigInput,
} from "@/components/settings/ReceptionistConfigForm";
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
      <section className="app-card">
        <div className="card-body gap-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Settings
          </p>
          <h1 className="app-title">Workspace settings</h1>
          <p className="app-subtitle">
            Manage business profile details, receptionist behavior, and accessibility.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="app-card">
          <div className="card-body">
            <h2 className="card-title">Business profile</h2>
            <dl className="mt-1 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-base-300 pb-2">
                <dt className="text-base-content/70">Business name</dt>
                <dd className="font-semibold text-base-content">{organization.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-base-300 pb-2">
                <dt className="text-base-content/70">Slug</dt>
                <dd className="font-semibold text-base-content">{organization.slug}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-base-300 pb-2">
                <dt className="text-base-content/70">Plan status</dt>
                <dd>
                  <span
                    className={`badge ${
                      organization.hasPaidPlan ? "badge-primary" : "badge-outline"
                    }`.trim()}
                  >
                    {organization.hasPaidPlan ? "Pro" : "Free"}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-base-content/70">Public landing</dt>
                <dd>
                  <Link href={`/${organization.slug}/landing`} className="link link-primary">
                    View page
                  </Link>
                </dd>
              </div>
            </dl>
          </div>
        </article>

        <article className="app-card">
          <div className="card-body">
            <h2 className="card-title">Operations defaults</h2>
            <dl className="mt-1 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-base-300 pb-2">
                <dt className="text-base-content/70">Timezone</dt>
                <dd className="font-semibold text-base-content">{timezone}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-base-300 pb-2">
                <dt className="text-base-content/70">Lead notifications</dt>
                <dd className="font-semibold text-base-content">{notificationEmail}</dd>
              </div>
              <div>
                <dt className="text-base-content/70">Security and access</dt>
                <dd className="mt-2 text-base-content/80">
                  Organization permissions are managed through Clerk organizations, and
                  receptionist APIs enforce strict org scoping.
                </dd>
              </div>
            </dl>
          </div>
        </article>
      </section>

      <AccessibilityPreferencesCard />

      {organization.hasPaidPlan && receptionistConfig ? (
        <ReceptionistConfigForm initialConfig={receptionistConfig} />
      ) : (
        <section className="app-card">
          <div className="card-body gap-4">
            <h2 className="card-title">Receptionist Configuration</h2>
            <p className="text-sm text-base-content/70">
              Receptionist phone and chat configuration is available on paid plans.
            </p>
            <PricingTable
              for="organization"
              newSubscriptionRedirectUrl={`/${organization.slug}/dashboard/settings`}
            />
          </div>
        </section>
      )}
    </main>
  );
}
