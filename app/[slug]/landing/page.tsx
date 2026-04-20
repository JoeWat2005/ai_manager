import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicBookingForm } from "@/components/reception/PublicBookingForm";
import { getOrCreateLinkProfile, getOrCreatePageCustomization } from "@/lib/dashboard/org-resources";
import { getOrCreateReceptionistConfig, getOrganizationBySlug } from "@/lib/reception/org";

const WebChatWidget = dynamic(
  () => import("@/components/reception/WebChatWidget").then((mod) => mod.WebChatWidget),
  {
    loading: () => (
      <section className="rounded-2xl border border-slate-200 bg-base-100 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Loading AI booking assistant...</h2>
        <p className="mt-2 text-sm text-slate-600">Preparing chat context and receptionist settings.</p>
      </section>
    ),
  }
);

export default async function OrgLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  const [customization, linksProfile] = await Promise.all([
    getOrCreatePageCustomization(organization.id, organization.name),
    getOrCreateLinkProfile(organization.id, `${organization.name} links`),
  ]);

  let phoneExtension: string | null = null;
  let phoneEnabled = false;
  let chatEnabled = false;
  let timezone = "Europe/London";

  if (organization.hasPaidPlan) {
    const config = await getOrCreateReceptionistConfig(
      organization.id,
      "missing-email@deskcaptain.local"
    );
    phoneExtension = config.phoneExtension;
    phoneEnabled = config.phoneEnabled;
    chatEnabled = config.chatEnabled;
    timezone = config.timezone;
  }

  return (
    <main className="min-h-screen bg-base-200/40 pb-12 pt-6">
      <div className="app-shell space-y-6">
        <header className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.17em] text-primary uppercase">
                {organization.name}
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                {customization.landingHeroTitle}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                {customization.landingHeroSubtitle}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/${slug}/links`} className="btn btn-outline btn-sm">
                View links page
              </Link>
              <Link href={`/${slug}/dashboard`} className="btn btn-ghost btn-sm">
                Business dashboard
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="app-card">
            <div className="card-body py-4">
              <p className="text-xs uppercase tracking-wide text-base-content/60">Coverage</p>
              <p className="text-2xl font-black">24/7 inbound</p>
              <p className="text-xs text-base-content/70">Timezone defaults: {timezone}</p>
            </div>
          </article>
          <article className="app-card">
            <div className="card-body py-4">
              <p className="text-xs uppercase tracking-wide text-base-content/60">Phone extension</p>
              <p className="text-2xl font-black">{phoneEnabled && phoneExtension ? phoneExtension : "Not enabled"}</p>
              <p className="text-xs text-base-content/70">Shared UK number with org extension routing</p>
            </div>
          </article>
          <article className="app-card">
            <div className="card-body py-4">
              <p className="text-xs uppercase tracking-wide text-base-content/60">AI concierge</p>
              <p className="text-2xl font-black">{chatEnabled ? "Online" : "Offline"}</p>
              <p className="text-xs text-base-content/70">Lead qualification + callback capture</p>
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            {customization.landingShowBookingForm && (
              <PublicBookingForm slug={slug} ctaLabel={customization.landingPrimaryCtaLabel} />
            )}

            <article className="app-card">
              <div className="card-body">
                <h2 className="card-title">Need something else?</h2>
                <p className="text-sm text-base-content/70">
                  You can still call us and request a callback anytime. Calls may be recorded and
                  handled by AI for service quality.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="badge badge-outline">Recording disclosure enabled</span>
                  <span className="badge badge-outline">Callback consent capture</span>
                  {linksProfile.items.filter((item) => item.visible).length > 0 && (
                    <Link href={`/${slug}/links`} className="badge badge-primary badge-outline">
                      Social links available
                    </Link>
                  )}
                </div>
              </div>
            </article>
          </div>

          <div className="xl:sticky xl:top-6 xl:self-start">
            {customization.landingShowChatWidget && chatEnabled ? (
              <WebChatWidget slug={slug} />
            ) : (
              <article className="app-card">
                <div className="card-body">
                  <h2 className="card-title">AI chat currently unavailable</h2>
                  <p className="text-sm text-base-content/70">
                    Chat assistant is currently disabled. Please use the booking form or phone flow.
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ borderColor: customization.landingAccentColor, color: customization.landingAccentColor }}
                  >
                    {customization.landingSecondaryCtaLabel}
                  </button>
                </div>
              </article>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

